/**
 * Main entry point for the Huckleberry extension
 */
import * as vscode from 'vscode';
import { isWorkspaceAvailable } from './handlers/chatHandler';
import { initDebugChannel, logWithChannel, LogLevel } from './utils';
import { ExtensionStateService } from './services/extensionStateService';
import {
  createExtensionServices,
  registerCoreCommands,
  registerShellViews,
  registerWorkspaceLifecycle,
  registerChatParticipants,
} from './activation';

/**
 * Activates the extension
 */
export function activate(context: vscode.ExtensionContext): void {
  // Initialize the debug channel
  const _debugChannel = initDebugChannel();

  logWithChannel(LogLevel.INFO, '🚀 Huckleberry extension activating');

  try {
    const services = createExtensionServices(context);

    registerShellViews(context);
    registerCoreCommands(context);
    registerWorkspaceLifecycle(context, services);
    registerChatParticipants(context, services);

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
      if (!services.chatService.getLastActiveTimestamp() && isWorkspaceAvailable()) {
        logWithChannel(LogLevel.INFO, 'Scheduling post-activation chat participant refresh');
        services.chatService.forceRefresh().catch(err => {
          logWithChannel(LogLevel.ERROR, 'Failed to refresh chat participants during delayed check:', err);
        });
      }
    }, 10000); // Check 10 seconds after activation
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
