/**
 * Command handler for enriching a task with more details
 */
import * as vscode from 'vscode';
import { isWorkspaceAvailable, notifyNoWorkspace } from '../chatHandler';
import { logWithChannel, LogLevel } from '../../utils/debugUtils';
import { checkCopilotAvailability } from '../../utils/copilotHelper';
import { getExtensionState } from '../../services/extensionStateService';

/**
 * Command handler for enriching a task with more details
 */
export async function enrichTask(): Promise<void> {
  try {
    if (!isWorkspaceAvailable()) {
      notifyNoWorkspace();
      return;
    }

    // Check for Copilot availability before proceeding
    if (!(await checkCopilotAvailability())) {
      return;
    }    const cachedState = getExtensionState();
    if (!cachedState?.toolManager) {
      vscode.window.showErrorMessage('Extension not properly initialized');
      return;
    }

    // Import dynamically to prevent circular dependencies
    import('../../utils/parameterUtils').then(async ({ promptForTaskSelection }) => {
      if (!cachedState?.toolManager) {
        vscode.window.showErrorMessage('Extension not properly initialized');
        return;
      }
      // Prompt for task selection - pass false as the second parameter (not a string)
      const taskId = await promptForTaskSelection(cachedState.toolManager, false);
      
      if (!taskId) {
        return;
      }

      // Execute the command with the selected task ID
      logWithChannel(LogLevel.INFO, `Enriching task ${taskId}`);
      vscode.commands.executeCommand(
        'workbench.action.chat.open',
        `@huckleberry Enrich task ${taskId} with more details`,
      );
    }).catch(error => {
      logWithChannel(LogLevel.ERROR, 'Error importing parameter utilities:', error);
      vscode.window.showErrorMessage(`Failed to load task selection UI: ${error instanceof Error ? error.message : String(error)}`);
    });
  } catch (error) {
    logWithChannel(LogLevel.ERROR, 'Error in enrichTask command:', error);
    vscode.window.showErrorMessage(`Failed to enrich task: ${error instanceof Error ? error.message : String(error)}`);
  }
}