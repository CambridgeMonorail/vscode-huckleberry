import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    console.log('Congratulations, your extension "huckleberry-extension" is now active!');

    let disposable = vscode.commands.registerCommand('huckleberry-extension.helloWorld', () => {
        vscode.window.showInformationMessage('Hello World from huckleberry-extension!');
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {}
