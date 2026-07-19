import * as vscode from 'vscode';
import { ExtensionServices } from './types';

/**
 * Registers all chat participants exposed by the extension.
 */
export function registerChatParticipants(
  context: vscode.ExtensionContext,
  services: ExtensionServices,
): void {
  const participantDisposables = services.chatService.registerAll();
  context.subscriptions.push(...participantDisposables);
}
