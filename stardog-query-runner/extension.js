// eslint-disable-next-line import/no-extraneous-dependencies, import/no-unresolved
const vscode = require('vscode');

const { window, commands } = vscode;

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {
  console.log('Congratulations, your extension "stardog-query-runner" is now active!');
  const disposable = commands.registerCommand('extension.sayHello', () => {
    window.showInformationMessage('Hello World!');
  });

  context.subscriptions.push(disposable);
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {
}
exports.deactivate = deactivate;
