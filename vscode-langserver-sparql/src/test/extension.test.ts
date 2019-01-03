import { expect } from "chai";
import * as path from "path";
import * as vscode from "vscode";

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

describe("SPARQL Language Server Extension", () => {
  let docUri: vscode.Uri;
  let document: vscode.TextDocument | null;

  beforeEach(async () => {
    const ext = vscode.extensions.getExtension("stardog-union.vscode-langserver-sparql")!;
    await ext.activate();
    docUri = vscode.Uri.file(
      path.join(__dirname, "..", "..", "fixtures", "bad", "basic-bad-select.sparql")
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
        message:
          "\tExpected one of the following:\n '^'\n IRIREF e.g. <http://example.com>\n PNAME_LN\n PNAME_NS\n 'a'\n '!'\n '('\n VAR1 e.g. ?foo\n VAR2 e.g. ?bar",
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

  it("receives hover help from the server", async () => {
    const hoverHelp = (await vscode.commands.executeCommand(
      "vscode.executeHoverProvider",
      docUri,
      new vscode.Position(0, 0)
    )) as vscode.Hover;
    const normalizedHoverHelp = JSON.parse(JSON.stringify(hoverHelp));
    expect(normalizedHoverHelp).to.eql([
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
  });

  // Note that this test and the one above also test error-tolerance, since
  // the language assistance comes after a parse error.
  it("receives completion suggestions from the server", async () => {
    const completions = (await vscode.commands.executeCommand(
      "vscode.executeCompletionItemProvider",
      docUri,
      new vscode.Position(3, 5)
    )) as vscode.CompletionList;
    const normalizedSuggestedCompletion = JSON.parse(JSON.stringify(completions.items[0]));
    expect(normalizedSuggestedCompletion).to.eql({
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
  });
});
