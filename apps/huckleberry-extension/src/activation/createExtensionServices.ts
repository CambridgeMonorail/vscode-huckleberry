import * as vscode from 'vscode';
import { ReadFileTool, WriteFileTool, MarkDoneTool } from '../tools';
import { ChatService, LanguageModelToolsProvider, ToolManager } from '../services';
import { ExtensionStateService } from '../services/extensionStateService';
import { logWithChannel, LogLevel } from '../utils';
import { ExtensionServices } from './types';

/**
 * Creates and initializes activation services shared across registration modules.
 */
export function createExtensionServices(context: vscode.ExtensionContext): ExtensionServices {
  const toolManager = new ToolManager();
  toolManager.registerTool(new ReadFileTool());
  toolManager.registerTool(new WriteFileTool());
  toolManager.registerTool(new MarkDoneTool());

  const chatService = new ChatService(context, toolManager);

  logWithChannel(LogLevel.INFO, 'Creating language model tools provider');
  const languageModelToolsProvider = new LanguageModelToolsProvider(toolManager);

  // Task-domain LM tool registration remains disabled during shell conversion.
  logWithChannel(LogLevel.INFO, 'Skipping language model tool registration during shell conversion');

  ExtensionStateService.getStaticInstance().initializeWithServices(
    chatService,
    toolManager,
    languageModelToolsProvider,
  );

  return {
    toolManager,
    chatService,
    languageModelToolsProvider,
  };
}
