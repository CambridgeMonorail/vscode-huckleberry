/**
 * Command handler for forcing a refresh of chat participants
 */
import * as vscode from 'vscode';
import { logWithChannel, LogLevel } from '../../utils/debugUtils';
import { getExtensionState } from '../../services/extensionStateService';

/**
 * Command handler for forcing a refresh of chat participants
 */
export async function forceRefreshChatParticipants(): Promise<void> {
  const state = getExtensionState();
  if (!state) {
    vscode.window.showErrorMessage('Extension not properly initialized');
    return;
  }

  try {
    await state.chatService.forceRefresh();

    // Show the debug channel with details of the refresh
    vscode.commands.executeCommand('workbench.action.output.show', 'Huckleberry Debug');
  } catch (error) {
    logWithChannel(LogLevel.ERROR, 'Error forcing chat participant refresh:', error);
    vscode.window.showErrorMessage(`Failed to refresh chat participants: ${error instanceof Error ? error.message : String(error)}`);
  }
}