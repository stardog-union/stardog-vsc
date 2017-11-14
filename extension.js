const vscode = require('vscode');

const executeQuery = require('./commands/executeQuery');
const prependPrefixes = require('./commands/prependPrefixes');
const ResultProvider = require('./lib/ResultProvider');
const CompletionItemProvider = require('./lib/SPARQLCompletionProvider');
const { Connection } = require('stardog');

function activate(context) {
    const { username, password, endpoint } = vscode.workspace.getConfiguration('stardog');

    const resultProvider = new ResultProvider();
    const completionItemProvider = new CompletionItemProvider();
    vscode.workspace.registerTextDocumentContentProvider('stardog-results', resultProvider);
    vscode.languages.registerCompletionItemProvider('sparql', completionItemProvider);

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    let disposable = vscode.commands.registerCommand('stardog-vsc.executeQuery', () => {
        console.log(username, password, endpoint);
        executeQuery({ username, password, endpoint }, resultProvider);
    });
    vscode.commands.registerCommand('stardog-vsc.prependPrefixes', () => {
        prependPrefixes(new Connection({ username, password, endpoint }), 'exercise');
    });
    context.subscriptions.push(disposable);
}
exports.activate = activate;

function deactivate() {
}
exports.deactivate = deactivate;