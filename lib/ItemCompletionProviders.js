const { CompletionItem, CompletionList } = require('vscode');

const keywords = [
  'add', 'all', 'as', 'ask', 'bind', 'by', 'clear',
  'construct', 'copymove', 'create', 'data', 'default',
  'define', 'delete', 'describe', 'distinct', 'drop', 'exists',
  'filter', 'from', 'graph', 'group', 'having', 'in', 'insert',
  'limit', 'load', 'minus', 'named', 'not', 'offset', 'optional',
  'order', 'reduced', 'select', 'service', 'silent', 'to', 'union',
  'using', 'values', 'where', 'with', 'prefix', 'true', 'false', 'count',
  'path',
];

const completionItems = keywords.map(label => new CompletionItem(label));
const completionList = new CompletionList(completionItems);

module.exports = class CompletionItemProvider {
  constructor(){}
  provideCompletionItems(){
    return completionList;
  }
}
