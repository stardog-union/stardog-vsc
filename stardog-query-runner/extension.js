// eslint-disable-next-line import/no-extraneous-dependencies, import/no-unresolved
const vscode = require('vscode');

const { log } = require('./lib/log');

const { window, workspace } = vscode;

const CONFIG_SECTION = 'stardog';

function validateSettings(config = {}) {
  const settings = ['endpoint', 'username', 'password'];
  const errors = [];

  settings.forEach((item) => {
    const value = config[item];
    if (typeof value !== 'string' || value.length === 0) {
      errors.push(item);
    }
  });

  return errors.length ? errors : null;
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {
  log('Congratulations, your extension "stardog-query-runner" is now active!');
  const errors = validateSettings(workspace.getConfiguration(CONFIG_SECTION));
  if (errors) {
    window.showErrorMessage(`Missing required setting${errors.length > 1 ? '(s)' : ''}: [${errors.join(', ')}]`, 'Open "settings.json"').then(() => {
    // TODO: Do something here to show the settings panel so the user can change
      console.log('callback');
    });
  }
  // const disposable = commands.registerCommand('extension.sayHello', () => {
  //   window.showInformationMessage('Hello World!');
  // });

  // context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
function deactivate() {
}

module.exports = {
  activate,
  deactivate,
  validateSettings,
};
