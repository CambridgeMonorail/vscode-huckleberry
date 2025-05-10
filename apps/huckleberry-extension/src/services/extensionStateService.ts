/**
 * Service for managing extension state
 */
import { ToolManager } from './toolManager';
import { ChatService } from './chatService';
import { LanguageModelToolsProvider } from './languageModelToolsProvider';
import { logWithChannel, LogLevel } from '../utils/debugUtils';

/**
 * Extension state interface
 */
export interface ExtensionState {
  chatService: ChatService;
  toolManager: ToolManager;
  languageModelToolsProvider: LanguageModelToolsProvider;
}

/**
 * Service for managing extension state
 */
export class ExtensionStateService {
  private static instance: ExtensionStateService | null = null;
  private _state: ExtensionState | null = null;

  /**
   * Private constructor for singleton pattern
   * Empty by design to implement the singleton pattern
   */
  private constructor() {
    // This constructor is intentionally empty to implement the singleton pattern
  }

  /**
   * Get the singleton instance
   */
  public static getInstance(): ExtensionStateService {
    if (!ExtensionStateService.instance) {
      ExtensionStateService.instance = new ExtensionStateService();
    }
    return ExtensionStateService.instance;
  }

  /**
   * Initialize the extension state
   * @param chatService Chat service instance
   * @param toolManager Tool manager instance
   * @param languageModelToolsProvider Language model tools provider instance
   */
  public initialize(
    chatService: ChatService,
    toolManager: ToolManager,
    languageModelToolsProvider: LanguageModelToolsProvider,
  ): void {
    this._state = {
      chatService,
      toolManager,
      languageModelToolsProvider,
    };
    logWithChannel(LogLevel.INFO, '✅ Extension state initialized');
  }

  /**
   * Get the extension state
   */
  public get state(): ExtensionState | null {
    return this._state;
  }

  /**
   * Clear the extension state
   */
  public clear(): void {
    // Clean up language model tools
    if (this._state?.languageModelToolsProvider) {
      try {
        this._state.languageModelToolsProvider.dispose();
        logWithChannel(LogLevel.DEBUG, '✓ Language model tools disposed');
      } catch (error) {
        logWithChannel(LogLevel.ERROR, '❌ Error disposing language model tools:', error);
      }
    }

    // Clean up chat service
    if (this._state?.chatService) {
      this._state.chatService.disposeAll();
    }

    // Clear the state
    this._state = null;
    logWithChannel(LogLevel.INFO, '✅ Extension state cleared');
  }
}

/**
 * Shorthand function to get extension state
 */
export function getExtensionState(): ExtensionState | null {
  return ExtensionStateService.getInstance().state;
}