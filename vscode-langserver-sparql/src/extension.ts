import * as path from "path";
import * as vscode from "vscode";
import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind,
  NodeModule
} from "vscode-languageclient";

let client: LanguageClient;

export function activate(context: vscode.ExtensionContext) {
  const server = context.asAbsolutePath(
    path.join(
      "node_modules",
      "sparql-language-server",
      "dist",
      "cli.js"
    )
  );
  const baseServerOptions: NodeModule = {
    module: server,
    transport: TransportKind.stdio,
    args: ["--stdio"]
  };
  const serverOptions: ServerOptions = {
    run: baseServerOptions,
    debug: {
      ...baseServerOptions,
      // allow attaching VSCode in debug mode:
      options: {
        execArgv: ["--nolazy", "--inspect=6009"]
      }
    }
  };
  const clientOptions: LanguageClientOptions = {
    documentSelector: [
      {
        scheme: "file",
        language: "sparql"
      }
    ]
  };

  client = new LanguageClient(
    "stardogSparqlLanguageServer",
    "Stardog SPARQL Language Server",
    serverOptions,
    clientOptions
  );

  client.start();
}

export function deactivate() {
  if (client) {
    return client.stop();
  }
}
