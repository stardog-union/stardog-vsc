"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const path = require("path");
const vscode = require("vscode");
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
describe("SMS Language Server Extension", () => {
    let docUri;
    let document;
    beforeEach(() => __awaiter(this, void 0, void 0, function* () {
        const ext = vscode.extensions.getExtension("stardog-union.vscode-langserver-sms");
        yield ext.activate();
        docUri = vscode.Uri.file(path.join(__dirname, "..", "..", "fixtures", "bad", "expect-json-sql-graphql.sms"));
        document = yield vscode.workspace.openTextDocument(docUri);
        yield vscode.window.showTextDocument(document);
        yield sleep(2000); // let server start
    }));
    afterEach(() => {
        document = null;
    });
    it("receives error diagnostics from the server", () => {
        const receivedDiagnostics = vscode.languages.getDiagnostics(docUri);
        const normalizedReceivedDiagnostics = JSON.parse(JSON.stringify(receivedDiagnostics));
        chai_1.expect(normalizedReceivedDiagnostics).to.eql([
            {
                severity: "Error",
                message: "\tExpected one of the following:\n Sql\n Json\n GraphQl",
                range: [
                    {
                        line: 0,
                        character: 13
                    },
                    {
                        line: 0,
                        character: 13
                    }
                ],
                source: "FromClause"
            }
        ]);
    });
    it("receives hover help from the server", () => __awaiter(this, void 0, void 0, function* () {
        const hoverHelp = (yield vscode.commands.executeCommand('vscode.executeHoverProvider', docUri, new vscode.Position(0, 0)));
        console.log(JSON.stringify(hoverHelp, null, 2));
        return chai_1.expect(true).to.be.true;
    }));
});
//# sourceMappingURL=extension.test.js.map