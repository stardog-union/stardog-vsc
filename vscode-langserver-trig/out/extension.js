"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const path = require("path");
const vscode_languageclient_1 = require("vscode-languageclient");
let client;
function activate(context) {
    const server = context.asAbsolutePath(path.join("node_modules", "trig-language-server", "dist", "cli.js"));
    const baseServerOptions = {
        module: server,
        transport: vscode_languageclient_1.TransportKind.stdio,
        args: ["--stdio"]
    };
    const serverOptions = {
        run: baseServerOptions,
        debug: Object.assign(Object.assign({}, baseServerOptions), { 
            // allow attaching VSCode in debug mode:
            options: {
                execArgv: ["--nolazy", "--inspect=6009"]
            } })
    };
    const clientOptions = {
        documentSelector: [
            {
                scheme: "file",
                language: "trig"
            }
        ]
    };
    client = new vscode_languageclient_1.LanguageClient("stardogTrigLanguageServer", "Stardog TriG Language Server", serverOptions, clientOptions);
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