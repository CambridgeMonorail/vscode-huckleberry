/**
 * Command handler for changing a task's priority
 */
import * as vscode from 'vscode';
import { isWorkspaceAvailable, notifyNoWorkspace } from '../chatHandler';
import { logWithChannel, LogLevel } from '../../utils/debugUtils';
import { checkCopilotAvailability } from '../../utils/copilotHelper';
import { getExtensionState } from '../../services/extensionStateService';

/**
 * Command handler for changing a task's priority
 * @param taskId Optional task ID to change priority for
 * @param priority Optional priority to set
 */
export async function changeTaskPriority(taskId?: string, priority?: string): Promise<void> {
  try {
    if (!isWorkspaceAvailable()) {
      notifyNoWorkspace();
      return;
    }

    // Check for Copilot availability before proceeding
    if (!(await checkCopilotAvailability())) {
      return;
    }

    const state = getExtensionState();
    if (!state?.toolManager) {
      vscode.window.showErrorMessage('Extension not properly initialized');
      return;
    }

    // If taskId or priority is not provided, prompt the user
    if (!taskId || !priority) {
      // Import dynamically to prevent circular dependencies
      import('../../utils/parameterUtils').then(async ({ promptForTaskAndPriority }) => {
        const state = getExtensionState();
        if (!state?.toolManager) {
          vscode.window.showErrorMessage('Extension not properly initialized');
          return;
        }
        const result = await promptForTaskAndPriority(state.toolManager);
        if (result.taskId && result.priority) {
          // Execute the command with the selected values
          vscode.commands.executeCommand(
            'workbench.action.chat.open',
            `@huckleberry Mark task ${result.taskId} as ${result.priority} priority`,
          );
        }
      }).catch(error => {
        logWithChannel(LogLevel.ERROR, 'Error importing parameter utilities:', error);
        vscode.window.showErrorMessage(`Failed to load task selection UI: ${error instanceof Error ? error.message : String(error)}`);
      });
    } else {
      // Execute the command with the provided values
      vscode.commands.executeCommand(
        'workbench.action.chat.open',
        `@huckleberry Mark task ${taskId} as ${priority} priority`,
      );
    }
  } catch (error) {
    logWithChannel(LogLevel.ERROR, 'Error in changeTaskPriority command:', error);
    vscode.window.showErrorMessage(`Failed to change task priority: ${error instanceof Error ? error.message : String(error)}`);
  }
}