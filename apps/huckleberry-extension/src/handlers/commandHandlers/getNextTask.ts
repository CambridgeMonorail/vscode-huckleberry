/**
 * Command handler for getting the next task suggestion
 */
import * as vscode from 'vscode';
import { isWorkspaceAvailable, notifyNoWorkspace } from '../chatHandler';
import { logWithChannel, LogLevel } from '../../utils/debugUtils';
import { checkCopilotAvailability } from '../../utils/copilotHelper';

/**
 * Command handler for getting the next task suggestion
 */
export async function getNextTask(): Promise<void> {
  try {
    if (!isWorkspaceAvailable()) {
      notifyNoWorkspace();
      return;
    }

    // Check for Copilot availability before proceeding
    if (!(await checkCopilotAvailability())) {
      return;
    }

    // Open chat with Huckleberry and send the next task command
    vscode.commands.executeCommand(
      'workbench.action.chat.open',
      '@huckleberry What task should I work on next?',
    );
  } catch (error) {
    logWithChannel(LogLevel.ERROR, 'Error in getNextTask command:', error);
    vscode.window.showErrorMessage(`Failed to get next task recommendation: ${error instanceof Error ? error.message : String(error)}`);
  }
}