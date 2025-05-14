/**
 * Service for managing extension state
 */
import { ToolManager } from './toolManager';
import { ChatService } from './chatService';
import { LanguageModelToolsProvider } from './languageModelToolsProvider';
import { logWithChannel, LogLevel } from '../utils/debugUtils';
import {
  IExtensionStateService,
  ExtensionState as IExtensionState,
} from '../interfaces/IExtensionStateService';
import { IChatService } from '../interfaces/IChatService';
import { IToolManager } from '../interfaces/IToolManager';
import { ILanguageModelToolsProvider } from '../interfaces/ILanguageModelToolsProvider';

/**
 * Extension state interface
 * Note: We're defining our concrete implementation of the state
 */
export interface ExtensionState {
  chatService: ChatService;
  toolManager: ToolManager;
  languageModelToolsProvider: LanguageModelToolsProvider;
}

/**
 * Service for managing extension state
 */
export class ExtensionStateService implements IExtensionStateService {
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
   * @returns The extension state service singleton instance
   */
  public static getStaticInstance(): ExtensionStateService {
    if (!ExtensionStateService.instance) {
      ExtensionStateService.instance = new ExtensionStateService();
    }
    return ExtensionStateService.instance;
  }

  /**
   * Get the singleton instance of the extension state service
   * @returns The extension state service
   */ public getInstance(): IExtensionStateService {
    return ExtensionStateService.getStaticInstance();
  }

  /**
   * Initialize the extension state
   * @param state The extension state object
   */
  public initialize(state: IExtensionState): void {
    // Convert interface types to implementation types
    this._state = {
      chatService: state.chatService as unknown as ChatService,
      toolManager: state.toolManager as unknown as ToolManager,
      languageModelToolsProvider:
        state.languageModelToolsProvider as unknown as LanguageModelToolsProvider,
    };
    logWithChannel(LogLevel.INFO, '✅ Extension state initialized');
  }

  /**
   * Initialize the extension state with individual service instances
   * @param chatService Chat service instance
   * @param toolManager Tool manager instance
   * @param languageModelToolsProvider Language model tools provider instance
   */
  public initializeWithServices(
    chatService: ChatService,
    toolManager: ToolManager,
    languageModelToolsProvider: LanguageModelToolsProvider,
  ): void {
    this._state = {
      chatService,
      toolManager,
      languageModelToolsProvider,
    };
    logWithChannel(
      LogLevel.INFO,
      '✅ Extension state initialized with services',
    );
  }
  /**
   * Get the extension state
   * @returns The current extension state
   * @throws Error if the state has not been initialized
   */
  public getState(): IExtensionState {
    if (!this._state) {
      throw new Error('Extension state has not been initialized');
    }
    // Cast to interface type for API compatibility
    return {
      chatService: this._state.chatService as unknown as IChatService,
      toolManager: this._state.toolManager as unknown as IToolManager,
      languageModelToolsProvider: this._state
        .languageModelToolsProvider as unknown as ILanguageModelToolsProvider,
    };
  }
  /**
   * Check if the state has been initialized
   * @returns True if the state has been initialized
   */
  public isInitialized(): boolean {
    return this._state !== null;
  }

  /**
   * Reset the extension state
   */
  public reset(): void {
    // Clean up language model tools
    if (this._state?.languageModelToolsProvider) {
      try {
        this._state.languageModelToolsProvider.dispose();
        logWithChannel(LogLevel.DEBUG, '✓ Language model tools disposed');
      } catch (_error) {
        logWithChannel(
          LogLevel.ERROR,
          '❌ Error disposing language model tools:',
          _error,
        );
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
 * This returns the concrete implementation types for internal use
 */
export function getExtensionState(): ExtensionState | null {
  try {
    const state = ExtensionStateService.getStaticInstance().getState();
    return {
      chatService: state.chatService as unknown as ChatService,
      toolManager: state.toolManager as unknown as ToolManager,
      languageModelToolsProvider:
        state.languageModelToolsProvider as unknown as LanguageModelToolsProvider,
    };
  } catch {
    return null;
  }
}
