// eslint-disable-next-line import/no-extraneous-dependencies, import/no-unresolved
const vscode = require('vscode');

const { log } = require('./lib/log');

const { window, workspace, commands, Uri } = vscode;

const { Connection } = require('stardog');

const CONFIG_SECTION = 'stardog';
const CSS = `
  table {
    width: 100%;
    border:0;
    border-spacing: 0px;
    border-collapse: collapse;
  }
  thead th {
    padding: 10px;
  }
  .vscode-dark table {
    color: #ffffff;
  }
  .vscode-dark tr:nth-child(odd) {
    background-color: #333333;
  }
  .vscode-dark tbody tr:hover {
    background-color: #e5e5e5
  }

  .vscode-light {
    color: #000000
  }
  .vscode-light tr:nth-child(odd) {
    background-color: #efefef;
  }
  .vscode-light tbody tr:hover {
    background-color: #e5e5e5
  }
`;

class ResultProvider {
  constructor() {
    this.columns = null;
    this.values = null;
  }
  setData(columns, values) {
    Object.assign(this, { columns, values });
  }
  provideTextDocumentContent() {
    const html = `
      <style>
        ${CSS}
      </style>
      <body>
        <table id="results">
          <thead>
            <tr>
              ${this.columns.map(c => `<th>${c}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${this.values.map(v =>
        `<tr>
                ${this.columns.map(c => `<td>${v[c].value}</td>`).join('')}
              </tr>`).join('')}
          </tbody>
        </table>
      </body>
    `;

    return html;
  }
}


// We want to keep a handle to this in case we ever need to
// dispose of the old one, and add a new one in it's place
let onSendQuery = null;
let onPickDatabase = null;

const validateSettings = (config = {}) => {
  const settings = ['endpoint', 'username', 'password', 'database'];
  const errors = [];

  settings.forEach((item) => {
    const value = config[item];
    if (typeof value !== 'string' || value.length === 0) {
      errors.push(item);
    }
  });

  return errors.length ? errors : null;
};

const buildConnection = (config = {}) => {
  const {
    endpoint,
    username,
    password,
  } = config;
  const conn = new Connection();
  try {
    conn.setEndpoint(endpoint);
    conn.setCredentials(username, password);
  } catch (e) {
    return null;
  }
  return conn;
};

const sendQuery = (win, conn, database, provider) => {
  const editor = win.activeTextEditor;
  if (!editor || !conn) { return; }

  const doc = editor.document;
  const query = doc.getText(editor.selection.isEmpty ? undefined : editor.selection);

  conn.query({
    query,
    database,
  }, (body) => {
    if (body && body.results) {
      provider.setData(body.head.vars, body.results.bindings);
      const uri = Uri.parse(`stardog-results://${database}/results`);
      commands.executeCommand('vscode.previewHtml', uri, vscode.ViewColumn.One, 'Query Results')
        .then(() => { }, (reason) => {
          window.showErrorMessage(reason);
        });
    } else {
      win.showErrorMessage(body);
    }
  });
};

const getDBList = (win, conn) => new Promise((resolve, reject) => {
  conn.listDBs((body) => {
    if (body && body.databases) { return resolve(body.databases); }
    return reject(body);
  });
});

const disposeAll = (...disposables) => disposables.forEach(d => d.dispose());

const init = (context, resultProvider) => {
  const config = workspace.getConfiguration(CONFIG_SECTION);
  const errors = exports.validateSettings(config);

  // Make these no-ops by default. Wait for good settings before making them do anything.
  // This is to prevent race conditions where the user tries to use one before everything
  // is really ready to go.
  onSendQuery = commands.registerCommand('stardog-query-runner.sendQuery', () => { });
  onPickDatabase = commands.registerCommand('stardog-query-runner.pickDatabase', () => { });
  commands.executeCommand('setContext', 'query-ready', false);

  if (errors) {
    window.showErrorMessage(`Missing required setting${errors.length > 1 ? '(s)' : ''}: [${errors.join(', ')}]`, 'Open "settings.json"').then((item) => {
      const listener = workspace.onDidChangeConfiguration(() => {
        disposeAll(onSendQuery, onPickDatabase, listener);
        exports.init(context, resultProvider);
      });
      if (item) {
        commands.executeCommand('workbench.action.openGlobalSettings');
      }
    });
  } else {
    // Because we don't have a DB name yet, make this a no-op in case the user
    // runs from the command pallet
    const conn = exports.buildConnection(config);

    getDBList(window, conn)
      .then(dbList => (dbList || []).map(item => ({
        label: `${item}`,
        description: '$(database)',
      })))
      .then(dbList => window.showQuickPick(dbList, {
        placeHolder: 'Select a target database',
        ignoreFocusOut: true,
      }))
      .then((db) => {
        if (!db) { throw Error('You must select a database for this plugin to function.'); }
        // Make the menu item visible.
        commands.executeCommand('setContext', 'query-ready', true);
        const status = window.createStatusBarItem(vscode.StatusBarAlignment.Right);
        status.text = `${db.label} $(database)`;
        status.command = 'stardog-query-runner.pickDatabase';
        status.show();
        // Replace old commands with complete ones
        disposeAll(onSendQuery, onPickDatabase);
        onSendQuery = commands.registerCommand('stardog-query-runner.sendQuery', () =>
          exports.sendQuery(window, conn, db.label, resultProvider));
        onPickDatabase = commands.registerCommand('stardog-query-runner.pickDatabase', () => {
          disposeAll(onSendQuery, onPickDatabase, status);
          exports.init(context, resultProvider);
        });
      })
      .catch((err) => {
        window.showErrorMessage(`Unrecoverable error detected.${err}`);
      });
  }

  context.subscriptions.push(onSendQuery, onPickDatabase);
};

// this method is called when your extension is activated
const activate = (context) => {
  log('stardog-query-runner is active!');
  const resultProvider = new exports.ResultProvider();
  const registration = workspace.registerTextDocumentContentProvider('stardog-results', resultProvider);
  context.subscriptions.push(registration);
  exports.init(context, resultProvider);
};

// this method is called when your extension is deactivated
const deactivate = () => {};

exports.activate = activate;
exports.buildConnection = buildConnection;
exports.deactivate = deactivate;
exports.sendQuery = sendQuery;
exports.validateSettings = validateSettings;
exports.ResultProvider = ResultProvider;
exports.init = init;
