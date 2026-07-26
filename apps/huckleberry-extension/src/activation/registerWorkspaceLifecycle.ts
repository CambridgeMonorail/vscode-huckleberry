import * as vscode from 'vscode';
import { isWorkspaceAvailable } from '../handlers/chatHandler';
import { logWithChannel, LogLevel } from '../utils';
import { ExtensionServices } from './types';

/**
 * Registers workspace listeners used by the extension shell.
 */
export function registerWorkspaceLifecycle(
  context: vscode.ExtensionContext,
  services: ExtensionServices,
): void {
  const workspaceFoldersChangeDisposable = vscode.workspace.onDidChangeWorkspaceFolders(async e => {
    const foldersAdded = e.added.length > 0;
    const foldersRemoved = e.removed.length > 0;

    logWithChannel(LogLevel.INFO, 'Workspace folders changed', {
      added: e.added.map(folder => folder.name),
      removed: e.removed.map(folder => folder.name),
      current: vscode.workspace.workspaceFolders?.map(folder => folder.name) || [],
    });

    if (!foldersAdded && !foldersRemoved) {
      return;
    }

    logWithChannel(LogLevel.INFO, 'Refreshing chat participants due to workspace change');

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await services.chatService.forceRefresh();

      if (foldersAdded && isWorkspaceAvailable()) {
        vscode.window.showInformationMessage('Huckleberry Workflow Workbench is now ready to use with your workspace.');
      }
    } catch (error) {
      logWithChannel(LogLevel.ERROR, 'Failed to refresh chat participants after workspace change:', error);
    }
  });

  const reloadPromptDisposable = vscode.workspace.onDidChangeWorkspaceFolders(e => {
    if (e.added.length > 0) {
      vscode.window.showInformationMessage(
        'Huckleberry needs to reload the window to work after opening a folder. Reload now?',
        'Reload Window',
      ).then(selection => {
        if (selection === 'Reload Window') {
          vscode.commands.executeCommand('workbench.action.reloadWindow');
        }
      });
    }
  });

  context.subscriptions.push(workspaceFoldersChangeDisposable, reloadPromptDisposable);
}
