# Stardog RDF Grammars

Visual Studio Code syntax highlighting for all your favorite RDF languages, and a few [Stardog](https://www.stardog.com/)-specific ones, too!

![Turtle syntax highlighting](https://github.com/stardog-union/stardog-vsc/raw/master/stardog-rdf-grammars/static/ttl-syntax.png)

### RDF language support:

- SPARQL (`.rq`)
- Turtle (`.ttl`)

### Stardog language support:

- Stardog Mapping Syntax (`.sms`)
- Stardog Rules Syntax (`.srs`)

## Installation

There are two ways to install this extension: from the Visual Studio Code Extension Marketplace (recommended) and locally.

### Marketplace

To install via the Marketplace open the command palette while in VSC (`CMD + SHIFT + P`) and type `install`, then navigate to `Extensions: Install Extensions` and hit `enter`, or simply click the Marketplace icon and search for this extension `stardog-rdf-grammars`.

### Local

 To install the extension locally you'll need to copy this project into VSCode's dotfile folder (usually located in your `$HOME` directory):

```
cp path/to/stardog-rdf-grammars $HOME/.vscode/extensions
```

Make sure you have VSCode installed first!  Once you've copied this directory to `.vscode/extensions`, either restart VSCode or reload the window (`CMD+SHIFT+P`, then type `reload` - you'll see the appropriate option).

## Usage

Open a file with an extension that matches your language, et voila!

## License

[Apache 2.0](https://github.com/stardog-union/stardog-vsc/raw/master/stardog-rdf-grammars/LICENSE)
