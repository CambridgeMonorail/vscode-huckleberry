/**
 * Main entry point for the Huckleberry extension
 */
import * as vscode from 'vscode';
import { ReadFileTool } from './tools/ReadFileTool';
import { WriteFileTool } from './tools/WriteFileTool';
import { MarkDoneTool } from './tools/MarkDoneTool';
import { BreakTaskTool } from './tools/BreakTaskTool';
import { ToolManager } from './services/toolManager';
import { ChatService } from './services/chatService';
import { LanguageModelToolsProvider } from './services/languageModelToolsProvider';
import { showInfo } from './utils/uiHelpers';
import { isWorkspaceAvailable, notifyNoWorkspace } from './handlers/chatHandler';
import { detectCopilotMode, checkCopilotAvailability } from './utils/copilotHelper';
import { initDebugChannel, logWithChannel, LogLevel, dumpState } from './utils/debugUtils';

/**
 * State of the extension including key services
 */
interface ExtensionState {
  chatService: ChatService;
  toolManager: ToolManager;
  languageModelToolsProvider: LanguageModelToolsProvider;
}

/**
 * Global extension state
 */
let extensionState: ExtensionState | null = null;

/**
 * Command handler for the manageTasks command
 */
async function manageTasks(): Promise<void> {
  // Check for Copilot availability before proceeding
  if (!(await checkCopilotAvailability())) {
    return;
  }

  showInfo('Task management interface will be implemented soon!');
}

/**
 * Command handler for prioritizing tasks
 */
