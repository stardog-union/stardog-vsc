// eslint-disable-next-line import/no-extraneous-dependencies, import/no-unresolved
const vscode = require('vscode');
const debounce = require('debounce-promise');

// eslint-disable-next-line no-underscore-dangle
const _getNamespaces = (conn, database) => new Promise((resolve) => {
  conn.getNamespaces({ database }, resolve);
});

const getNamespaces = debounce(_getNamespaces, 100);

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
