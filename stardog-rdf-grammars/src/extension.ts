import * as vscode from 'vscode';
import SPARQLFormatter from './providers/sparqlformatter';

export function activate(context: vscode.ExtensionContext) {
  console.log('activate');
  context.subscriptions.push(
    vscode.languages.registerDocumentFormattingEditProvider(['sparql'], new SPARQLFormatter()));
};