async function prioritizeTasks(): Promise<void> {
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

/**
 * Command handler for changing a task's priority
 * @param taskId Optional task ID to change priority for
 * @param priority Optional priority to set
 */
async function changeTaskPriority(taskId?: string, priority?: string): Promise<void> {
  try {
    if (!isWorkspaceAvailable()) {
      notifyNoWorkspace();
      return;
    }

    // Check for Copilot availability before proceeding
    if (!(await checkCopilotAvailability())) {
      return;
    }

    if (!extensionState?.toolManager) {
      vscode.window.showErrorMessage('Extension not properly initialized');
      return;
    }

    // If taskId or priority is not provided, prompt the user
    if (!taskId || !priority) {
      // Import dynamically to prevent circular dependencies
      import('./utils/parameterUtils').then(async ({ promptForTaskAndPriority }) => {
        if (!extensionState?.toolManager) {
          vscode.window.showErrorMessage('Extension not properly initialized');
          return;
        }
        const result = await promptForTaskAndPriority(extensionState.toolManager);
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

/**
 * Command handler for checking Copilot agent mode
 */
async function checkCopilotAgentMode(): Promise<void> {
  try {
    // Set a timeout to prevent this check from hanging indefinitely
    const timeoutPromise = new Promise<{isAvailable: false, error: string}>(resolve => {
      setTimeout(() => {
        resolve({ 
          isAvailable: false, 
          error: 'Timeout while checking Copilot availability', 
        });
      }, 5000);
    });

    // Race the detection against the timeout
    const modeInfo = await Promise.race([
      detectCopilotMode().catch(error => ({
        isAvailable: false,
        isChatAvailable: false,
        isAgentModeEnabled: false,
        error: error instanceof Error ? error.message : String(error),
      })),
      timeoutPromise,
    ]);

    // Log results of the check for diagnostic purposes
    logWithChannel(LogLevel.INFO, 'Copilot availability check results:', modeInfo);

    if ('error' in modeInfo) {
      // If we got an error from detectCopilotMode or the timeout
      logWithChannel(LogLevel.WARN, `Copilot check failed: ${modeInfo.error}`);
      vscode.window.showInformationMessage(
        'Huckleberry functions best with GitHub Copilot but will continue with limited AI-powered features.',
        'Learn More',
      ).then(selection => {
        if (selection === 'Learn More') {
          vscode.env.openExternal(
            vscode.Uri.parse('https://marketplace.visualstudio.com/items?itemName=GitHub.copilot'),
          );
        }
      });
      return;
    }

    if (!modeInfo.isAvailable) {
      vscode.window.showWarningMessage(
        'GitHub Copilot does not appear to be installed. Huckleberry will continue with limited AI-powered features.',
        'Install Copilot',
      ).then(selection => {
        if (selection === 'Install Copilot') {
          vscode.commands.executeCommand(
            'workbench.extensions.search',
            'GitHub.copilot',
          );
        }
      });
      return;
    }

    if (!modeInfo.isChatAvailable) {
      vscode.window.showWarningMessage(
        'GitHub Copilot Chat does not appear to be installed. Huckleberry will continue with limited features.',
        'Install Copilot Chat',
      ).then(selection => {
        if (selection === 'Install Copilot Chat') {
          vscode.commands.executeCommand(
            'workbench.extensions.search',
            'GitHub.copilot-chat',
          );
        }
      });
      return;
    }

    if (modeInfo.isAgentModeEnabled) {
      vscode.window.showInformationMessage(
        'GitHub Copilot agent mode is enabled. Huckleberry is optimized for this configuration!',
        'Learn More',
      ).then(selection => {
        if (selection === 'Learn More') {
          vscode.env.openExternal(
            vscode.Uri.parse('https://code.visualstudio.com/docs/editor/github-copilot#_agent-mode'),
          );
        }
      });
    } else {
      // Log that agent mode is not enabled without showing notification based on user feedback
      logWithChannel(LogLevel.DEBUG, 'Copilot agent mode is not enabled, but suppressing notification based on user feedback');
    }
  } catch (error) {
    // Handle any unexpected errors gracefully
    logWithChannel(LogLevel.ERROR, 'Error checking Copilot agent mode:', error);
    vscode.window.showInformationMessage(
      'Unable to check Copilot configuration. Huckleberry will continue with potentially limited functionality.',
    );
  }
}

/**
 * Command handler for directly testing Huckleberry chat integration
 */
async function testHuckleberryChat(): Promise<void> {
  try {
    if (!extensionState) {
      vscode.window.showErrorMessage('Extension not properly initialized');
      return;
    }

    logWithChannel(LogLevel.INFO, '🔍 Testing Huckleberry chat integration');

    // Check the VS Code chat API
    const chatExtensions = vscode.extensions.all.filter(ext =>
      ext.packageJSON?.contributes?.chatParticipants ||
      ext.packageJSON?.activationEvents?.some((event: string) => event.startsWith('onChatParticipant:')),
    );

    logWithChannel(LogLevel.DEBUG, `Found ${chatExtensions.length} extensions with chat participants:`);
    chatExtensions.forEach(ext => {
      const participants = ext.packageJSON?.contributes?.chatParticipants || [];
      logWithChannel(LogLevel.DEBUG, `- ${ext.id}: ${participants.map((p: { id: string }) => p.id).join(', ')}`);
    });

    // Dump current extension state
    dumpState(extensionState.chatService.context, {
      chatServiceActive: extensionState.chatService.isActive,
      lastActive: extensionState.chatService.lastActive ?
        new Date(extensionState.chatService.lastActive).toISOString() : 'never',
      workspaceAvailable: isWorkspaceAvailable(),
    });

    // Force a refresh of chat participants
    await extensionState.chatService.forceRefresh();

    // Log that the test is complete with instructions for the user
    logWithChannel(LogLevel.INFO, '✅ Chat integration test complete');

    // Display success message
    vscode.window.showInformationMessage(
      'Huckleberry chat test executed. Check Debug panel for detailed information.',
      'Open Debug Panel',
      'Open Chat',
    ).then(selection => {
      if (selection === 'Open Debug Panel') {
        vscode.commands.executeCommand('workbench.action.output.show', 'Huckleberry Debug');
      } else if (selection === 'Open Chat') {
        vscode.commands.executeCommand('workbench.action.chat.open', '@huckleberry');
      }
    });
  } catch (error) {
    logWithChannel(LogLevel.ERROR, 'Error during chat integration test:', error);
    vscode.window.showErrorMessage(`Chat integration test failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Command handler for forcing a refresh of chat participants
 */
async function forceRefreshChatParticipants(): Promise<void> {
  if (!extensionState) {
    vscode.window.showErrorMessage('Extension not properly initialized');
    return;
  }

  try {
    await extensionState.chatService.forceRefresh();

    // Show the debug channel with details of the refresh
    vscode.commands.executeCommand('workbench.action.output.show', 'Huckleberry Debug');
  } catch (error) {
    logWithChannel(LogLevel.ERROR, 'Error forcing chat participant refresh:', error);
    vscode.window.showErrorMessage(`Failed to refresh chat participants: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Command handler for getting the next task suggestion
 */
async function getNextTask(): Promise<void> {
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

/**
 * Command handler for showing help documentation
 * @param topic Optional help topic to display
 */
function getHelp(topic?: string): void {
  try {
    if (!isWorkspaceAvailable()) {
      notifyNoWorkspace();
      return;
    }

    if (!extensionState?.toolManager) {
      vscode.window.showErrorMessage('Extension not properly initialized');
      return;
    }

    // If no topic is provided, prompt the user to select one
    if (!topic) {
      // Import dynamically to prevent circular dependencies
      import('./utils/parameterUtils').then(async ({ promptForHelpTopic }) => {
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

/**
 * Command handler for creating a new task
 */
async function createTask(): Promise<void> {
  try {
    if (!isWorkspaceAvailable()) {
      notifyNoWorkspace();
      return;
    }

    // Check for Copilot availability before proceeding
    if (!(await checkCopilotAvailability())) {
      return;
    }

    // Import dynamically to prevent circular dependencies
    import('./utils/parameterUtils').then(async ({ promptForPrioritySelection }) => {
      const selectedPriority = await promptForPrioritySelection();
      
      // Prompt for task description
      const description = await vscode.window.showInputBox({
        placeHolder: 'Enter task description',
        prompt: 'What needs to be done?',
        title: 'Huckleberry: Create Task',
      });

      if (description) {
        // Execute the command with the provided values
        const priorityText = selectedPriority ? ` ${selectedPriority} priority task to` : ' task to';
        vscode.commands.executeCommand(
          'workbench.action.chat.open',
          `@huckleberry Create a${priorityText} ${description}`,
        );
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

/**
 * Command handler for listing tasks
 * @param priority Optional priority filter (e.g. 'high', 'low', etc.)
 * @param status Optional status filter (e.g. 'open', 'done', etc.)
 */
async function listTasks(priority?: string, status?: string): Promise<void> {
  try {
    if (!isWorkspaceAvailable()) {
      notifyNoWorkspace();
      return;
    }

    // Check for Copilot availability before proceeding
    if (!(await checkCopilotAvailability())) {
      return;
    }

    if (!extensionState?.toolManager) {
      vscode.window.showErrorMessage('Extension not properly initialized');
      return;
    }

    // If no filters are provided, ask if they want to filter
    if (!priority && !status) {
      const filterOptions = [
        { label: 'Show All Tasks', description: 'List all tasks without filters' },
        { label: 'Filter by Priority', description: 'Show tasks with specific priority' },
        { label: 'Filter by Status', description: 'Show tasks with specific status' },
      ];

      vscode.window.showQuickPick(filterOptions, {
        placeHolder: 'Select a filtering option',
        title: 'Huckleberry: List Tasks',
      }).then(selected => {
        if (!selected) {
          return;
        }

        if (selected.label === 'Filter by Priority') {
          // Import dynamically to prevent circular dependencies
          import('./utils/parameterUtils').then(async ({ promptForPrioritySelection }) => {
            const selectedPriority = await promptForPrioritySelection();
            if (selectedPriority) {
              vscode.commands.executeCommand(
                'workbench.action.chat.open',
                `@huckleberry What tasks are ${selectedPriority} priority?`,
              );
            } else {
              // Fall back to showing all tasks if no priority selected
              vscode.commands.executeCommand(
                'workbench.action.chat.open',
                '@huckleberry List all tasks',
              );
            }
          }).catch(error => {
            logWithChannel(LogLevel.ERROR, 'Error importing parameter utilities:', error);
            vscode.window.showErrorMessage(`Failed to load priority selection UI: ${error instanceof Error ? error.message : String(error)}`);
          });
        } else if (selected.label === 'Filter by Status') {
          const statusOptions = [
            { label: 'Open Tasks', value: 'open' },
            { label: 'In Progress Tasks', value: 'in_progress' },
            { label: 'Completed Tasks', value: 'done' },
          ];

          vscode.window.showQuickPick(statusOptions, {
            placeHolder: 'Select a status to filter by',
            title: 'Huckleberry: Filter by Status',
          }).then(statusSelected => {
            if (statusSelected) {
              vscode.commands.executeCommand(
                'workbench.action.chat.open',
                `@huckleberry List ${statusSelected.label.toLowerCase()}`,
              );
            } else {
              // Fall back to showing all tasks if no status selected
              vscode.commands.executeCommand(
                'workbench.action.chat.open',
                '@huckleberry List all tasks',
              );
            }
          });
        } else {
          // Show all tasks (default)
          vscode.commands.executeCommand(
            'workbench.action.chat.open',
            '@huckleberry List all tasks',
          );
        }
      });
    } else if (priority) {
      // Use provided priority filter
      vscode.commands.executeCommand(
        'workbench.action.chat.open',
        `@huckleberry What tasks are ${priority} priority?`,
      );
    } else if (status) {
      // Use provided status filter
      vscode.commands.executeCommand(
        'workbench.action.chat.open',
        `@huckleberry List ${status} tasks`,
      );
    }
  } catch (error) {
    logWithChannel(LogLevel.ERROR, 'Error in listTasks command:', error);
    vscode.window.showErrorMessage(`Failed to list tasks: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Command handler for marking a task as complete
 * @param taskId Optional task ID to mark as complete
 */
function markTaskComplete(taskId?: string): void {
  try {
    if (!isWorkspaceAvailable()) {
      notifyNoWorkspace();
      return;
    }

    if (!extensionState?.toolManager) {
      vscode.window.showErrorMessage('Extension not properly initialized');
      return;
    }

    // If no taskId is provided, prompt the user to select one
    if (!taskId) {
      // Import dynamically to prevent circular dependencies
      import('./utils/parameterUtils').then(async ({ promptForTaskSelection }) => {
        if (!extensionState?.toolManager) {
          vscode.window.showErrorMessage('Extension not properly initialized');
          return;
        }
        const selectedTaskId = await promptForTaskSelection(extensionState.toolManager, true);
        if (selectedTaskId) {
          // Execute the command with the selected task ID
          vscode.commands.executeCommand(
            'workbench.action.chat.open',
            `@huckleberry Mark task ${selectedTaskId} as complete`,
          );
        }
      }).catch(error => {
        logWithChannel(LogLevel.ERROR, 'Error importing parameter utilities:', error);
        vscode.window.showErrorMessage(`Failed to load task selection UI: ${error instanceof Error ? error.message : String(error)}`);
      });
    } else {
      // Execute the command with the provided task ID
      vscode.commands.executeCommand(
        'workbench.action.chat.open',
        `@huckleberry Mark task ${taskId} as complete`,
      );
    }
  } catch (error) {
    logWithChannel(LogLevel.ERROR, 'Error in markTaskComplete command:', error);
    vscode.window.showErrorMessage(`Failed to mark task as complete: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Command handler for scanning TODOs in the codebase
 * @param pattern Optional file pattern to limit the scan
 */
async function scanTodos(pattern?: string): Promise<void> {
  try {
    if (!isWorkspaceAvailable()) {
      notifyNoWorkspace();
      return;
    }

    // Check for Copilot availability before proceeding
    if (!(await checkCopilotAvailability())) {
      return;
    }

    if (!extensionState?.toolManager) {
      vscode.window.showErrorMessage('Extension not properly initialized');
      return;
    }

    // If no pattern is provided, prompt the user if they want to specify one
    if (!pattern) {
      // Import dynamically to prevent circular dependencies
      import('./utils/parameterUtils').then(async ({ promptForFilePattern }) => {
        const selectedPattern = await promptForFilePattern();

        // Construct the appropriate command
        const commandText = selectedPattern
          ? `@huckleberry Scan for TODOs in ${selectedPattern}`
          : '@huckleberry Scan for TODOs in the codebase';

        // Execute the command
        vscode.commands.executeCommand('workbench.action.chat.open', commandText);
      }).catch(error => {
        logWithChannel(LogLevel.ERROR, 'Error importing parameter utilities:', error);
        vscode.window.showErrorMessage(`Failed to load file pattern selection UI: ${error instanceof Error ? error.message : String(error)}`);
      });
    } else {
      // Execute the command with the provided pattern
      vscode.commands.executeCommand(
        'workbench.action.chat.open',
        `@huckleberry Scan for TODOs in ${pattern}`,
      );
    }
  } catch (error) {
    logWithChannel(LogLevel.ERROR, 'Error in scanTodos command:', error);
    vscode.window.showErrorMessage(`Failed to scan for TODOs: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Command handler for parsing requirements document
 * @param filePath Optional file path to parse
 */
function parseRequirementsDocument(filePath?: string): void {
  try {
    if (!isWorkspaceAvailable()) {
      notifyNoWorkspace();
      return;
    }

    if (!extensionState?.toolManager) {
      vscode.window.showErrorMessage('Extension not properly initialized');
      return;
    }

    // If no filePath is provided, prompt the user to select a document
    if (!filePath) {
      // Import dynamically to prevent circular dependencies
      import('./utils/parameterUtils').then(async ({ promptForDocumentSelection }) => {
        const selectedFilePath = await promptForDocumentSelection();
        if (selectedFilePath) {
          // Get the relative path from the workspace root
          const workspaceFolder = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
          let relativePath = selectedFilePath;

          if (workspaceFolder && selectedFilePath.startsWith(workspaceFolder)) {
            relativePath = selectedFilePath.substring(workspaceFolder.length + 1); // +1 for the slash
          }

          // Execute the command with the selected file path
          vscode.commands.executeCommand(
            'workbench.action.chat.open',
            `@huckleberry Parse ${relativePath} and create tasks`,
          );
        }
      }).catch(error => {
        logWithChannel(LogLevel.ERROR, 'Error importing parameter utilities:', error);
        vscode.window.showErrorMessage(`Failed to load document selection UI: ${error instanceof Error ? error.message : String(error)}`);
      });
    } else {
      // Execute the command with the provided file path
      vscode.commands.executeCommand(
        'workbench.action.chat.open',
        `@huckleberry Parse ${filePath} and create tasks`,
      );
    }
  } catch (error) {
    logWithChannel(LogLevel.ERROR, 'Error in parseRequirementsDocument command:', error);
    vscode.window.showErrorMessage(`Failed to parse requirements: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Command handler for opening task explorer
 */
function openTaskExplorer(): void {
  try {
    if (!isWorkspaceAvailable()) {
      notifyNoWorkspace();
      return;
    }

    // This feature might be implemented in the future
    showInfo('Task Explorer view will be implemented in a future version.');
    logWithChannel(LogLevel.INFO, '🔍 Task Explorer requested (feature not yet implemented)');
  } catch (error) {
    logWithChannel(LogLevel.ERROR, 'Error in openTaskExplorer command:', error);
    vscode.window.showErrorMessage(`Failed to open task explorer: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Command handler for creating subtasks
 * @param taskId Optional task ID to break down into subtasks
 */
function createSubtasks(taskId?: string): void {
  try {
    if (!isWorkspaceAvailable()) {
      notifyNoWorkspace();
      return;
    }

    if (!extensionState?.toolManager) {
      vscode.window.showErrorMessage('Extension not properly initialized');
      return;
    }

    // If no taskId is provided, prompt the user to select one
    if (!taskId) {
      // Import dynamically to prevent circular dependencies
      import('./utils/parameterUtils').then(async ({ promptForTaskSelection }) => {
        if (!extensionState?.toolManager) {
          vscode.window.showErrorMessage('Extension not properly initialized');
          return;
        }
        const selectedTaskId = await promptForTaskSelection(extensionState.toolManager);
        if (selectedTaskId) {
          // Execute the command with the selected task ID
          vscode.commands.executeCommand(
            'workbench.action.chat.open',
            `@huckleberry Break task ${selectedTaskId} into subtasks`,
          );
        }
      }).catch(error => {
        logWithChannel(LogLevel.ERROR, 'Error importing parameter utilities:', error);
        vscode.window.showErrorMessage(`Failed to load task selection UI: ${error instanceof Error ? error.message : String(error)}`);
      });
    } else {
      // Execute the command with the provided task ID
      vscode.commands.executeCommand(
        'workbench.action.chat.open',
        `@huckleberry Break task ${taskId} into subtasks`,
      );
    }
  } catch (error) {
    logWithChannel(LogLevel.ERROR, 'Error in createSubtasks command:', error);
    vscode.window.showErrorMessage(`Failed to create subtasks: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Command handler for enriching a task with additional context
 * @param taskId Optional task ID to enrich
 */
function enrichTask(taskId?: string): void {
  try {
    if (!isWorkspaceAvailable()) {
      notifyNoWorkspace();
      return;
    }

    if (!extensionState?.toolManager) {
      vscode.window.showErrorMessage('Extension not properly initialized');
      return;
    }

    // If no taskId is provided, prompt the user to select one
    if (!taskId) {
      // Import dynamically to prevent circular dependencies
      import('./utils/parameterUtils').then(async ({ promptForTaskSelection }) => {
        if (!extensionState?.toolManager) {
          vscode.window.showErrorMessage('Extension not properly initialized');
          return;
        }
        const selectedTaskId = await promptForTaskSelection(extensionState.toolManager);
        if (selectedTaskId) {
          // Execute the command with the selected task ID
          vscode.commands.executeCommand(
            'workbench.action.chat.open',
            `@huckleberry Enrich task ${selectedTaskId} with context`,
          );
        }
      }).catch(error => {
        logWithChannel(LogLevel.ERROR, 'Error importing parameter utilities:', error);
        vscode.window.showErrorMessage(`Failed to load task selection UI: ${error instanceof Error ? error.message : String(error)}`);
      });
    } else {
      // Execute the command with the provided task ID
      vscode.commands.executeCommand(
        'workbench.action.chat.open',
        `@huckleberry Enrich task ${taskId} with context`,
      );
    }
  } catch (error) {
    logWithChannel(LogLevel.ERROR, 'Error in enrichTask command:', error);
    vscode.window.showErrorMessage(`Failed to enrich task: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Command handler for exporting tasks
 */
function exportTasks(): void {
  try {
    if (!isWorkspaceAvailable()) {
      notifyNoWorkspace();
      return;
    }

    // This feature might be implemented in the future
    showInfo('Task exporting functionality will be implemented in a future version.');
    logWithChannel(LogLevel.INFO, '📤 Task export requested (feature not yet implemented)');
  } catch (error) {
    logWithChannel(LogLevel.ERROR, 'Error in exportTasks command:', error);
    vscode.window.showErrorMessage(`Failed to export tasks: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Prompts the user to reload the window when a workspace is opened.
 */
function promptReloadOnWorkspaceOpen(): void {
  vscode.workspace.onDidChangeWorkspaceFolders(e => {
    if (e.added.length > 0) {
      vscode.window.showInformationMessage(
        'Huckleberry needs to reload the window to work after opening a folder. Reload now?',
        'Reload Window',
      ).then(selection => {
        if (selection === 'Reload Window') {
          vscode.commands.executeCommand('workbench.action.reloadWindow');
        }
      });
    }
  });
}

/**
 * Activates the extension
 */
export function activate(context: vscode.ExtensionContext): void {
  // Initialize the debug channel and store it in extensionState
  const _debugChannel = initDebugChannel();

  logWithChannel(LogLevel.INFO, '🚀 Huckleberry extension activating');

  try {
    // Check Copilot mode and recommend agent mode if needed
    detectCopilotMode().then(modeInfo => {
      logWithChannel(LogLevel.INFO, 'Copilot mode detected:', modeInfo);

      if (modeInfo.isAvailable && !modeInfo.isAgentModeEnabled) {
        logWithChannel(LogLevel.DEBUG, 'Agent mode recommendation suppressed based on user feedback');
      }
    }).catch(error => {
      logWithChannel(LogLevel.ERROR, 'Error checking Copilot mode:', error);
    });

    // Create and register tools
    const toolManager = new ToolManager();
    const readFileTool = new ReadFileTool();
    const writeFileTool = new WriteFileTool();
    const markDoneTool = new MarkDoneTool();
    const breakTaskTool = new BreakTaskTool();

    toolManager.registerTool(readFileTool);
    toolManager.registerTool(writeFileTool);
    toolManager.registerTool(markDoneTool);
    toolManager.registerTool(breakTaskTool);

    // Initialize chat service
    const chatService = new ChatService(context, toolManager);

    // Register language model tools first to ensure they're ready for activation
    logWithChannel(LogLevel.INFO, '🔨 Creating language model tools provider...');
    const languageModelToolsProvider = new LanguageModelToolsProvider(toolManager);

    // Initialize and register language model tools - ensure this happens before any activation events
    try {
      logWithChannel(LogLevel.INFO, '🔨 Registering language model tools...');

      // Force synchronous registration of all tools to ensure they're available
      const toolDisposables = languageModelToolsProvider.registerAllTools(context);

      // Add all tool disposables to context subscriptions
      toolDisposables.forEach(disposable => {
        context.subscriptions.push(disposable);
      });

      logWithChannel(LogLevel.INFO, `✅ Successfully registered ${toolDisposables.length} language model tools`);
    } catch (toolError) {
      logWithChannel(LogLevel.ERROR, '❌ Failed to register language model tools:', toolError);
      // Don't throw here, allow the extension to continue even if tools registration fails
      vscode.window.showWarningMessage(
        'Huckleberry: Some language model tools failed to register. Advanced AI integration may be limited.',
      );
    }

    // Store extension state
    extensionState = {
      chatService,
      toolManager,
      languageModelToolsProvider,
    };

    // Register commands
    const helloWorldDisposable = vscode.commands.registerCommand('vscode-copilot-huckleberry.helloWorld', () => {
      showInfo('Hello from Huckleberry!');
      logWithChannel(LogLevel.DEBUG, 'Hello World command executed');
    });

    const manageTasksDisposable = vscode.commands.registerCommand('vscode-copilot-huckleberry.manageTasks', () => {
      // Check workspace availability before proceeding
      if (!isWorkspaceAvailable()) {
        notifyNoWorkspace();
        return;
      }

      manageTasks();
    });

    const prioritizeTasksDisposable = vscode.commands.registerCommand('vscode-copilot-huckleberry.prioritizeTasks', () => {
      prioritizeTasks();
    });

    const prioritiseTasksDisposable = vscode.commands.registerCommand('vscode-copilot-huckleberry.prioritiseTasks', () => {
      prioritizeTasks();
    });

    const changeTaskPriorityDisposable = vscode.commands.registerCommand(
      'vscode-copilot-huckleberry.changeTaskPriority',
      (taskId?: string, priority?: string) => changeTaskPriority(taskId, priority),
    );

    const checkCopilotAgentModeDisposable = vscode.commands.registerCommand(
      'vscode-copilot-huckleberry.checkCopilotAgentMode',
      checkCopilotAgentMode,
    );

    // Add the test chat command
    const testChatDisposable = vscode.commands.registerCommand(
      'vscode-copilot-huckleberry.testChat',
      testHuckleberryChat,
    );

    // Add the force refresh command
    const forceRefreshDisposable = vscode.commands.registerCommand(
      'vscode-copilot-huckleberry.forceRefreshChatParticipants',
      forceRefreshChatParticipants,
    );

    // Add the next task command
    const getNextTaskDisposable = vscode.commands.registerCommand(
      'vscode-copilot-huckleberry.getNextTask',
      getNextTask,
    );

    // Add the get help command
    const getHelpDisposable = vscode.commands.registerCommand(
      'vscode-copilot-huckleberry.getHelp',
      getHelp,
    );

    // British spelling variant (command alias)
    const initialiseTaskTrackingDisposable = vscode.commands.registerCommand(
      'vscode-copilot-huckleberry.initialiseTaskTracking',
      () => {
        // Check workspace availability before proceeding
        if (!isWorkspaceAvailable()) {
          notifyNoWorkspace();
          return;
        }

        try {
          logWithChannel(LogLevel.INFO, '🎯 Command: Initialize Task Tracking');

          // Open chat with Huckleberry and send the initialize command
          vscode.commands.executeCommand(
            'workbench.action.chat.open',
            '@huckleberry Initialize task tracking for this project',
          );
        } catch (error) {
          logWithChannel(LogLevel.ERROR, 'Error in initializeTaskTracking command:', error);
          vscode.window.showErrorMessage(`Failed to initialize task tracking: ${error instanceof Error ? error.message : String(error)}`);
        }
      },
    );

    // American spelling variant
    const initializeTaskTrackingDisposable = vscode.commands.registerCommand(
      'vscode-copilot-huckleberry.initializeTaskTracking',
      () => {
        // Check workspace availability before proceeding
        if (!isWorkspaceAvailable()) {
          notifyNoWorkspace();
          return;
        }

        try {
          logWithChannel(LogLevel.INFO, '🎯 Command: Initialize Task Tracking');

          // Open chat with Huckleberry and send the initialize command
          vscode.commands.executeCommand(
            'workbench.action.chat.open',
            '@huckleberry Initialize task tracking for this project',
          );
        } catch (error) {
          logWithChannel(LogLevel.ERROR, 'Error in initializeTaskTracking command:', error);
          vscode.window.showErrorMessage(`Failed to initialize task tracking: ${error instanceof Error ? error.message : String(error)}`);
        }
      },
    );

    const createTaskDisposable = vscode.commands.registerCommand(
      'vscode-copilot-huckleberry.createTask',
      createTask,
    );

    const listTasksDisposable = vscode.commands.registerCommand(
      'vscode-copilot-huckleberry.listTasks',
      (priority?: string, status?: string) => listTasks(priority, status),
    );

    const markTaskCompleteDisposable = vscode.commands.registerCommand(
      'vscode-copilot-huckleberry.markTaskComplete',
      (taskId?: string) => markTaskComplete(taskId),
    );

    const scanTodosDisposable = vscode.commands.registerCommand(
      'vscode-copilot-huckleberry.scanTodos',
      (pattern?: string) => scanTodos(pattern),
    );

    const parseRequirementsDocumentDisposable = vscode.commands.registerCommand(
      'vscode-copilot-huckleberry.parseRequirementsDocument',
      (filePath?: string) => parseRequirementsDocument(filePath),
    );

    const openTaskExplorerDisposable = vscode.commands.registerCommand(
      'vscode-copilot-huckleberry.openTaskExplorer',
      openTaskExplorer,
    );

    const createSubtasksDisposable = vscode.commands.registerCommand(
      'vscode-copilot-huckleberry.createSubtasks',
      createSubtasks,
    );

    const enrichTaskDisposable = vscode.commands.registerCommand(
      'huckleberry.enrichTask',
      enrichTask,
    );

    const exportTasksDisposable = vscode.commands.registerCommand(
      'vscode-copilot-huckleberry.exportTasks',
      exportTasks,
    );

    // Register workspace change listener to detect when workspace folders are added/removed
    const workspaceFoldersChangeDisposable = vscode.workspace.onDidChangeWorkspaceFolders(async e => {
      const foldersAdded = e.added.length > 0;
      const foldersRemoved = e.removed.length > 0;

      logWithChannel(LogLevel.INFO, 'Workspace folders changed', {
        added: e.added.map(folder => folder.name),
        removed: e.removed.map(folder => folder.name),
        current: vscode.workspace.workspaceFolders?.map(folder => folder.name) || [],
      });

      if (foldersAdded || foldersRemoved) {
        // Refresh chat participants to ensure they work with the new workspace state
        logWithChannel(LogLevel.INFO, '🔄 Refreshing chat participants due to workspace change');

        try {
          // Delay slightly to ensure VS Code's workspace state is fully updated
          await new Promise(resolve => setTimeout(resolve, 1000));
          await chatService.forceRefresh();

          // Show notification about task initialization if folders were added
          if (foldersAdded && isWorkspaceAvailable()) {
            vscode.window.showInformationMessage(
              'Huckleberry Task Manager is now ready to use with your workspace.',
              'Initialize Task Tracking',
            ).then(selection => {
              if (selection === 'Initialize Task Tracking') {
                // Open chat with Huckleberry and pre-fill the initialize command
                vscode.commands.executeCommand(
                  'workbench.action.chat.open',
                  '@huckleberry Initialize task tracking for this project',
                );
              }
            });
          }
        } catch (error) {
          logWithChannel(LogLevel.ERROR, 'Failed to refresh chat participants after workspace change:', error);
        }
      }
    });

    // Register all commands and listeners
    context.subscriptions.push(
      helloWorldDisposable,
      manageTasksDisposable,
      prioritizeTasksDisposable,
      prioritiseTasksDisposable,
      changeTaskPriorityDisposable,
      checkCopilotAgentModeDisposable,
      testChatDisposable,
      forceRefreshDisposable,
      getNextTaskDisposable,
      getHelpDisposable,
      initialiseTaskTrackingDisposable,
      initializeTaskTrackingDisposable,
      createTaskDisposable,
      listTasksDisposable,
      markTaskCompleteDisposable,
      scanTodosDisposable,
      parseRequirementsDocumentDisposable,
      openTaskExplorerDisposable,
      createSubtasksDisposable,
      enrichTaskDisposable,
      exportTasksDisposable,
      workspaceFoldersChangeDisposable,
    );

    // Register chat participants
    const participantDisposables = chatService.registerAll();
    participantDisposables.forEach(disposable => {
      context.subscriptions.push(disposable);
    });

    // Display debug info about the current workspace
    const workspaceInfo = {
      folders: vscode.workspace.workspaceFolders?.map(folder => ({
        name: folder.name,
        path: folder.uri.fsPath,
      })) || [],
      name: vscode.workspace.name,
      available: isWorkspaceAvailable(),
    };

    logWithChannel(LogLevel.INFO, 'Workspace info at startup:', workspaceInfo);

    // Log activation success
    logWithChannel(LogLevel.INFO, '✅ Huckleberry extension successfully activated');
    console.log('Huckleberry extension is now active!');

    // Set a small delay to check if chat works after startup
    setTimeout(() => {
      // If chat service hasn't been active yet, schedule a refresh
      if (!chatService.lastActive && isWorkspaceAvailable()) {
        logWithChannel(LogLevel.INFO, 'Scheduling post-activation chat participant refresh');
        chatService.forceRefresh().catch(err => {
          logWithChannel(LogLevel.ERROR, 'Failed to refresh chat participants during delayed check:', err);
        });
      }
    }, 10000); // Check 10 seconds after activation

    // Prompt reload on workspace open
    promptReloadOnWorkspaceOpen();
  } catch (error) {
    logWithChannel(LogLevel.CRITICAL, '❌ Failed to activate extension:', error);
    vscode.window.showErrorMessage(
      `Huckleberry extension failed to activate: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * Deactivates the extension
 */
export function deactivate(): void {
  logWithChannel(LogLevel.INFO, '👋 Deactivating Huckleberry extension');

  if (extensionState) {
    // Clean up language model tools
    if (extensionState.languageModelToolsProvider) {
      try {
        extensionState.languageModelToolsProvider.dispose();
        logWithChannel(LogLevel.DEBUG, '✓ Language model tools disposed');
      } catch (error) {
        logWithChannel(LogLevel.ERROR, '❌ Error disposing language model tools:', error);
      }
    }

    // Clean up chat service
    extensionState.chatService.disposeAll();

    // Clear the extension state
    extensionState = null;
  }
}
