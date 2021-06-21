import { expect } from "chai";
import * as path from "path";
import * as vscode from "vscode";

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

describe("TriG Language Server Extension", () => {
  let docUri: vscode.Uri;
  let document: vscode.TextDocument | null;

  beforeEach(async () => {
    const ext = vscode.extensions.getExtension("stardog-union.vscode-langserver-trig")!;
    await ext.activate();
    docUri = vscode.Uri.file(
      path.join(__dirname, "..", "..", "fixtures", "bad", "basic-bad-trig.trig")
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
        message: "'}' expected.",
        range: [
          {
            line: 1,
            character: 21
          },
          {
            line: 1,
            character: 22
          }
        ],
        source: "wrappedGraph"
      }
    ]);
  });

  it("receives hover help from the server", async () => {
    const hoverHelp = (await vscode.commands.executeCommand(
      "vscode.executeHoverProvider",
      docUri,
      new vscode.Position(0, 0)
    )) as vscode.Hover[];
    const { contents } = hoverHelp[0];
    const range = hoverHelp[0].range as vscode.Range;
    expect(typeof contents[0] === 'string' ? contents[0] : contents[0].value).to.eql("```\nblock\n```");
    expect(range.start.line).to.eql(0);
    expect(range.start.character).to.eql(0);
    expect(range.end.line).to.eql(2);
    expect(range.end.character).to.eql(1);
  });
});
