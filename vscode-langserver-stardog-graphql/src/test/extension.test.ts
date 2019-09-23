import { expect } from "chai";
import * as path from "path";
import * as vscode from "vscode";

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

describe("Stardog GraphQL Language Server Extension", () => {
  let docUri: vscode.Uri;
  let document: vscode.TextDocument | null;

  beforeEach(async () => {
    const ext = vscode.extensions.getExtension("stardog-union.vscode-langserver-stardog-graphql")!;
    await ext.activate();
    docUri = vscode.Uri.file(
      path.join(__dirname, "..", "..", "fixtures", "bad", "basic-bad-graphql.graphql")
    );
    document = await vscode.workspace.openTextDocument(docUri);
    await vscode.window.showTextDocument(document);
    await sleep(2000); // let server start
  });

  afterEach(() => {
    document = null;
  });

  it("receives error diagnostics from the server", () => {
    const receivedDiagnostics = vscode.languages.getDiagnostics(docUri);
    const normalizedReceivedDiagnostics = JSON.parse(JSON.stringify(receivedDiagnostics));
    expect(normalizedReceivedDiagnostics).to.eql([
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

  it("receives hover help from the server", async () => {
    docUri = vscode.Uri.file(
      path.join(__dirname, "..", "..", "fixtures", "good", "basic-good-graphql.graphql")
    );
    document = await vscode.workspace.openTextDocument(docUri);
    await vscode.window.showTextDocument(document);
    await sleep(2000); // let server start
    const hoverHelp = (await vscode.commands.executeCommand(
      "vscode.executeHoverProvider",
      docUri,
      new vscode.Position(0, 19)
    )) as vscode.Hover;
    const normalizedHoverHelp = JSON.parse(JSON.stringify(hoverHelp));
    expect(normalizedHoverHelp[0].contents[0].value).to.eql("```\nPrefixDirective\n```");
    expect(normalizedHoverHelp[0].range).to.eql([
      {
        line: 0,
        character: 15
      },
      {
        line: 0,
        character: 35
      }
    ]);
  });

  // Note that this test and the one above also test error-tolerance, since
  // the language assistance comes after a parse error.
  it("receives completion suggestions from the server", async () => {
    const completions = (await vscode.commands.executeCommand(
      "vscode.executeCompletionItemProvider",
      docUri,
      new vscode.Position(1, 14)
    )) as vscode.CompletionList;
    const normalizedSuggestedCompletion = JSON.parse(JSON.stringify(completions.items));
    expect(normalizedSuggestedCompletion).to.eql([
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
  });
});
