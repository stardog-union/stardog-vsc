# vscode-langserver-sparql

A Visual Studio Code extension providing language intelligence (autocomplete,
diagnostics, hover tooltips, etc.) for the [SPARQL query language](https://www.stardog.com/tutorials/sparql/), including both
[W3C standard SPARQL](https://www.w3.org/TR/sparql11-query/) and Stardog extensions (e.g., [PATHS queries](https://www.stardog.com/docs/#_path_queries)),
via the Language Server Protocol.

## Features

- Autocompletion for SPARQL keywords, including Stardog extensions
- Diagnostics (error hints)
- Hover tooltips (identifies entities in SPARQL grammar and shows "expected"
symbols in the case of an error)
- Open source
- No arbitrary code execution
- Powers some of the core language intelligence capabilities of [Stardog Studio](https://www.stardog.com/studio/)
