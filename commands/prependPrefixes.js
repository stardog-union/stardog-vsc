const {
  window,
  workspace,
  WorkspaceEdit,
  TextEdit,
  Position,
} = require('vscode');
const { db } = require('stardog');

module.exports = (connection, dbName) => db.namespaces(connection, dbName)
  .then((res) => {
    if (!res.ok) {
      return window.showWarningMessage(
        `The following error was returned when attempting to retrieve namespaces from database '${dbName}':
        ${res.body}`);
    }
    const namespaces = res.body || {};
    const keys = Object.keys(namespaces);
    const prefixes = `${keys.reduce((acc, ns) => `${acc}prefix ${ns}: <${namespaces[ns]}>\n`, '')}\n`;
    
    const gg = new Position(0, 0);
    const prependPrefixes = new TextEdit.insert(gg, prefixes);
    const sparqlFile = window.activeTextEditor.document.uri;

    const workspaceEdit = new WorkspaceEdit();    
    workspaceEdit.set(sparqlFile, [prependPrefixes]);

    return workspace.applyEdit(workspaceEdit);
});
