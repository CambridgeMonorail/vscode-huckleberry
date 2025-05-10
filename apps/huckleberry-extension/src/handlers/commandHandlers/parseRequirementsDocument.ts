/**
 * Command handler for parsing requirements documents
 */
import * as vscode from 'vscode';
import * as path from 'path';
import { isWorkspaceAvailable, notifyNoWorkspace } from '../chatHandler';
import { logWithChannel, LogLevel } from '../../utils/debugUtils';
import { checkCopilotAvailability } from '../../utils/copilotHelper';

/**
 * Command handler for parsing requirements documents
 * @param filePath Optional file path to parse
 */
export async function parseRequirementsDocument(filePath?: string): Promise<void> {
  try {
    if (!isWorkspaceAvailable()) {
      notifyNoWorkspace();
      return;
    }

    // Check for Copilot availability before proceeding
    if (!(await checkCopilotAvailability())) {
      return;
    }

    // If no filePath is provided, prompt the user to select a file
    if (!filePath) {
      const mdFiles = await vscode.workspace.findFiles('**/*.{md,txt}', '**/node_modules/**');
      
      if (mdFiles.length === 0) {
        vscode.window.showWarningMessage('No markdown or text files found in the workspace.');
        return;
      }

      const fileItems = await Promise.all(mdFiles.map(async file => {
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(file);
        const relativePath = workspaceFolder ? path.relative(workspaceFolder.uri.fsPath, file.fsPath) : file.fsPath;
        
        return {
          label: relativePath,
          description: workspaceFolder?.name || '',
          detail: file.fsPath,
        };
      }));

      const selectedFile = await vscode.window.showQuickPick(fileItems, {
        placeHolder: 'Select a requirements document to parse',
        title: 'Huckleberry: Parse Requirements',
      });

      if (!selectedFile) {
        // User cancelled file selection
        return;
      }

      filePath = selectedFile.detail;
    }

    // Get relative path for display purposes
    let displayPath = filePath;
    for (const folder of vscode.workspace.workspaceFolders || []) {
      if (filePath.startsWith(folder.uri.fsPath)) {
        displayPath = path.relative(folder.uri.fsPath, filePath);
        break;
      }
    }

    logWithChannel(LogLevel.INFO, `Parsing requirements document: ${filePath}`);

    // Execute the command with the file path
    vscode.commands.executeCommand(
      'workbench.action.chat.open',
      `@huckleberry Parse requirements from ${displayPath}`,
    );
  } catch (error) {
    logWithChannel(LogLevel.ERROR, 'Error in parseRequirementsDocument command:', error);
    vscode.window.showErrorMessage(`Failed to parse requirements document: ${error instanceof Error ? error.message : String(error)}`);
  }
}