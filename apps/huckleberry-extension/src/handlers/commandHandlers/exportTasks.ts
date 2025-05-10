/**
 * Command handler for exporting tasks
 */
import * as vscode from 'vscode';
import * as path from 'path';
import { isWorkspaceAvailable, notifyNoWorkspace } from '../chatHandler';
import { logWithChannel, LogLevel } from '../../utils/debugUtils';
import { checkCopilotAvailability } from '../../utils/copilotHelper';

/**
 * Command handler for exporting tasks
 */
export async function exportTasks(): Promise<void> {
  try {
    if (!isWorkspaceAvailable()) {
      notifyNoWorkspace();
      return;
    }

    // Check for Copilot availability before proceeding
    if (!(await checkCopilotAvailability())) {
      return;
    }

    // Ask the user for export format
    const exportFormat = await vscode.window.showQuickPick(
      ['Markdown', 'JSON', 'CSV'],
      {
        placeHolder: 'Select export format',
        title: 'Huckleberry: Export Tasks',
      },
    );

    if (!exportFormat) {
      // User cancelled format selection
      return;
    }

    // Prompt for a file path to save the export
    let defaultFileName = '';
    let fileExtension = '';

    switch (exportFormat) {
      case 'Markdown':
        defaultFileName = 'tasks.md';
        fileExtension = 'md';
        break;
      case 'JSON':
        defaultFileName = 'tasks.json';
        fileExtension = 'json';
        break;
      case 'CSV':
        defaultFileName = 'tasks.csv';
        fileExtension = 'csv';
        break;
    }

    // Try to get the first workspace folder as a default save location
    let defaultUri: vscode.Uri | undefined;
    if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
      defaultUri = vscode.Uri.joinPath(vscode.workspace.workspaceFolders[0].uri, defaultFileName);
    }

    // Show save dialog to get file path
    const targetUri = await vscode.window.showSaveDialog({
      defaultUri,
      filters: {
        [exportFormat]: [fileExtension],
      },
      title: `Export Tasks as ${exportFormat}`,
    });

    if (!targetUri) {
      // User cancelled file selection
      return;
    }

    // Get relative path for display purposes
    let displayPath = targetUri.fsPath;
    for (const folder of vscode.workspace.workspaceFolders || []) {
      if (targetUri.fsPath.startsWith(folder.uri.fsPath)) {
        displayPath = path.relative(folder.uri.fsPath, targetUri.fsPath);
        break;
      }
    }

    // Execute the command with the file path and format
    logWithChannel(LogLevel.INFO, `Exporting tasks to ${targetUri.fsPath} as ${exportFormat.toLowerCase()}`);
    vscode.commands.executeCommand(
      'workbench.action.chat.open',
      `@huckleberry Export tasks as ${exportFormat.toLowerCase()} to ${displayPath}`,
    );
  } catch (error) {
    logWithChannel(LogLevel.ERROR, 'Error in exportTasks command:', error);
    vscode.window.showErrorMessage(`Failed to export tasks: ${error instanceof Error ? error.message : String(error)}`);
  }
}