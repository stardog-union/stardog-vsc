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
describe("Stardog GraphQL Language Server Extension", () => {
    let docUri;
    let document;
    beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
        const ext = vscode.extensions.getExtension("stardog-union.vscode-langserver-stardog-graphql");
        yield ext.activate();
        docUri = vscode.Uri.file(path.join(__dirname, "..", "..", "fixtures", "bad", "basic-bad-graphql.graphql"));
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
                message: "\tExpected one of the following:\n Name",
                range: [
                    {
                        line: 1,
                        character: 14
                    },
                    {
                        line: 1,
                        character: 15
                    }
                ],
                source: "Arguments",
            },
            {
                severity: "Error",
                message: "\tExpected one of the following:\n Name\n '...'",
                range: [
                    {
                        line: 3,
                        character: 2
                    },
                    {
                        line: 3,
                        character: 3
                    }
                ],
                source: "SelectionSet"
            },
            {
                severity: "Error",
                message: "Expected EOF.",
                range: [
                    {
                        line: 4,
                        character: 0
                    },
                    {
                        line: 4,
                        character: 1
                    }
                ]
            },
            {
                message: "The bind directive requires 1 argument (valid arguments: `to`)",
                range: [
                    {
                        character: 9,
                        line: 1,
                    },
                    {
                        character: 13,
                        line: 1,
                    }
                ],
                severity: "Error",
            }
        ]);
    });
    it("receives hover help from the server", () => __awaiter(void 0, void 0, void 0, function* () {
        docUri = vscode.Uri.file(path.join(__dirname, "..", "..", "fixtures", "good", "basic-good-graphql.graphql"));
        document = yield vscode.workspace.openTextDocument(docUri);
        yield vscode.window.showTextDocument(document);
        yield sleep(2000); // let server start
        const hoverHelp = (yield vscode.commands.executeCommand("vscode.executeHoverProvider", docUri, new vscode.Position(0, 19)));
        const { contents } = hoverHelp[0];
        const range = hoverHelp[0].range;
        chai_1.expect(typeof contents[0] === 'string' ? contents[0] : contents[0].value).to.eql("```\nDirective\n```");
        chai_1.expect(range.start.line).to.eql(0);
        chai_1.expect(range.start.character).to.eql(14);
        chai_1.expect(range.end.line).to.eql(0);
        chai_1.expect(range.end.character).to.eql(35);
    }));
    // Note that this test and the one above also test error-tolerance, since
    // the language assistance comes after a parse error.
    it("receives completion suggestions from the server", () => __awaiter(void 0, void 0, void 0, function* () {
        const completions = (yield vscode.commands.executeCommand("vscode.executeCompletionItemProvider", docUri, new vscode.Position(1, 14)));
        const normalizedSuggestedCompletion = JSON.parse(JSON.stringify(completions.items));
        chai_1.expect(normalizedSuggestedCompletion).to.eql([
            {
                label: "to",
                kind: "EnumMember",
                insertText: "to",
                sortText: "to",
                textEdit: {
                    range: [
                        {
                            line: 1,
                            character: 14
                        },
                        {
                            line: 1,
                            character: 14
                        }
                    ],
                    newText: "to"
                }
            }
        ]);
    }));
});
//# sourceMappingURL=extension.test.js.map