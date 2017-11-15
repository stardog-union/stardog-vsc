const { query, db } = require('stardog');

const { EXTENSION_PREFIX } = require('./constants');

const envNamespaces = [
  'window',
  'workspace',
  'commands',
  'Uri',
  'ViewColumn',
  'Position',
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
}
