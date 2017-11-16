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

  // TODO: Re-evaluate this. There is probably a way to use RegExp to locate the first prefix
  // occurrence more quickly than checking every line, which would be more efficient.
  _getPrefixSectionLineNumbers({ document }) {
    const lineCount = document.lineCount - 1; // lines are 0-indexed
    let startLine = 0;

    while (startLine <= lineCount && !PREFIX_RE.test(document.lineAt(startLine).text)) {
      startLine++;
    }

    if (startLine > lineCount) {
      // We got all the way through the document and there are no prefixes; do nothing.
      return {
        startLine: NaN,
        endLine: NaN
      };
    }

    let endLine = startLine;

    while (endLine <= lineCount && PREFIX_RE.test(document.lineAt(endLine).text)) {
      endLine++;
    }

    return {
      startLine,
      endLine: endLine - 1
    };
  }

  _annotateRegionIfNecessary({ document, regionLine, endRegionLine }) {
    const startPosition = new this._Position(regionLine, 0);
    const endPosition = new this._Position(endRegionLine, 0);
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

  // Perform either a fold or unfold operation and restore the previous selection when finished.
  _toggleRegionFolding({ activeTextEditor, startLine, endLine, shouldUnfold }) {
    const operation = shouldUnfold ? 'editor.unfold' : 'editor.fold';
    const prevSelection = activeTextEditor.selection;
    const selection = new this._Selection(
      startLine, 0,
      endLine, activeTextEditor.document.lineAt(endLine).text.length
    );
    activeTextEditor.selection = selection;
    return this._commands.executeCommand(operation)
      .then(() => activeTextEditor.selection = prevSelection);
  }

  // Folding and unfolding currently assumes there is one contiguous region of prefixes. Good enough for v1.
  foldPrefixes() {
    const { activeTextEditor } = this._window;
    const { document } = activeTextEditor;
    const { startLine, endLine } = this._getPrefixSectionLineNumbers({ document });

    if (isNaN(startLine) || isNaN(endLine)) {
      // No prefix section found; bail.
      return Promise.resolve();
    }

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
