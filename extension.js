const vscode = require('vscode');

const ConfigManager = require('./lib/ConfigManager');
const ResultProvider = require('./lib/ResultProvider');
const Commander = require('./lib/Commander');
const CompletionItemProvider = require('./lib/SPARQLCompletionProvider');
const { EXTENSION_PREFIX, CONNECTION_ESTABLISHED } = require('./lib/constants');

const configManager = new ConfigManager({ env: vscode });
const resultProvider = new ResultProvider({ env: vscode });
const commander = new Commander({ configManager, resultProvider, env: vscode });
const exposedCommands = Object.getOwnPropertyNames(Commander.prototype).filter((key) => {
    return key !== 'constructor' && !key.startsWith('_') && typeof Commander.prototype[key] === 'function';
});
const completionItemProvider = new CompletionItemProvider();

function activate(context) {
    vscode.commands.executeCommand('setContext', CONNECTION_ESTABLISHED, false);
    vscode.workspace.registerTextDocumentContentProvider(EXTENSION_PREFIX, resultProvider);
    vscode.languages.registerCompletionItemProvider('sparql', completionItemProvider);

    context.subscriptions.push(
        ...exposedCommands.map((command) => {
            return vscode.commands.registerCommand(
                `${EXTENSION_PREFIX}.${command}`, commander[command].bind(commander)
            );
        })
    );
}

exports.activate = activate;

function deactivate() {
}
exports.deactivate = deactivate;