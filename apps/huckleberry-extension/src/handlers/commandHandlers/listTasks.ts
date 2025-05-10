/**
 * Command handler for listing tasks
 */
import * as vscode from 'vscode';
import { isWorkspaceAvailable, notifyNoWorkspace } from '../chatHandler';
import { logWithChannel, LogLevel } from '../../utils/debugUtils';
import { checkCopilotAvailability } from '../../utils/copilotHelper';

/**
 * Command handler for listing tasks
 * @param priority Optional priority filter for tasks
 * @param status Optional status filter for tasks
 */
export async function listTasks(priority?: string, status?: string): Promise<void> {
  try {
    if (!isWorkspaceAvailable()) {
      notifyNoWorkspace();
      return;
    }

    // Check for Copilot availability before proceeding
    if (!(await checkCopilotAvailability())) {
      return;
    }

    // If no filters provided, prompt for selection
    if (!priority && !status) {
      // Use built-in VS Code API instead of requiring non-existent function
      const filterOptions = [
        { label: 'Show All Tasks', description: 'List all tasks without filters' },
        { label: 'Filter by Priority', description: 'Show tasks with specific priority' },
        { label: 'Filter by Status', description: 'Show tasks with specific status' },
      ];

      const selected = await vscode.window.showQuickPick(filterOptions, {
        placeHolder: 'Select a filtering option',
        title: 'Huckleberry: List Tasks',
      });

      if (!selected) {
        return; // User cancelled
      }

      if (selected.label === 'Filter by Priority') {
        const priorityOptions = [
          { label: 'Critical Priority', value: 'critical' },
          { label: 'High Priority', value: 'high' },
          { label: 'Medium Priority', value: 'medium' },
          { label: 'Low Priority', value: 'low' },
        ];

        const prioritySelected = await vscode.window.showQuickPick(priorityOptions, {
          placeHolder: 'Select a priority to filter by',
          title: 'Huckleberry: Filter by Priority',
        });

        if (prioritySelected) {
          // Execute with the selected priority filter
          vscode.commands.executeCommand(
            'workbench.action.chat.open',
            `@huckleberry List tasks with ${prioritySelected.value} priority`,
          );
        } else {
          // Fall back to showing all tasks if no priority selected
          vscode.commands.executeCommand(
            'workbench.action.chat.open',
            '@huckleberry List all tasks',
          );
        }
      } else if (selected.label === 'Filter by Status') {
        const statusOptions = [
          { label: 'Open Tasks', value: 'open' },
          { label: 'In Progress Tasks', value: 'in_progress' },
          { label: 'Completed Tasks', value: 'done' },
        ];

        const statusSelected = await vscode.window.showQuickPick(statusOptions, {
          placeHolder: 'Select a status to filter by',
          title: 'Huckleberry: Filter by Status',
        });

        if (statusSelected) {
          // Execute with the selected status filter
          vscode.commands.executeCommand(
            'workbench.action.chat.open',
            `@huckleberry List ${statusSelected.value} tasks`,
          );
        } else {
          // Fall back to showing all tasks if no status selected
          vscode.commands.executeCommand(
            'workbench.action.chat.open',
            '@huckleberry List all tasks',
          );
        }
      } else {
        // Show all tasks (default)
        vscode.commands.executeCommand(
          'workbench.action.chat.open',
          '@huckleberry List all tasks',
        );
      }
    } else {
      // Construct the appropriate command with provided filters
      let command = '@huckleberry List tasks';
      
      if (priority) {
        command += ` with ${priority} priority`;
      }
      
      if (status) {
        command += priority ? ' and' : ' with';
        command += ` status ${status}`;
      }
      
      // Execute the command with the provided filters
      vscode.commands.executeCommand('workbench.action.chat.open', command);
    }
  } catch (error) {
    logWithChannel(LogLevel.ERROR, 'Error in listTasks command:', error);
    vscode.window.showErrorMessage(`Failed to list tasks: ${error instanceof Error ? error.message : String(error)}`);
  }
}