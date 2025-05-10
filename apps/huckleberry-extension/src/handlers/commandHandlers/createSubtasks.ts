/**
 * Command handler for creating subtasks from a parent task
 */
import * as vscode from 'vscode';
import { isWorkspaceAvailable, notifyNoWorkspace } from '../chatHandler';
import { logWithChannel, LogLevel } from '../../utils/debugUtils';
import { checkCopilotAvailability } from '../../utils/copilotHelper';
import { getExtensionState } from '../../services/extensionStateService';

/**
 * Command handler for creating subtasks
 */
export async function createSubtasks(): Promise<void> {
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

    // Import dynamically to prevent circular dependencies
    import('../../utils/parameterUtils').then(async ({ promptForTaskSelection }) => {
      const state = getExtensionState();
      if (!state?.toolManager) {
        vscode.window.showErrorMessage('Extension not properly initialized');
        return;
      }
      
      // Prompt for task selection - show a title in the QuickPick UI
      // We need to pass false or undefined as the second parameter, not a string
      const parentTaskId = await promptForTaskSelection(state.toolManager, false);
      
      if (!parentTaskId) {
        return;
      }

      // First try to use the BreakTaskTool directly
      const breakTaskTool = state.toolManager.getTool('breakTask');
      if (breakTaskTool) {
        try {
          logWithChannel(LogLevel.INFO, `Breaking down task ${parentTaskId} into subtasks using BreakTaskTool`);
          breakTaskTool.execute({ taskId: parentTaskId }).then(() => {
            // Success - show notification
            vscode.window.showInformationMessage(`Created subtasks for task ${parentTaskId}`);
          }).catch(error => {
            // Fall back to chat if tool execution fails
            logWithChannel(LogLevel.WARN, `BreakTaskTool failed, falling back to chat: ${error}`);
            createSubtasksViaChat(parentTaskId);
          });
          return;
        } catch (error) {
          logWithChannel(LogLevel.WARN, `Error using BreakTaskTool: ${error}`);
          // Fall through to chat approach
        }
      }

      // Fall back to chat if tool not available
      createSubtasksViaChat(parentTaskId);
    }).catch(error => {
      logWithChannel(LogLevel.ERROR, 'Error importing parameter utilities:', error);
      vscode.window.showErrorMessage(`Failed to load task selection UI: ${error instanceof Error ? error.message : String(error)}`);
    });
  } catch (error) {
    logWithChannel(LogLevel.ERROR, 'Error in createSubtasks command:', error);
    vscode.window.showErrorMessage(`Failed to create subtasks: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Helper function to create subtasks via chat
 */
function createSubtasksViaChat(taskId: string): void {
  vscode.commands.executeCommand(
    'workbench.action.chat.open',
    `@huckleberry Break down task ${taskId} into subtasks`,
  );
}