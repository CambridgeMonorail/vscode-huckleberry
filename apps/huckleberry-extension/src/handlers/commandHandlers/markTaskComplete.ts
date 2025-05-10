/**
 * Command handler for marking a task as complete
 */
import * as vscode from 'vscode';
import { isWorkspaceAvailable, notifyNoWorkspace } from '../chatHandler';
import { logWithChannel, LogLevel } from '../../utils/debugUtils';
import { checkCopilotAvailability } from '../../utils/copilotHelper';
import { getExtensionState } from '../../services/extensionStateService';

/**
 * Command handler for marking a task as complete
 * @param taskId Optional task ID to mark as complete
 */
export async function markTaskComplete(taskId?: string): Promise<void> {
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

    // If taskId is not provided, prompt the user
    if (!taskId) {
      // Import dynamically to prevent circular dependencies
      import('../../utils/parameterUtils').then(async ({ promptForTaskSelection }) => {
        const state = getExtensionState();
        if (!state?.toolManager) {
          vscode.window.showErrorMessage('Extension not properly initialized');
          return;
        }
        const selectedTaskId = await promptForTaskSelection(state.toolManager);

        if (selectedTaskId) {
          // Execute the command with the selected task ID
          executeMarkTaskComplete(selectedTaskId);
        }
      }).catch(error => {
        logWithChannel(LogLevel.ERROR, 'Error importing parameter utilities:', error);
        vscode.window.showErrorMessage(`Failed to load task selection UI: ${error instanceof Error ? error.message : String(error)}`);
      });
    } else {
      // Execute the command with the provided task ID
      executeMarkTaskComplete(taskId);
    }
  } catch (error) {
    logWithChannel(LogLevel.ERROR, 'Error in markTaskComplete command:', error);
    vscode.window.showErrorMessage(`Failed to mark task as complete: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Helper function to execute the mark task complete command
 */
function executeMarkTaskComplete(taskId: string): void {
  // First try to use the MarkDoneTool directly
  const state = getExtensionState();
  if (state?.toolManager) {
    const markDoneTool = state.toolManager.getTool('markDone');
    if (markDoneTool) {
      try {
        logWithChannel(LogLevel.INFO, `Marking task ${taskId} as complete using MarkDoneTool`);
        markDoneTool.execute({ taskId }).then(() => {
          // Success - show notification
          vscode.window.showInformationMessage(`Task ${taskId} marked as complete`);
        }).catch(error => {
          // Fall back to chat if tool execution fails
          logWithChannel(LogLevel.WARN, `MarkDoneTool failed, falling back to chat: ${error}`);
          executeMarkTaskCompleteViaChat(taskId);
        });
        return;
      } catch (error) {
        logWithChannel(LogLevel.WARN, `Error using MarkDoneTool: ${error}`);
        // Fall through to chat approach
      }
    }
  }

  // Fall back to chat if tool not available
  executeMarkTaskCompleteViaChat(taskId);
}

/**
 * Helper function to execute the mark task complete command via chat
 */
function executeMarkTaskCompleteViaChat(taskId: string): void {
  vscode.commands.executeCommand(
    'workbench.action.chat.open',
    `@huckleberry Mark task ${taskId} as complete`,
  );
}