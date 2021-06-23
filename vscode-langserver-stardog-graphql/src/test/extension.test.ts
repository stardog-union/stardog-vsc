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
    )) as vscode.Hover[];
    const { contents } = hoverHelp[0];
    const range = hoverHelp[0].range as vscode.Range;
    expect(typeof contents[0] === 'string' ? contents[0] : contents[0].value).to.eql("```\nDirective\n```");
    expect(range.start.line).to.eql(0);
    expect(range.start.character).to.eql(14);
    expect(range.end.line).to.eql(0);
    expect(range.end.character).to.eql(35);
  });

  // Note that this test and the one above also test error-tolerance, since
  // the language assistance comes after a parse error.
  it("receives completion suggestions from the server", async () => {
    console.log(docUri.toString());
    process.stdout.write(docUri.toString());
    process.stderr.write(docUri.toString());
    vscode.extensions.all.forEach((extension) => console.log(`${extension.id}, ${extension.isActive}`));
    vscode.extensions.all.forEach((extension) => process.stdout.write(`${extension.id}, ${extension.isActive}`));
    vscode.extensions.all.forEach((extension) => process.stderr.write(`${extension.id}, ${extension.isActive}`));
    const completions = (await vscode.commands.executeCommand(
      "vscode.executeCompletionItemProvider",
      docUri,
      new vscode.Position(1, 14)
    )) as vscode.CompletionList;
    const normalizedSuggestedCompletion = JSON.parse(JSON.stringify(completions.items));
    expect(normalizedSuggestedCompletion).to.eql([
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
  });
});
