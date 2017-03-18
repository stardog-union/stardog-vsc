import * as vscode from 'vscode';

// `{`, `[`, `;` will have a new line after them (but not before) and next line will be indented, 
// `]` and `}` should start a new line aligned with the block of the matching character
export default class SPARQLFormatter implements vscode.DocumentFormattingEditProvider {
  /**
   * provideDocumentFormattingEdits
   */
  public provideDocumentFormattingEdits(
    document: vscode.TextDocument,
    options: vscode.FormattingOptions,
    token: vscode.CancellationToken): Thenable<vscode.TextEdit[]> {
    return new Promise((resolve, reject) => {
      const text = document.getText();
    });
  }
}