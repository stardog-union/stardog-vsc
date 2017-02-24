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
  const query = doc.getText();

  conn.query({
    query,
    database,
  }, (body) => {
    if (body && body.results) {
      provider.setData(body.head.vars, body.results.bindings);
      const uri = Uri.parse(`stardog-results://${database}/results`);
      commands.executeCommand('vscode.previewHtml', uri, vscode.ViewColumn.One, 'Query Results')
      .then(() => {}, (reason) => {
        window.showErrorMessage(reason);
      });
    } else {
      win.showErrorMessage(body);
    }
  });
};

// this method is called when your extension is activated
const activate = (context) => {
  log('stardog-query-runner is active!');
  const config = workspace.getConfiguration(CONFIG_SECTION);
  const errors = validateSettings(config);

  const resultProvider = new ResultProvider();
  const registration = workspace.registerTextDocumentContentProvider('stardog-results', resultProvider);

  if (errors) {
    window.showErrorMessage(`Missing required setting${errors.length > 1 ? '(s)' : ''}: [${errors.join(', ')}]`, 'Open "settings.json"').then(() => {
    // TODO: Do something here to show the settings panel so the user can change
      console.log('callback');
    });

    // If the settings aren't valid, still create the command, but make it a no-op
    // This is to prevent errors from happening on menu items and pallet commands
    onSendQuery = commands.registerCommand('stardog-query-runner.sendQuery', () => {});
  } else {
    onSendQuery = commands.registerCommand('stardog-query-runner.sendQuery', () => sendQuery(window, buildConnection(config), config.database, resultProvider));
  }

  context.subscriptions.push(onSendQuery, registration);
};

// this method is called when your extension is deactivated
const deactivate = () => {
};

module.exports = {
  activate,
  buildConnection,
  deactivate,
  sendQuery,
  validateSettings,
  ResultProvider,
};
