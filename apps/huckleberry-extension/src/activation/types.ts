import { ChatService, LanguageModelToolsProvider, ToolManager } from '../services';

/**
 * Shared service container used during extension activation.
 */
export interface ExtensionServices {
  toolManager: ToolManager;
  chatService: ChatService;
  languageModelToolsProvider: LanguageModelToolsProvider;
}
