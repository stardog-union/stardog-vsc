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
describe("SMS Language Server Extension", () => {
    let docUri;
    let document;
    beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
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
                message: "Expecting: one of these possible Token sequences:\n  1. [Sql]\n  2. [Json]\n  3. [GraphQl]\n  4. [Csv]\nbut found: ''",
                range: [
                    {
                        line: 0,
                        character: 12
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
    it("receives hover help from the server", () => __awaiter(void 0, void 0, void 0, function* () {
        const hoverHelp = (yield vscode.commands.executeCommand("vscode.executeHoverProvider", docUri, new vscode.Position(0, 0)));
        const { contents } = hoverHelp[0];
        const range = hoverHelp[0].range;
        chai_1.expect(typeof contents[0] === 'string' ? contents[0] : contents[0].value).to.eql("```\nMappingDecl\n```");
        chai_1.expect(range.start.line).to.eql(0);
        chai_1.expect(range.start.character).to.eql(0);
        chai_1.expect(range.end.line).to.eql(0);
        chai_1.expect(range.end.character).to.eql(7);
    }));
    it("provides snippets", () => __awaiter(void 0, void 0, void 0, function* () {
        docUri = vscode.Uri.file(path.join(__dirname, "..", "..", "fixtures", "good", "empty-mapping.sms"));
        document = yield vscode.workspace.openTextDocument(docUri);
        yield vscode.window.showTextDocument(document);
        yield sleep(2000); // let server start
        const completions = (yield vscode.commands.executeCommand("vscode.executeCompletionItemProvider", docUri, new vscode.Position(0, 0)));
        const normalizedSuggestedCompletion = JSON.parse(JSON.stringify(completions.items[0]));
        chai_1.expect(normalizedSuggestedCompletion).to.eql({
            detail: "Create a basic fill-in-the-blanks SMS2 mapping",
            documentation: 'Inserts a basic mapping in Stardog Mapping Syntax 2 (SMS2) with tabbing functionality and content assistance. For more documentation of SMS2, check out "Help" --> "Stardog Docs".',
            insertText: {
                _tabstop: 1,
                value: "# A basic SMS2 mapping.\nMAPPING$0\nFROM ${1|SQL,JSON,GRAPHQL|} {\n    $2\n}\nTO {\n    $3\n}\nWHERE {\n    $4\n}\n"
            },
            label: "basicSMS2Mapping",
            kind: "Enum",
            sortText: "basicSMS2Mapping",
        });
    }));
});
//# sourceMappingURL=extension.test.js.map