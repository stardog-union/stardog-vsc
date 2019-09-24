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
describe("Stardog GraphQL Language Server Extension", () => {
    let docUri;
    let document;
    beforeEach(() => __awaiter(this, void 0, void 0, function* () {
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
                message: "'to' expected.",
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
                source: "BindDirective"
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
            }
        ]);
    });
    it("receives hover help from the server", () => __awaiter(this, void 0, void 0, function* () {
        docUri = vscode.Uri.file(path.join(__dirname, "..", "..", "fixtures", "good", "basic-good-graphql.graphql"));
        document = yield vscode.workspace.openTextDocument(docUri);
        yield vscode.window.showTextDocument(document);
        yield sleep(2000); // let server start
        const hoverHelp = (yield vscode.commands.executeCommand("vscode.executeHoverProvider", docUri, new vscode.Position(0, 19)));
        const normalizedHoverHelp = JSON.parse(JSON.stringify(hoverHelp));
        chai_1.expect(normalizedHoverHelp[0].contents[0].value).to.eql("```\nPrefixDirective\n```");
        chai_1.expect(normalizedHoverHelp[0].range).to.eql([
            {
                line: 0,
                character: 15
            },
            {
                line: 0,
                character: 35
            }
        ]);
    }));
    // Note that this test and the one above also test error-tolerance, since
    // the language assistance comes after a parse error.
    it("receives completion suggestions from the server", () => __awaiter(this, void 0, void 0, function* () {
        const completions = (yield vscode.commands.executeCommand("vscode.executeCompletionItemProvider", docUri, new vscode.Position(1, 14)));
        const normalizedSuggestedCompletion = JSON.parse(JSON.stringify(completions.items));
        chai_1.expect(normalizedSuggestedCompletion).to.eql([
            {
                label: "first",
                kind: "EnumMember",
                insertText: "first",
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
                    newText: "first"
                }
            },
            {
                label: "iri",
                kind: "EnumMember",
                insertText: "iri",
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
                    newText: "iri"
                }
            },
            {
                label: "limit",
                kind: "EnumMember",
                insertText: "limit",
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
                    newText: "limit"
                }
            },
            {
                label: "offset",
                kind: "EnumMember",
                insertText: "offset",
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
                    newText: "offset"
                }
            },
            {
                label: "orderBy",
                kind: "EnumMember",
                insertText: "orderBy",
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
                    newText: "orderBy"
                }
            },
            {
                label: "skip",
                kind: "EnumMember",
                insertText: "skip",
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
                    newText: "skip"
                }
            },
            {
                label: "to",
                kind: "EnumMember",
                insertText: "to",
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