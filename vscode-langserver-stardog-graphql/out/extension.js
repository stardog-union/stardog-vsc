"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const vscode_languageclient_1 = require("vscode-languageclient");
let client;
function activate(context) {
    const server = context.asAbsolutePath(path.join("node_modules", "stardog-graphql-language-server", "dist", "cli.js"));
    const baseServerOptions = {
        module: server,
        transport: vscode_languageclient_1.TransportKind.stdio,
        args: ["--stdio"]
    };
    const serverOptions = {
        run: baseServerOptions,
        debug: Object.assign({}, baseServerOptions, { 
            // allow attaching VSCode in debug mode:
            options: {
                execArgv: ["--nolazy", "--inspect=6009"]
            } })
    };
    const clientOptions = {
        documentSelector: [
            {
                scheme: "file",
                language: "graphql"
            },
            {
                scheme: "file",
                language: "stardog-graphql"
            }
        ]
    };
    client = new vscode_languageclient_1.LanguageClient("stardogGraphQlLanguageServer", "Stardog GraphQL Language Server", serverOptions, clientOptions);
    client.start();
}
exports.activate = activate;
function deactivate() {
    if (client) {
        return client.stop();
    }
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map