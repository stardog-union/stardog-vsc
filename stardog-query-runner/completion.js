// eslint-disable-next-line import/no-extraneous-dependencies, import/no-unresolved
const vscode = require('vscode');

const getNamespaces = (conn, database) => new Promise((resolve) => {
  conn.getNamespaces({ database }, resolve);
});

module.exports = class {
  constructor(connection, database) {
    this.connection = connection;
    this.database = database;
  }
  provideCompletionItems() {
    return getNamespaces(this.connection, this.database)
      .then(data =>
        Object.keys(data).filter(Boolean)
        .map(label => ({
          label,
          kind: vscode.CompletionItemKind.Reference,
          detail: data[label],
        })));
  }
};
