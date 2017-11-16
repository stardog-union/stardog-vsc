const { query, db } = require('stardog');

const {
  EXTENSION_PREFIX,
  PREFIX_RE,
  REGION_RE,
  ENDREGION_RE,
  WHITESPACE_LINE_RE
} = require('./constants');

const envNamespaces = [
  'window',
  'workspace',
  'commands',
  'Uri',
  'ViewColumn',
  'Position',
  'Selection',
  'TextEdit',
  'WorkspaceEdit'
];

module.exports = class Commander {
  constructor({ configManager, resultProvider, env }) {
    if (!configManager || !resultProvider || !env) {
      throw new Error(
        'Cannot create a Commander without a corresponding ConfigManager, resultProvider, and environment (env).'
      );
    }

    this._configManager = configManager;
    this._resultProvider = resultProvider;
    // Add references to each namespace on `this`, to save some characters and traversals.
    envNamespaces.forEach((ns) => this[`_${ns}`] = env[ns]);
  }

  _getQueryTextForEditor(editor) {
    if (!editor) {
      // TODO? Expose an error message here?
      return;
    }

    const { document } = editor;
    const text = document.getText(editor.selection.isEmpty ? undefined : editor.selection);

    return text.split('\n').join(''); // remove newlines, which break stardog
  }

  _setResultProviderData({ body, database }) {
    // TODO: Check body for error codes, e.g., body.code
    this._resultProvider.setData(body.head.vars, body.results.bindings);
    const uriString = `${EXTENSION_PREFIX}://${database}/results`;
    const uri = this._Uri.parse(uriString);

    // Search the existing textDocuments, and if we already have a results pane open,
    // use it. Otherwise, open a new preview.
    for (const doc of this._workspace.textDocuments) {
      if (doc.uri.toString().toLowerCase() === uriString.toLowerCase()) {
        return this._resultProvider.update(uri);
      }
    }

    return this._commands.executeCommand('vscode.previewHtml', uri, this._ViewColumn.Two, 'Query Results');
  }

  executeQuery() {
    const configManager = this._configManager;
    const connection = configManager.getConnection();
    const database = configManager.getDatabase();

    if (!connection) {
      return configManager.setConnection().then(() => this.executeQuery());
    }

    if (!database) {
      return configManager.setDatabase().then(() => this.executeQuery());
    }

    const queryText = this._getQueryTextForEditor(this._window.activeTextEditor);

    if (!queryText) {
      return this._workspace.showInformationMessage(
        'Unable to determine your query. Please try again.'
      );
    }

    return query.execute(connection, database, queryText)
      .then(({ body }) => this._setResultProviderData({ body, database }))
      .catch((reason) => {
        this._window.showErrorMessage(reason);
      });
  }

  changeDatabase() {
    return this._configManager.setDatabaseFromUser();
  }

  changeEndpoint() {
    return this._configManager.setConfigurationFromUser();
  }

  prependPrefixes() {
    const configManager = this._configManager;
    const connection = configManager.getConnection();
    const database = configManager.getDatabase();

    if (!connection) {
      return configManager.setConnection().then(() => this.prependPrefixes());
    }

    if (!database) {
      return configManager.setDatabase().then(() => this.prependPrefixes());
    }

    return db.namespaces(connection, database)
      .then((res) => {
        if (!res.ok) {
          return this._window.showWarningMessage(
            `The following error was returned when attempting to retrieve namespaces from database '${database}':
            ${res.body}`
          );
        }

        const namespaces = res.body || {};
        const keys = Object.keys(namespaces);
        const prefixes = `${keys.reduce((acc, ns) => `${acc}prefix ${ns}: <${namespaces[ns]}>\n`, '')}\n`;

        const editorStart = new this._Position(0, 0);
        const prependPrefixes = new this._TextEdit.insert(editorStart, prefixes);
        const sparqlFile = this._window.activeTextEditor.document.uri;

        const workspaceEdit = new this._WorkspaceEdit();
        workspaceEdit.set(sparqlFile, [prependPrefixes]);

        return this._workspace.applyEdit(workspaceEdit);
      });
  }

  _getPrefixSections({ document }) {
    const { lineCount } = document;
    const prefixSections = [];
    let inPrefixSection = false; // flag

    for (let currentLine = 0; currentLine < lineCount; currentLine++) {
      if (!inPrefixSection && PREFIX_RE.test(document.lineAt(currentLine).text)) {
        prefixSections.push({
          startLine: currentLine
        });
        inPrefixSection = true;
      }

      if (inPrefixSection && !PREFIX_RE.test(document.lineAt(currentLine).text)) {
        prefixSections[prefixSections.length - 1].endLine = currentLine - 1;
        inPrefixSection = false;
      }
    }

    return prefixSections;
  }

  // TODO: Note that this only checks the lines immediately before and after the given `section`.
  // It would probably be better to account for the possibility of blank lines between region comments.
  _annotateRegionIfNecessary({ document, section }) {
    const { startLine, endLine } = section;
    const startPosition = new this._Position(startLine === 0 ? startLine : startLine - 1, 0);
    const endPosition = new this._Position(endLine + 1, 0);
    const textEdits = [];

    // Only insert `#region` if start line is not already a `#region` line.
    if (!REGION_RE.test(document.lineAt(startPosition).text)) {
      textEdits.push(this._TextEdit.insert(startPosition, '#region Prefixes\n'));
    }

    // Only insert `#endregion` if end line is not already a `#endregion` line.
    if (!ENDREGION_RE.test(document.lineAt(endPosition).text)) {
      textEdits.push(this._TextEdit.insert(endPosition, '#endregion Prefixes\n'));
    }

    const editOperation = new this._WorkspaceEdit();
    editOperation.set(document.uri, textEdits);
    return this._workspace.applyEdit(editOperation);
  }

  // TODO: This might need to be a separate command -- e.g., the end user tells us when to annotate
  // prefixes with `#region` markers. Right now, it's called every time the end user tells us to fold
  // or unfold prefixes, which is a lot of probably unnecessary processing. Alternatively, we might be
  // able to make this happen whenever a file is loaded and/or whenever it is saved, and then otherwise
  // listen for changes on the document that begin new "prefix" sections and automatically add new `#region`
  // markers there. Not a concern for a v1 prototype, but something for later. Currently, this is always
  // called with just one prefix section.
  _annotateRegionsIfNecessary({ document, prefixSections }) {
    return Promise.all(
      prefixSections.map((section) => this._annotateRegionIfNecessary({ document, section }))
    );
  }

  // Perform either a fold or unfold operation using the startLines. (VSC will read the text
  // at the start of each line, look for a "folding marker" for the file's language at that line
  // (e.g., '#region'), automatically pair that marker with the matching "end" folding marker
  // (e.g., '#endregion'), and fold the section from the start marker to the end marker. It will
  // do this for every start line provided. The folding markers are defined in
  // language-configuration.json files for the language.)
  _toggleRegionFolding({ startLines, shouldUnfold }) {
    const operation = shouldUnfold ? 'editor.unfold' : 'editor.fold';
    return this._commands.executeCommand(operation, {
      selectionLines: startLines
    });
  }

  // Folding and unfolding currently assumes there is one contiguous region of prefixes. Good enough for v1.
  foldPrefixes() {
    const { activeTextEditor } = this._window;
    const { document } = activeTextEditor;
    const prefixSections = this._getPrefixSectionLineNumbers({ document });

    if (prefixSections.length === 0) {
      // No prefix section found; bail.
      return Promise.resolve();
    }

    this._annotateRegionsIfNecessary({ document, prefixSections });
    // if first prefix line is at beginning of document, insert there; otherwise, insert at line before
    const regionLine = startLine === 0 ? startLine : startLine - 1;
    // insert endregion after last prefix line
    const endRegionLine = endLine + 1;

    return this._annotateRegionIfNecessary({ document, regionLine, endRegionLine })
      .then((didAnnotationSucceed) => {
        if (!didAnnotationSucceed) {
          return this._window.showErrorMessage('Something went wrong. Could not collapse the prefixes.');
        }

        return this._toggleRegionFolding({
          activeTextEditor,
          startLine: regionLine,
          endLine: endRegionLine,
          shouldUnfold: false
        });
      });
  }

  unfoldPrefixes() {
    const { activeTextEditor } = this._window;
    const { document } = activeTextEditor;
    const { startLine, endLine } = this._getPrefixSectionLineNumbers({ document });

    if (isNaN(startLine) || isNaN(endLine)) {
      // No prefix section found; bail.
      return Promise.resolve();
    }

    if (startLine === 0 || endLine === document.lineCount - 1) {
      // Prefix section is either at the start of the file or the end of the file, so it can't be
      // surrounded by the required magic comments. Thus, the prefixes can't have been folded. Bail.
      return Promise.resolve();
    }

    let candidateRegionLine = startLine - 1;
    while (!REGION_RE.test(document.lineAt(candidateRegionLine).text)) {
      candidateRegionLine--;
      if (candidateRegionLine === 0) {
        // No preceding #region comment found. Bail.
        return Promise.resolve();
      }
    }

    let candidateEndRegionLine = endLine + 1;
    while (!ENDREGION_RE.test(document.lineAt(candidateEndRegionLine).text)) {
      candidateEndRegionLine++
      if (candidateEndRegionLine === document.lineCount - 1) {
        // No trailing #endregion comment found. Bail.
        return Promise.resolve();
      }
    }

    return this._toggleRegionFolding({
      activeTextEditor,
      startLine: candidateRegionLine,
      endLine: candidateEndRegionLine,
      shouldUnfold: true
    });
  }
}
