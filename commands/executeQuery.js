const vscode = require('vscode');

const { query, Connection } = require('stardog');

module.exports = (config, resultProvider) => {
  const connection = new Connection(config);

  const q = `select distinct ?entity ?elabel ?type ?tlabel 
                                      where { 
                                        ?entity a ?type . 
                                        OPTIONAL { ?entity rdfs:label ?elabel } . 
                                        OPTIONAL { ?type rdfs:label ?tlabel } 
                                      }`;
  query.execute(connection, 'myDB', q.split('\n').join(''), { limit: 1 })
    .then(({ body }) => {
      resultProvider.setData(body.head.vars, body.results.bindings);
      const uri = vscode.Uri.parse(`stardog-results://${'myDB'}/results`);
      return vscode.commands.executeCommand('vscode.previewHtml', uri, vscode.ViewColumn.Two, 'Query Results');
    })
    .then(() => { }, (reason) => {
        vscode.window.showErrorMessage(reason);
    });
}
