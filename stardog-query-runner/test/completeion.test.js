/* eslint-env node, mocha */

const expect = require('must');
const simple = require('simple-mock');
// eslint-disable-next-line import/no-extraneous-dependencies, import/no-unresolved
const vscode = require('vscode');
const CompletionProvider = require('../completion');

describe('CompletionProvider', () => {
  it('provideCompletionItems() gets a list of namespaces', (done) => {
    const item = (key, href) => ({
      detail: href,
      label: key,
      kind: vscode.CompletionItemKind.Reference,
    });
    const conn = {
      getNamespaces: simple.mock().callbackWith({
        '': 'empty',
        foo: 'http://www.example.com',
        bar: 'http://www.wikipedia.com',
      }),
    };

    const c = new CompletionProvider(conn, 'myDb');
    const items = [item('foo', 'http://www.example.com'), item('bar', 'http://www.wikipedia.com')];
    Promise.all([
      c.provideCompletionItems(),
      c.provideCompletionItems(),
      c.provideCompletionItems(),
    ]).then((result) => {
      // They're all the same
      result.forEach((r) => { expect(r).to.eql(items); });
      // Because we're debouncing the DB call, this will only be one
      expect(conn.getNamespaces.callCount).to.be(1);
      done();
    });
  });
});
