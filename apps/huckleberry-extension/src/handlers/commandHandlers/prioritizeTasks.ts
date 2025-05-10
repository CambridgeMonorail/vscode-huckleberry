/**
 * Command handler for prioritizing tasks
 */
import * as vscode from 'vscode';
import { isWorkspaceAvailable, notifyNoWorkspace } from '../chatHandler';
import { logWithChannel, LogLevel } from '../../utils/debugUtils';
import { checkCopilotAvailability } from '../../utils/copilotHelper';

/**
 * Command handler for prioritizing tasks
 */
export async function prioritizeTasks(): Promise<void> {
  try {
    if (!isWorkspaceAvailable()) {
      notifyNoWorkspace();
      return;
    }

    // Check for Copilot availability before proceeding
    if (!(await checkCopilotAvailability())) {
      return;
    }

    // Open chat with Huckleberry and send the prioritize command
    vscode.commands.executeCommand(
      'workbench.action.chat.open',
      '@huckleberry Prioritize tasks by status and priority',
    );
  } catch (error) {
    logWithChannel(LogLevel.ERROR, 'Error in prioritizeTasks command:', error);
    vscode.window.showErrorMessage(`Failed to prioritize tasks: ${error instanceof Error ? error.message : String(error)}`);
  }
}