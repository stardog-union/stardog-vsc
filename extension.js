const vscode = require('vscode');

const executeQuery = require('./commands/executeQuery');
const ResultProvider = require('./lib/ResultProvider');
const Connection = require('./lib/Connection');

function activate(context) {
    const resultProvider = new ResultProvider();
    const registration = vscode.workspace.registerTextDocumentContentProvider('stardog-results', resultProvider);

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    let disposable = vscode.commands.registerCommand('stardog-vsc.executeQuery', () => {
        const { username, password, endpoint } = vscode.workspace.getConfiguration('stardog');
        console.log(username, password, endpoint);
        executeQuery({ username, password, endpoint }, resultProvider);
    });

    context.subscriptions.push(disposable);
}
exports.activate = activate;

function deactivate() {
}
exports.deactivate = deactivate;