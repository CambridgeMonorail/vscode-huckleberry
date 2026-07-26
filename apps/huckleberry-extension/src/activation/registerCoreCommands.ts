import * as vscode from 'vscode';
import * as commandHandlers from '../handlers/commandHandlers';
import { logWithChannel, LogLevel } from '../utils';

/**
 * Registers core extension commands that are independent from workflow runtime.
 */
export function registerCoreCommands(context: vscode.ExtensionContext): void {
  const commandDisposables = [
    vscode.commands.registerCommand('vscode-copilot-huckleberry.helloWorld', () => {
      commandHandlers.commandUtils.showInfo('Hello from Huckleberry!');
      logWithChannel(LogLevel.DEBUG, 'Hello World command executed');
    }),
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
  ];

  context.subscriptions.push(...commandDisposables);
}
