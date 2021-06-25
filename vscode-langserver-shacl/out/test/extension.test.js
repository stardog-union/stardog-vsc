"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const path = require("path");
const vscode = require("vscode");
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
describe("SHACL Language Server Extension", () => {
    let docUri;
    let document;
    beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
        const ext = vscode.extensions.getExtension("stardog-union.vscode-langserver-shacl");
        yield ext.activate();
        docUri = vscode.Uri.file(path.join(__dirname, "..", "..", "fixtures", "bad", "basic-bad-shacl.shacl"));
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
                message: "A NodeShape cannot have any value for sh:minCount.",
                range: [
                    {
                        line: 2,
                        character: 2
                    },
                    {
                        line: 2,
                        character: 13
                    }
                ]
            }
        ]);
    });
    it("receives hover help from the server", () => __awaiter(void 0, void 0, void 0, function* () {
        const hoverHelp = (yield vscode.commands.executeCommand("vscode.executeHoverProvider", docUri, new vscode.Position(0, 0)));
        const { contents } = hoverHelp[0];
        const range = hoverHelp[0].range;
        chai_1.expect(typeof contents[0] === 'string' ? contents[0] : contents[0].value).to.eql("```\nPrefixedName\n```");
        chai_1.expect(range.start.line).to.eql(0);
        chai_1.expect(range.start.character).to.eql(0);
        chai_1.expect(range.end.line).to.eql(0);
        chai_1.expect(range.end.character).to.eql(14);
    }));
    it("provides completion suggestions", () => __awaiter(void 0, void 0, void 0, function* () {
        docUri = vscode.Uri.file(path.join(__dirname, "..", "..", "fixtures", "bad", "basic-incomplete-shacl.shacl"));
        document = yield vscode.workspace.openTextDocument(docUri);
        yield vscode.window.showTextDocument(document);
        yield sleep(2000); // let server start
        const completions = (yield vscode.commands.executeCommand("vscode.executeCompletionItemProvider", docUri, document.positionAt(86)));
        const normalizedSuggestedCompletions = JSON.parse(JSON.stringify(completions.items));
        // tslint:disable:no-unused-expression
        chai_1.expect(normalizedSuggestedCompletions.some((item) => item.label === "sh:targetClass")).to
            .be.true;
    }));
});
//# sourceMappingURL=extension.test.js.map