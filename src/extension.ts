// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
  console.log('extension activated');
  const hoverProvider = vscode.languages.registerHoverProvider(
    [
      { language: 'html', scheme: 'file' },
      { language: 'vue', scheme: 'file' }
    ],
    {
      provideHover(document, position, token) {
        console.log('hover triggered');
        const wordRange = document.getWordRangeAtPosition(position, /\bclass\b/);
        const word = wordRange ? document.getText(wordRange) : '';
        if (word === 'class') {
          return new vscode.Hover('haha再见');
        }
        return undefined;
      }
    }
  );
  context.subscriptions.push(hoverProvider);
}

export function deactivate() {}
