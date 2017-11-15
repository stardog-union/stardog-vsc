const { CompletionItem, CompletionList } = require('vscode');
const { db } = require('stardog');

module.exports = class NamespaceCompletionProvider {
  constructor(configManager) {
    this._configManager = configManager;
  }
  provideCompletionItems(){
    debugger;
    db.namespaces(this._configManager.getConnection(), this._configManager.getDatabase())
      .then((res) => {
        if (!res.ok) {
          return '';
        }
        const namespaces = res.body || {};
        debugger;
      })
      .then(textBlock => textBlock)

  }
}
