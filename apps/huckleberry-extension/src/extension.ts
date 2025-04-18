/**
 * Main entry point for the Huckleberry extension
 */
import * as vscode from 'vscode';
import { ReadFileTool } from './tools/ReadFileTool';
import { WriteFileTool } from './tools/WriteFileTool';
import { MarkDoneTool } from './tools/MarkDoneTool';
import { ToolManager } from './services/toolManager';
import { ChatService } from './services/chatService';
import { showInfo } from './utils/uiHelpers';
import { isWorkspaceAvailable, notifyNoWorkspace } from './handlers/chatHandler';
import { recommendAgentMode, detectCopilotMode } from './utils/copilotHelper';
import { initDebugChannel, logWithChannel, LogLevel, dumpState } from './utils/debugUtils';

/**
 * State of the extension including key services
 */
interface ExtensionState {
  chatService: ChatService;
  toolManager: ToolManager;
}

/**
 * Global extension state
 */
let extensionState: ExtensionState | null = null;

/**
 * Command handler for the manageTasks command
 */
function manageTasks(): void {
  showInfo('Task management interface will be implemented soon!');
}

/**
 * Command handler for checking Copilot agent mode
 */
async function checkCopilotAgentMode(): Promise<void> {
  try {
    const modeInfo = await detectCopilotMode();
    
    if (!modeInfo.isAvailable) {
      vscode.window.showWarningMessage(
        'GitHub Copilot does not appear to be installed. Huckleberry works best with GitHub Copilot.',
        'Install Copilot'
      ).then(selection => {
        if (selection === 'Install Copilot') {
          vscode.commands.executeCommand(
            'workbench.extensions.search',
            'GitHub.copilot'
          );
        }
      });
      return;
    }
    
    if (!modeInfo.isChatAvailable) {
      vscode.window.showWarningMessage(
        'GitHub Copilot Chat does not appear to be installed. Huckleberry works best with Copilot Chat.',
        'Install Copilot Chat'
      ).then(selection => {
        if (selection === 'Install Copilot Chat') {
          vscode.commands.executeCommand(
            'workbench.extensions.search',
            'GitHub.copilot-chat'
          );
        }
      });
      return;
    }
    
    if (modeInfo.isAgentModeEnabled) {
      vscode.window.showInformationMessage(
        'GitHub Copilot agent mode is enabled. Huckleberry is optimized for this configuration!',
        'Learn More'
      ).then(selection => {
        if (selection === 'Learn More') {
          vscode.env.openExternal(
            vscode.Uri.parse('https://code.visualstudio.com/docs/editor/github-copilot#_agent-mode')
          );
        }
      });
    } else {
      // Show recommendation notification
      recommendAgentMode(true);
    }
  } catch (error) {
    logWithChannel(LogLevel.ERROR, 'Error checking Copilot agent mode:', error);
    vscode.window.showErrorMessage(`Failed to check Copilot configuration: ${error instanceof Error ? error.message : String(error)}`);
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
      ext.packageJSON?.activationEvents?.some((event: string) => event.startsWith('onChatParticipant:'))
    );
    
    logWithChannel(LogLevel.DEBUG, `Found ${chatExtensions.length} extensions with chat participants:`);
    chatExtensions.forEach(ext => {
      const participants = ext.packageJSON?.contributes?.chatParticipants || [];
      logWithChannel(LogLevel.DEBUG, `- ${ext.id}: ${participants.map((p: any) => p.id).join(', ')}`);
    });
    
    // Dump current extension state
    dumpState(extensionState.chatService.context, {
      chatServiceActive: extensionState.chatService.isActive,
      lastActive: extensionState.chatService.lastActive ? 
                  new Date(extensionState.chatService.lastActive).toISOString() : 'never',
      workspaceAvailable: isWorkspaceAvailable()
    });
    
    // Force a refresh of chat participants
    await extensionState.chatService.forceRefresh();
    
    // Log that the test is complete with instructions for the user
    logWithChannel(LogLevel.INFO, '✅ Chat integration test complete');
    
    // Display success message
    vscode.window.showInformationMessage(
      'Huckleberry chat test executed. Check Debug panel for detailed information.',
      'Open Debug Panel',
      'Open Chat'
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
 * Prompts the user to reload the window when a workspace is opened.
 */
function promptReloadOnWorkspaceOpen(): void {
  vscode.workspace.onDidChangeWorkspaceFolders(e => {
    if (e.added.length > 0) {
      vscode.window.showInformationMessage(
        'Huckleberry needs to reload the window to work after opening a folder. Reload now?',
        'Reload Window'
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
  const debugChannel = initDebugChannel();
  
  logWithChannel(LogLevel.INFO, '🚀 Huckleberry extension activating');

  try {
    // Check Copilot mode and recommend agent mode if needed
    detectCopilotMode().then(modeInfo => {
      logWithChannel(LogLevel.INFO, 'Copilot mode detected:', modeInfo);
      
      if (modeInfo.isAvailable && !modeInfo.isAgentModeEnabled) {
        recommendAgentMode();
      }
    }).catch(error => {
      logWithChannel(LogLevel.ERROR, 'Error checking Copilot mode:', error);
    });

    // Create and register tools
    const toolManager = new ToolManager();
    const readFileTool = new ReadFileTool();
    const writeFileTool = new WriteFileTool();
    const markDoneTool = new MarkDoneTool();
    
    toolManager.registerTool(readFileTool);
    toolManager.registerTool(writeFileTool);
    toolManager.registerTool(markDoneTool);

    // Initialize chat service
    const chatService = new ChatService(context, toolManager);

    // Store extension state
    extensionState = {
      chatService,
      toolManager
    };
    
    // Register commands
    const helloWorldDisposable = vscode.commands.registerCommand('huckleberry-extension.helloWorld', () => {
      showInfo('Hello from Huckleberry!');
      logWithChannel(LogLevel.DEBUG, 'Hello World command executed');
    });

    const manageTasksDisposable = vscode.commands.registerCommand('huckleberry-extension.manageTasks', () => {
      // Check workspace availability before proceeding
      if (!isWorkspaceAvailable()) {
        notifyNoWorkspace();
        return;
      }
      
      manageTasks();
    });

    const checkCopilotAgentModeDisposable = vscode.commands.registerCommand(
      'huckleberry-extension.checkCopilotAgentMode', 
      checkCopilotAgentMode
    );
    
    // Add the test chat command
    const testChatDisposable = vscode.commands.registerCommand(
      'huckleberry-extension.testChat', 
      testHuckleberryChat
    );
    
    // Add the force refresh command
    const forceRefreshDisposable = vscode.commands.registerCommand(
      'huckleberry-extension.forceRefreshChatParticipants', 
      forceRefreshChatParticipants
    );

    // Register workspace change listener to detect when workspace folders are added/removed
    const workspaceFoldersChangeDisposable = vscode.workspace.onDidChangeWorkspaceFolders(async e => {
      const foldersAdded = e.added.length > 0;
      const foldersRemoved = e.removed.length > 0;
      
      logWithChannel(LogLevel.INFO, 'Workspace folders changed', {
        added: e.added.map(folder => folder.name),
        removed: e.removed.map(folder => folder.name),
        current: vscode.workspace.workspaceFolders?.map(folder => folder.name) || []
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
              'Initialize Task Tracking'
            ).then(selection => {
              if (selection === 'Initialize Task Tracking') {
                // Open chat with Huckleberry and pre-fill the initialize command
                vscode.commands.executeCommand(
                  'workbench.action.chat.open', 
                  '@huckleberry Initialize task tracking for this project'
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
      checkCopilotAgentModeDisposable,
      testChatDisposable,
      forceRefreshDisposable,
      workspaceFoldersChangeDisposable
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
        path: folder.uri.fsPath
      })) || [],
      name: vscode.workspace.name,
      available: isWorkspaceAvailable()
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
      `Huckleberry extension failed to activate: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Deactivates the extension
 */
export function deactivate(): void {
  logWithChannel(LogLevel.INFO, '👋 Deactivating Huckleberry extension');
  
  if (extensionState) {
    // Clean up any resources
    extensionState.chatService.disposeAll();
    extensionState = null;
  }
}
