/**
 * Interface for ExtensionStateService
 */
import { IChatService } from './IChatService';
import { ILanguageModelToolsProvider } from './ILanguageModelToolsProvider';
import { IToolManager } from './IToolManager';


/**
 * Extension state interface
 */
export interface ExtensionState {
  chatService: IChatService;
  toolManager: IToolManager;
  languageModelToolsProvider: ILanguageModelToolsProvider;
}

/**
 * Interface for the ExtensionStateService
 */
export interface IExtensionStateService {
  /**
   * Get the extension state
   * @returns The current extension state
   * @throws Error if the state has not been initialized
   */
  getState(): ExtensionState;
  
  /**
   * Check if the state has been initialized
   * @returns True if the state has been initialized
   */
  isInitialized(): boolean;
  
  /**
   * Initialize the extension state
   * @param state The extension state
   */
  initialize(state: ExtensionState): void;
  
  /**
   * Reset the extension state
   */
  reset(): void;
  
  /**
   * Get the singleton instance of the extension state service
   * @returns The extension state service
   */
  getInstance(): IExtensionStateService;
}
