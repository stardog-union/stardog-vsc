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
});
