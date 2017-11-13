const vscode = require('vscode');

const { query, Connection } = require('stardog');

module.exports = (config, resultProvider) => {
  const connection = new Connection(config);

  console.log(connection);


  const q = `select distinct ?entity ?elabel ?type ?tlabel 
                                      where { 
                                        ?entity a ?type . 
                                        OPTIONAL { ?entity rdfs:label ?elabel } . 
                                        OPTIONAL { ?type rdfs:label ?tlabel } 
                                      }`;
  vscode.commands.executeCommand('vscode.moveActiveEditor', { to: 'first', by: 'group'})
  .then(() => { }, (err) => console.err)
  .then(() => query.execute(connection, 'exercise', q.split('\n').join(''), { limit: 1 })
    .then(({ body }) => {
      
      
      resultProvider.setData(body.head.vars, body.results.bindings);
      const uri = vscode.Uri.parse(`stardog-results://${'exercise'}/results`);

      return vscode.commands.executeCommand('vscode.previewHtml', uri, vscode.ViewColumn.One, 'Query Results')
        .then(() => {
          
          
          vscode.commands.executeCommand(
            'vscode.moveActiveEditor',
            {
              to: 'last',
              by: 'group',
            }
          )
        })
    })
    .then(() => { }, (reason) => {
        vscode.window.showErrorMessage(reason);
    })
  )
}
