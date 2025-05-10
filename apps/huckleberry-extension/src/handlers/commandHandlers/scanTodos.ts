/**
 * Command handler for scanning code for TODO comments
 */
import * as vscode from 'vscode';
import { isWorkspaceAvailable, notifyNoWorkspace } from '../chatHandler';
import { logWithChannel, LogLevel } from '../../utils/debugUtils';
import { checkCopilotAvailability } from '../../utils/copilotHelper';

/**
 * Command handler for scanning code for TODO comments
 * @param pattern Optional glob pattern to filter files for scanning
 */
export async function scanTodos(pattern?: string): Promise<void> {
  try {
    if (!isWorkspaceAvailable()) {
      notifyNoWorkspace();
      return;
    }

    // Check for Copilot availability before proceeding
    if (!(await checkCopilotAvailability())) {
      return;
    }

    // If no pattern is provided, prompt the user or use default
    if (!pattern) {
      // Ask if the user wants to specify a pattern
      const options = [
        'Scan all files',
        'Specify file pattern',
        'Cancel',
      ];

      const selection = await vscode.window.showQuickPick(options, {
        placeHolder: 'How would you like to scan for TODOs?',
        title: 'Huckleberry: Scan TODOs',
      });

      if (selection === 'Specify file pattern') {
        // Prompt for file pattern
        pattern = await vscode.window.showInputBox({
          placeHolder: 'e.g., **/*.{js,ts} or src/**/*.{jsx,tsx}',
          prompt: 'Enter a glob pattern to filter files for scanning',
          title: 'Huckleberry: Scan TODOs - File Pattern',
          value: '**/*.{js,ts,jsx,tsx,md}',
        });

        if (!pattern) {
          // User cancelled pattern input
          return;
        }
      } else if (selection === 'Cancel') {
        return;
      }
      // For 'Scan all files', we'll leave pattern undefined
    }

    // Execute the command with optional pattern
    const command = pattern
      ? `@huckleberry Scan todos in ${pattern}`
      : '@huckleberry Scan todos';

    vscode.commands.executeCommand('workbench.action.chat.open', command);
  } catch (error) {
    logWithChannel(LogLevel.ERROR, 'Error in scanTodos command:', error);
    vscode.window.showErrorMessage(`Failed to scan TODOs: ${error instanceof Error ? error.message : String(error)}`);
  }
}