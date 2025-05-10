/**
 * Command handler for opening the task explorer
 */
import * as vscode from 'vscode';
import { isWorkspaceAvailable, notifyNoWorkspace } from '../chatHandler';
import { logWithChannel, LogLevel } from '../../utils/debugUtils';
import { checkCopilotAvailability } from '../../utils/copilotHelper';

/**
 * Command handler for opening the task explorer
 */
export async function openTaskExplorer(): Promise<void> {
  try {
    if (!isWorkspaceAvailable()) {
      notifyNoWorkspace();
      return;
    }

    // Check for Copilot availability before proceeding
    if (!(await checkCopilotAvailability())) {
      return;
    }

    // Log that the command was executed
    logWithChannel(LogLevel.INFO, '🔍 Opening task explorer UI');

    // Open chat with Huckleberry and send the explore tasks command
    vscode.commands.executeCommand(
      'workbench.action.chat.open',
      '@huckleberry Show task explorer',
    );
  } catch (error) {
    logWithChannel(LogLevel.ERROR, 'Error in openTaskExplorer command:', error);
    vscode.window.showErrorMessage(`Failed to open task explorer: ${error instanceof Error ? error.message : String(error)}`);
  }
}