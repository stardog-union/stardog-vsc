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
describe("SPARQL Language Server Extension", () => {
    let docUri;
    let document;
    beforeEach(() => __awaiter(this, void 0, void 0, function* () {
        const ext = vscode.extensions.getExtension("stardog-union.vscode-langserver-sparql");
        yield ext.activate();
        docUri = vscode.Uri.file(path.join(__dirname, "..", "..", "fixtures", "bad", "basic-bad-select.sparql"));
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
                message: "'{' expected.",
                range: [
                    {
                        line: 2,
                        character: 19
                    },
                    {
                        line: 2,
                        character: 23
                    }
                ],
                source: "GroupGraphPattern"
            },
            {
                message: "\tExpected one of the following:\n '^'\n IRIREF e.g. <http://example.com>\n PNAME_LN\n PNAME_NS\n 'a'\n '!'\n '('\n VAR1 e.g. ?foo\n VAR2 e.g. ?bar",
                range: [
                    {
                        character: 5,
                        line: 3
                    },
                    {
                        character: 6,
                        line: 3
                    }
                ],
                severity: "Error",
                source: "PropertyListPathNotEmpty"
            }
        ]);
    });
    it("receives hover help from the server", () => __awaiter(this, void 0, void 0, function* () {
        const hoverHelp = (yield vscode.commands.executeCommand("vscode.executeHoverProvider", docUri, new vscode.Position(0, 0)));
        const normalizedHoverHelp = JSON.parse(JSON.stringify(hoverHelp));
        chai_1.expect(normalizedHoverHelp).to.eql([
            {
                contents: [
                    {
                        sanitize: true,
                        value: "```\nPrefixDecl\n```"
                    }
                ],
                range: [
                    {
                        line: 0,
                        character: 0
                    },
                    {
                        line: 0,
                        character: 52
                    }
                ]
            }
        ]);
    }));
    // Note that this test and the one above also test error-tolerance, since
    // the language assistance comes after a parse error.
    it("receives completion suggestions from the server", () => __awaiter(this, void 0, void 0, function* () {
        const completions = (yield vscode.commands.executeCommand("vscode.executeCompletionItemProvider", docUri, new vscode.Position(3, 5)));
        const normalizedSuggestedCompletion = JSON.parse(JSON.stringify(completions.items[0]));
        chai_1.expect(normalizedSuggestedCompletion).to.eql({
            label: "<http://www.fakezz.com/fakePrefix>",
            kind: "EnumMember",
            insertText: "<http://www.fakezz.com/fakePrefix>",
            textEdit: {
                range: [
                    {
                        line: 3,
                        character: 5
                    },
                    {
                        line: 3,
                        character: 6
                    }
                ],
                newText: "<http://www.fakezz.com/fakePrefix>"
            }
        });
    }));
});
//# sourceMappingURL=extension.test.js.map