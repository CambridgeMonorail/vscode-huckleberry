/**
 * Command handler for creating a new task
 */
import * as vscode from 'vscode';
import { isWorkspaceAvailable, notifyNoWorkspace } from '../chatHandler';
import { logWithChannel, LogLevel } from '../../utils/debugUtils';
import { checkCopilotAvailability } from '../../utils/copilotHelper';

/**
 * Command handler for creating a new task
 */
export async function createTask(): Promise<void> {
  try {
    logWithChannel(LogLevel.DEBUG, 'Starting createTask command.');

    if (!isWorkspaceAvailable()) {
      logWithChannel(LogLevel.DEBUG, 'Workspace is not available. Notifying user.');
      notifyNoWorkspace();
      return;
    }

    // Check for Copilot availability before proceeding
    if (!(await checkCopilotAvailability())) {
      logWithChannel(LogLevel.DEBUG, 'Copilot is not available. Exiting command.');
      return;
    }

    logWithChannel(LogLevel.DEBUG, 'Prompting user for priority selection.');
    // Import dynamically to prevent circular dependencies
    import('../../utils/parameterUtils').then(async ({ promptForPrioritySelection }) => {
      const selectedPriority = await promptForPrioritySelection();
      logWithChannel(LogLevel.DEBUG, 'User selected priority:', selectedPriority);

      // Prompt for task description
      const description = await vscode.window.showInputBox({
        placeHolder: 'Enter task description',
        prompt: 'What needs to be done?',
        title: 'Huckleberry: Create Task',
      });

      if (description) {
        logWithChannel(LogLevel.DEBUG, 'User entered task description:', description);
        // Execute the command with the provided values
        const priorityText = selectedPriority ? ` ${selectedPriority} priority task to` : ' task to';
        vscode.commands.executeCommand(
          'workbench.action.chat.open',
          `@huckleberry Create a${priorityText} ${description}`,
        );
        logWithChannel(LogLevel.DEBUG, 'Executed chat command with description and priority.');
      } else {
        logWithChannel(LogLevel.DEBUG, 'User cancelled task description input.');
      }
    }).catch(error => {
      logWithChannel(LogLevel.ERROR, 'Error importing parameter utilities:', error);
      vscode.window.showErrorMessage(`Failed to load task creation UI: ${error instanceof Error ? error.message : String(error)}`);
    });
  } catch (error) {
    logWithChannel(LogLevel.ERROR, 'Error in createTask command:', error);
    vscode.window.showErrorMessage(`Failed to create task: ${error instanceof Error ? error.message : String(error)}`);
  }
}