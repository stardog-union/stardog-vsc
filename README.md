# The Stardog extension for VSCode

The Stardog extension makes it easy to build and execute queries into Stardog.

* Connect to Stardog

* Execute queries and view results.

* Quickly insert sample queries.

* Autopopulate and collapse prefixes.

* Syntax highlighting for SPARQL, OWL, and Turtle.

>The extension is only active in `.sparql` files. If it seems the extension
is missing, ensure your file is saved as `.sparql`.

## Commands

All commands can be executed from the command palette
`View -> Command Palette` (`cmd+shift+p`)

All available commands:

* Stardog: Change endpoint
* Stardog: Change database
* Stardog: Execute query
* Stardog: Prepend prefixes
* Stardog: Collapse prefixes

### Connect to Stardog

The extension stores your Stardog connection in its configuration. If no configuration
exists, activating the extension (by opening a `.sparql` file) will prompt you for
an endpoint, username, password, and database name.

To manually prompt a change to your endpoint or database, run `Stardog: Change endpoint`
or `Stardog: Change database`.

### Execute query

Execute a query using the hotkey (`cmd+e` by default), clicking the rocket icon in
the top right corner of your editor, or by running `Stardog: Execute query` from
the command palette.

If there is an active text selection when running the command, only the selected
text will be sent as a query, otherwise the entire file will be sent.

### Insert sample queries

Choose from sample queries to insert in your document by running
`Stardog: Insert sample queries` from the command palette.

### Autopopulate prefixes

Retrieve namespaces from your current database and prepend them to your
file as prefixes by running `Stardog: Prepend prefixes` from the command palette.

### Collapse prefixes

Prefixes become collapsable blocks when surrounded by `#region`...`#endregion`. You
can automatically insert these tags and collapse your prefixes by running
`Stardog: Collapse prefixes` from the command palette.

## Extension Settings

This extension contributes the following settings:

* `stardog.database`: "databaseName"
* `stardog.endpoint`: "http://localhost:5820"
* `stardog.username`: "admin"
* `stardog.password`: "admin"