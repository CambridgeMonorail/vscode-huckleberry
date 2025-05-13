/**
 * Command handler for testing Huckleberry chat integration
 */
import * as vscode from 'vscode';
import { logWithChannel, LogLevel, dumpState } from '../../utils';
import { getExtensionState } from '../../services/extensionStateService';
import { isWorkspaceAvailable } from '../chatHandler';

/**
 * Command handler for directly testing Huckleberry chat integration
 */
export async function testHuckleberryChat(): Promise<void> {
  try {
    const state = getExtensionState();
    if (!state) {
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
    });    // Dump current extension state
    dumpState(state.chatService.context, {
      chatServiceActive: state.chatService.isActive(),      lastActive: state.chatService.getLastActiveTimestamp() ?
        new Date(state.chatService.getLastActiveTimestamp() as number).toISOString() : 'never',
      workspaceAvailable: isWorkspaceAvailable(),
    });

    // Force a refresh of chat participants
    await state.chatService.forceRefresh();

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