const vscode = require('vscode');

const { query, Connection } = require('stardog');

module.exports = (config, resultProvider) => {
  const connection = new Connection(config);

  console.log(connection);
  query.execute(connection, 'myDB', 'select distinct ?s where { ?s ?p ?o }', { limit: 1 })
    .then(({ body }) => {
      resultProvider.setData(body.head.vars, body.results.bindings);
      const uri = vscode.Uri.parse(`stardog-results://${'myDB'}/results`);

      vscode.commands.executeCommand('vscode.previewHtml', uri, vscode.ViewColumn.One, 'Query Results')
        .then(() => { }, (reason) => {
          vscode.window.showErrorMessage(reason);
        });
    });
}
