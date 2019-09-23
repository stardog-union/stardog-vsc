import { expect } from "chai";
import * as path from "path";
import * as vscode from "vscode";

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

describe("SHACL Language Server Extension", () => {
  let docUri: vscode.Uri;
  let document: vscode.TextDocument | null;

  beforeEach(async () => {
    const ext = vscode.extensions.getExtension("stardog-union.vscode-langserver-shacl")!;
    await ext.activate();
    docUri = vscode.Uri.file(
      path.join(__dirname, "..", "..", "fixtures", "bad", "basic-bad-shacl.shacl")
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

  it("receives hover help from the server", async () => {
    const hoverHelp = (await vscode.commands.executeCommand(
      "vscode.executeHoverProvider",
      docUri,
      new vscode.Position(0, 0)
    )) as vscode.Hover;
    const normalizedHoverHelp = JSON.parse(JSON.stringify(hoverHelp));
    expect(normalizedHoverHelp[0].contents[0].value).to.eql("```\nPrefixedName\n```");
    expect(normalizedHoverHelp[0].range).to.eql([
      {
        line: 0,
        character: 0
      },
      {
        line: 0,
        character: 14
      }
    ]);
  });

  it("provides completion suggestions", async () => {
    docUri = vscode.Uri.file(
      path.join(__dirname, "..", "..", "fixtures", "bad", "basic-incomplete-shacl.shacl")
    );
    document = await vscode.workspace.openTextDocument(docUri);
    await vscode.window.showTextDocument(document);
    await sleep(2000); // let server start

    const completions = (await vscode.commands.executeCommand(
      "vscode.executeCompletionItemProvider",
      docUri,
      document.positionAt(86)
    )) as vscode.CompletionList;
    const normalizedSuggestedCompletions = JSON.parse(JSON.stringify(completions.items));
    // tslint:disable:no-unused-expression
    expect(normalizedSuggestedCompletions.some((item: any) => item.label === "sh:targetClass")).to
      .be.true;
  });
});
