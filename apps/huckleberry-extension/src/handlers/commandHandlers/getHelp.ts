/**
 * Command handler for showing help documentation
 */
import * as vscode from 'vscode';
import { isWorkspaceAvailable, notifyNoWorkspace } from '../chatHandler';
import { logWithChannel, LogLevel } from '../../utils/debugUtils';
import { getExtensionState } from '../../services/extensionStateService';

/**
 * Command handler for showing help documentation
 * @param topic Optional help topic to display
 */
export function getHelp(topic?: string): void {
  try {
    if (!isWorkspaceAvailable()) {
      notifyNoWorkspace();
      return;
    }

    const state = getExtensionState();
    if (!state?.toolManager) {
      vscode.window.showErrorMessage('Extension not properly initialized');
      return;
    }

    // If no topic is provided, prompt the user to select one
    if (!topic) {
      // Import dynamically to prevent circular dependencies
      import('../../utils/parameterUtils').then(async ({ promptForHelpTopic }) => {
        const selectedTopic = await promptForHelpTopic();

        // Construct the appropriate command
        const commandText = selectedTopic
          ? `@huckleberry help ${selectedTopic}`
          : '@huckleberry help';

        // Execute the command
        vscode.commands.executeCommand('workbench.action.chat.open', commandText);
      }).catch(error => {
        logWithChannel(LogLevel.ERROR, 'Error importing parameter utilities:', error);
        vscode.window.showErrorMessage(`Failed to load help topic selection UI: ${error instanceof Error ? error.message : String(error)}`);
      });
    } else {
      // Execute the command with the provided topic
      vscode.commands.executeCommand(
        'workbench.action.chat.open',
        `@huckleberry help ${topic}`,
      );
    }
  } catch (error) {
    logWithChannel(LogLevel.ERROR, 'Error in getHelp command:', error);
    vscode.window.showErrorMessage(`Failed to show help: ${error instanceof Error ? error.message : String(error)}`);
  }
}