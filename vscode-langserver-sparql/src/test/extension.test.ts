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
        message: "\tExpected one of the following:\n '^'\n '!'\n '('\n IRIREF e.g. <http://example.com> '?'\n IRIREF e.g. <http://example.com> '*'\n IRIREF e.g. <http://example.com> '+'\n IRIREF e.g. <http://example.com> '/'\n IRIREF e.g. <http://example.com> '|'\n IRIREF e.g. <http://example.com> VAR1 e.g. ?foo\n IRIREF e.g. <http://example.com> VAR2 e.g. ?bar\n IRIREF e.g. <http://example.com> IRIREF e.g. <http://example.com>\n IRIREF e.g. <http://example.com> PNAME_LN\n IRIREF e.g. <http://example.com> PNAME_NS\n IRIREF e.g. <http://example.com> STRING_LITERAL1\n IRIREF e.g. <http://example.com> STRING_LITERAL2\n IRIREF e.g. <http://example.com> STRING_LITERAL_LONG1\n IRIREF e.g. <http://example.com> STRING_LITERAL_LONG2\n IRIREF e.g. <http://example.com> INTEGER\n IRIREF e.g. <http://example.com> DECIMAL\n IRIREF e.g. <http://example.com> DOUBLE\n IRIREF e.g. <http://example.com> INTEGER_POSITIVE\n IRIREF e.g. <http://example.com> DECIMAL_POSITIVE\n IRIREF e.g. <http://example.com> DOUBLE_POSITIVE\n IRIREF e.g. <http://example.com> INTEGER_NEGATIVE\n IRIREF e.g. <http://example.com> DECIMAL_NEGATIVE\n IRIREF e.g. <http://example.com> DOUBLE_NEGATIVE\n IRIREF e.g. <http://example.com> 'TRUE'\n IRIREF e.g. <http://example.com> 'FALSE'\n IRIREF e.g. <http://example.com> BLANK_NODE_LABEL\n IRIREF e.g. <http://example.com> ANON e.g. []\n IRIREF e.g. <http://example.com> NIL e.g. ()\n IRIREF e.g. <http://example.com> '<<'\n IRIREF e.g. <http://example.com> '('\n IRIREF e.g. <http://example.com> '['\n PNAME_LN '?'\n PNAME_LN '*'\n PNAME_LN '+'\n PNAME_LN '/'\n PNAME_LN '|'\n PNAME_LN VAR1 e.g. ?foo\n PNAME_LN VAR2 e.g. ?bar\n PNAME_LN IRIREF e.g. <http://example.com>\n PNAME_LN PNAME_LN\n PNAME_LN PNAME_NS\n PNAME_LN STRING_LITERAL1\n PNAME_LN STRING_LITERAL2\n PNAME_LN STRING_LITERAL_LONG1\n PNAME_LN STRING_LITERAL_LONG2\n PNAME_LN INTEGER\n PNAME_LN DECIMAL\n PNAME_LN DOUBLE\n PNAME_LN INTEGER_POSITIVE\n PNAME_LN DECIMAL_POSITIVE\n PNAME_LN DOUBLE_POSITIVE\n PNAME_LN INTEGER_NEGATIVE\n PNAME_LN DECIMAL_NEGATIVE\n PNAME_LN DOUBLE_NEGATIVE\n PNAME_LN 'TRUE'\n PNAME_LN 'FALSE'\n PNAME_LN BLANK_NODE_LABEL\n PNAME_LN ANON e.g. []\n PNAME_LN NIL e.g. ()\n PNAME_LN '<<'\n PNAME_LN '('\n PNAME_LN '['\n PNAME_NS '?'\n PNAME_NS '*'\n PNAME_NS '+'\n PNAME_NS '/'\n PNAME_NS '|'\n PNAME_NS VAR1 e.g. ?foo\n PNAME_NS VAR2 e.g. ?bar\n PNAME_NS IRIREF e.g. <http://example.com>\n PNAME_NS PNAME_LN\n PNAME_NS PNAME_NS\n PNAME_NS STRING_LITERAL1\n PNAME_NS STRING_LITERAL2\n PNAME_NS STRING_LITERAL_LONG1\n PNAME_NS STRING_LITERAL_LONG2\n PNAME_NS INTEGER\n PNAME_NS DECIMAL\n PNAME_NS DOUBLE\n PNAME_NS INTEGER_POSITIVE\n PNAME_NS DECIMAL_POSITIVE\n PNAME_NS DOUBLE_POSITIVE\n PNAME_NS INTEGER_NEGATIVE\n PNAME_NS DECIMAL_NEGATIVE\n PNAME_NS DOUBLE_NEGATIVE\n PNAME_NS 'TRUE'\n PNAME_NS 'FALSE'\n PNAME_NS BLANK_NODE_LABEL\n PNAME_NS ANON e.g. []\n PNAME_NS NIL e.g. ()\n PNAME_NS '<<'\n PNAME_NS '('\n PNAME_NS '['\n 'a' '?'\n 'a' '*'\n 'a' '+'\n 'a' '/'\n 'a' '|'\n 'a' VAR1 e.g. ?foo\n 'a' VAR2 e.g. ?bar\n 'a' IRIREF e.g. <http://example.com>\n 'a' PNAME_LN\n 'a' PNAME_NS\n 'a' STRING_LITERAL1\n 'a' STRING_LITERAL2\n 'a' STRING_LITERAL_LONG1\n 'a' STRING_LITERAL_LONG2\n 'a' INTEGER\n 'a' DECIMAL\n 'a' DOUBLE\n 'a' INTEGER_POSITIVE\n 'a' DECIMAL_POSITIVE\n 'a' DOUBLE_POSITIVE\n 'a' INTEGER_NEGATIVE\n 'a' DECIMAL_NEGATIVE\n 'a' DOUBLE_NEGATIVE\n 'a' 'TRUE'\n 'a' 'FALSE'\n 'a' BLANK_NODE_LABEL\n 'a' ANON e.g. []\n 'a' NIL e.g. ()\n 'a' '<<'\n 'a' '('\n 'a' '['\n VAR1 e.g. ?foo VAR1 e.g. ?foo\n VAR1 e.g. ?foo VAR2 e.g. ?bar\n VAR1 e.g. ?foo IRIREF e.g. <http://example.com>\n VAR1 e.g. ?foo PNAME_LN\n VAR1 e.g. ?foo PNAME_NS\n VAR1 e.g. ?foo STRING_LITERAL1\n VAR1 e.g. ?foo STRING_LITERAL2\n VAR1 e.g. ?foo STRING_LITERAL_LONG1\n VAR1 e.g. ?foo STRING_LITERAL_LONG2\n VAR1 e.g. ?foo INTEGER\n VAR1 e.g. ?foo DECIMAL\n VAR1 e.g. ?foo DOUBLE\n VAR1 e.g. ?foo INTEGER_POSITIVE\n VAR1 e.g. ?foo DECIMAL_POSITIVE\n VAR1 e.g. ?foo DOUBLE_POSITIVE\n VAR1 e.g. ?foo INTEGER_NEGATIVE\n VAR1 e.g. ?foo DECIMAL_NEGATIVE\n VAR1 e.g. ?foo DOUBLE_NEGATIVE\n VAR1 e.g. ?foo 'TRUE'\n VAR1 e.g. ?foo 'FALSE'\n VAR1 e.g. ?foo BLANK_NODE_LABEL\n VAR1 e.g. ?foo ANON e.g. []\n VAR1 e.g. ?foo NIL e.g. ()\n VAR1 e.g. ?foo '<<'\n VAR1 e.g. ?foo '('\n VAR1 e.g. ?foo '['\n VAR2 e.g. ?bar VAR1 e.g. ?foo\n VAR2 e.g. ?bar VAR2 e.g. ?bar\n VAR2 e.g. ?bar IRIREF e.g. <http://example.com>\n VAR2 e.g. ?bar PNAME_LN\n VAR2 e.g. ?bar PNAME_NS\n VAR2 e.g. ?bar STRING_LITERAL1\n VAR2 e.g. ?bar STRING_LITERAL2\n VAR2 e.g. ?bar STRING_LITERAL_LONG1\n VAR2 e.g. ?bar STRING_LITERAL_LONG2\n VAR2 e.g. ?bar INTEGER\n VAR2 e.g. ?bar DECIMAL\n VAR2 e.g. ?bar DOUBLE\n VAR2 e.g. ?bar INTEGER_POSITIVE\n VAR2 e.g. ?bar DECIMAL_POSITIVE\n VAR2 e.g. ?bar DOUBLE_POSITIVE\n VAR2 e.g. ?bar INTEGER_NEGATIVE\n VAR2 e.g. ?bar DECIMAL_NEGATIVE\n VAR2 e.g. ?bar DOUBLE_NEGATIVE\n VAR2 e.g. ?bar 'TRUE'\n VAR2 e.g. ?bar 'FALSE'\n VAR2 e.g. ?bar BLANK_NODE_LABEL\n VAR2 e.g. ?bar ANON e.g. []\n VAR2 e.g. ?bar NIL e.g. ()\n VAR2 e.g. ?bar '<<'\n VAR2 e.g. ?bar '('\n VAR2 e.g. ?bar '['\n VAR1 e.g. ?foo '{'\n VAR2 e.g. ?bar '{'\n IRIREF e.g. <http://example.com> '{'\n PNAME_LN '{'\n PNAME_NS '{'\n 'a' '{'",
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
    )) as vscode.Hover[];
    const { contents } = hoverHelp[0];
    const range = hoverHelp[0].range as vscode.Range;
    expect(typeof contents[0] === 'string' ? contents[0] : contents[0].value).to.eql("```\nPrefixDecl\n```");
    expect(range.start.line).to.eql(0);
    expect(range.start.character).to.eql(0);
    expect(range.end.line).to.eql(0);
    expect(range.end.character).to.eql(52);
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
      sortText: "<http://www.fakezz.com/fakePrefix>",
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
