/**
 * Main entry point for the Huckleberry extension
 */
import * as vscode from 'vscode';
import { ReadFileTool, WriteFileTool, MarkDoneTool, BreakTaskTool } from './tools';
import { ToolManager, ChatService, LanguageModelToolsProvider } from './services';
import { isWorkspaceAvailable } from './handlers/chatHandler';
import { initDebugChannel, logWithChannel, LogLevel } from './utils';
import { ExtensionStateService } from './services/extensionStateService';
import { TaskExplorerProvider, TaskTreeItem } from './providers/TaskExplorerProvider';

// Import all command handlers
import * as commandHandlers from './handlers/commandHandlers';

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
  // Initialize the debug channel
  const _debugChannel = initDebugChannel();

  logWithChannel(LogLevel.INFO, '🚀 Huckleberry extension activating');

  try {
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

    // Register Task Explorer Provider
    const taskExplorerProvider = new TaskExplorerProvider(toolManager);
    const taskTreeView = vscode.window.createTreeView('huckleberryTaskExplorer', {
      treeDataProvider: taskExplorerProvider,
      showCollapseAll: true,
    });
    
    // Register Task Explorer related commands
    const taskExplorerCommands = [
      vscode.commands.registerCommand('vscode-copilot-huckleberry.taskExplorer.refresh', () => {
        taskExplorerProvider.refresh();
      }),
      vscode.commands.registerCommand('vscode-copilot-huckleberry.taskExplorer.sortByPriority', () => {
        taskExplorerProvider.toggleSortByPriority();
      }),
      vscode.commands.registerCommand('vscode-copilot-huckleberry.taskExplorer.toggleShowCompleted', () => {
        taskExplorerProvider.toggleShowCompleted();
      }),
      // Add handlers for task item actions
      vscode.commands.registerCommand('vscode-copilot-huckleberry.taskExplorer.openTask', (item: TaskTreeItem) => {
        // Open the task file when clicked
        if (item.task.source?.file) {
          vscode.commands.executeCommand('vscode.open', vscode.Uri.file(item.task.source.file));
        }
      }),
      vscode.commands.registerCommand('vscode-copilot-huckleberry.taskExplorer.markComplete', (item: TaskTreeItem) => {
        commandHandlers.markTaskComplete(item.task.id);
      }),
    ];

    // Add task explorer disposables to context subscriptions
    context.subscriptions.push(taskTreeView, ...taskExplorerCommands);

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

    // Initialize extension state
    ExtensionStateService.getStaticInstance().initializeWithServices(
      chatService,
      toolManager,
      languageModelToolsProvider,
    );

    // Register commands
    const commandDisposables = [
      vscode.commands.registerCommand('vscode-copilot-huckleberry.helloWorld', () => {
        commandHandlers.commandUtils.showInfo('Hello from Huckleberry!');
        logWithChannel(LogLevel.DEBUG, 'Hello World command executed');
      }),
      vscode.commands.registerCommand('vscode-copilot-huckleberry.manageTasks', commandHandlers.manageTasks),
      vscode.commands.registerCommand('vscode-copilot-huckleberry.prioritizeTasks', commandHandlers.prioritizeTasks),
      vscode.commands.registerCommand('vscode-copilot-huckleberry.prioritiseTasks', commandHandlers.prioritizeTasks),
      vscode.commands.registerCommand(
        'vscode-copilot-huckleberry.changeTaskPriority',
        (taskId?: string, priority?: string) => commandHandlers.changeTaskPriority(taskId, priority),
      ),
      vscode.commands.registerCommand(
        'vscode-copilot-huckleberry.checkCopilotAgentMode',
        commandHandlers.checkCopilotAgentMode,
      ),
      vscode.commands.registerCommand(
        'vscode-copilot-huckleberry.testChat',
        commandHandlers.testHuckleberryChat,
      ),
      vscode.commands.registerCommand(
        'vscode-copilot-huckleberry.forceRefreshChatParticipants',
        commandHandlers.forceRefreshChatParticipants,
      ),
      vscode.commands.registerCommand(
        'vscode-copilot-huckleberry.getNextTask',
        commandHandlers.getNextTask,
      ),
      vscode.commands.registerCommand(
        'vscode-copilot-huckleberry.getHelp',
        commandHandlers.getHelp,
      ),
      vscode.commands.registerCommand(
        'vscode-copilot-huckleberry.initialiseTaskTracking',
        commandHandlers.initialiseTaskTracking,
      ),
      vscode.commands.registerCommand(
        'vscode-copilot-huckleberry.initializeTaskTracking',
        commandHandlers.initializeTaskTracking,
      ),
      vscode.commands.registerCommand(
        'vscode-copilot-huckleberry.createTask',
        commandHandlers.createTask,
      ),
      vscode.commands.registerCommand(
        'vscode-copilot-huckleberry.listTasks',
        (priority?: string, status?: string) => commandHandlers.listTasks(priority, status),
      ),
      vscode.commands.registerCommand(
        'vscode-copilot-huckleberry.markTaskComplete',
        (taskId?: string) => commandHandlers.markTaskComplete(taskId),
      ),
      vscode.commands.registerCommand(
        'vscode-copilot-huckleberry.scanTodos',
        (pattern?: string) => commandHandlers.scanTodos(pattern),
      ),
      vscode.commands.registerCommand(
        'vscode-copilot-huckleberry.parseRequirementsDocument',
        (filePath?: string) => commandHandlers.parseRequirementsDocument(filePath),
      ),
      vscode.commands.registerCommand(
        'vscode-copilot-huckleberry.openTaskExplorer',
        commandHandlers.openTaskExplorer,
      ),
      vscode.commands.registerCommand(
        'vscode-copilot-huckleberry.createSubtasks',
        commandHandlers.createSubtasks,
      ),
      vscode.commands.registerCommand(
        'huckleberry.enrichTask',
        commandHandlers.enrichTask,
      ),
      vscode.commands.registerCommand(
        'vscode-copilot-huckleberry.exportTasks',
        commandHandlers.exportTasks,
      ),
    ];

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
    commandDisposables.forEach(disposable => {
      context.subscriptions.push(disposable);
    });
    context.subscriptions.push(workspaceFoldersChangeDisposable);

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
      if (!chatService.getLastActiveTimestamp() && isWorkspaceAvailable()) {
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
  ExtensionStateService.getStaticInstance().reset();
}
