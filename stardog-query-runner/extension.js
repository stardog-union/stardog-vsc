// eslint-disable-next-line import/no-extraneous-dependencies, import/no-unresolved
const vscode = require('vscode');

const { log } = require('./lib/log');

const { window, workspace, commands } = vscode;

const { Connection } = require('stardog');

const CONFIG_SECTION = 'stardog';

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

const sendQuery = (win, conn, database) => {
  const editor = win.activeTextEditor;
  if (!editor || !conn) { return; }

  const doc = editor.document;
  const query = doc.getText();

  conn.query({
    query,
    database,
  }, (body) => {
    if (body.results) {
      win.showInformationMessage(`We got ${body.results.bindings.length} bindings back.`);
    } else {
      win.showErrorMessage(body);
    }
  });
};

// this method is called when your extension is activated
const activate = (context) => {
  log('Congratulations, your extension "stardog-query-runner" is now active!');
  const config = workspace.getConfiguration(CONFIG_SECTION);
  const errors = validateSettings(config);

  if (errors) {
    window.showErrorMessage(`Missing required setting${errors.length > 1 ? '(s)' : ''}: [${errors.join(', ')}]`, 'Open "settings.json"').then(() => {
    // TODO: Do something here to show the settings panel so the user can change
      console.log('callback');
    });

    // If the settings aren't valid, still create the command, but make it a no-op
    // This is to prevent errors from happening on menu items and pallet commands
    onSendQuery = commands.registerCommand('stardog-query-runner.sendQuery', () => {});
  } else {
    onSendQuery = commands.registerCommand('stardog-query-runner.sendQuery', () => sendQuery(window, buildConnection(config), config.database));
  }

  context.subscriptions.push(onSendQuery);
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
};
