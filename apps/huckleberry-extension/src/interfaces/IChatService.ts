/**
 * Interface for ChatService
 */
import * as vscode from 'vscode';

/**
 * Options for registering a chat participant
 */
export interface ChatParticipantOptions {
  /** Primary ID for the chat participant */
  primaryId: string;
  /** Debug name for identifying this participant in logs */
  debugName?: string;
}

/**
 * Interface for the ChatService
 */
export interface IChatService {
  /**
   * Initialize the chat service
   * @param context VS Code extension context
   */
  initialize(context: vscode.ExtensionContext): void;
  
  /**
   * Register a chat participant
   * @param options Chat participant options
   * @param handler The function to handle chat requests
   * @returns A disposable that unregisters the participant when disposed
   */
  registerChatParticipant(
    options: ChatParticipantOptions,
    handler: (request: vscode.ChatRequest, context: vscode.ChatContext, response: vscode.ChatResponseStream) => Promise<void>
  ): vscode.Disposable;

  /**
   * Handle a chat request
   * @param request The chat request
   * @param context The chat context
   * @param response The response stream
   */
  handleRequest(request: vscode.ChatRequest, context: vscode.ChatContext, response: vscode.ChatResponseStream): Promise<void>;

  /**
   * Check if the chat service is active
   * @returns True if a chat participant is active
   */
  isActive(): boolean;

  /**
   * Get the timestamp of the last activity
   * @returns The timestamp of the last activity or null if not active
   */
  getLastActiveTimestamp(): number | null;

  /**
   * Start monitoring for participant activity
   * @param intervalMs The interval to check for activity in milliseconds
   */
  startMonitoring(intervalMs?: number): void;

  /**
   * Stop monitoring for participant activity
   */
  stopMonitoring(): void;

  /**
   * Refresh the chat participant registration
   */
  refreshParticipants(): void;

  /**
   * Get all registered participant IDs
   * @returns The IDs of all registered participants
   */
  getParticipantIds(): string[];

  /**
   * Dispose all participants and clean up resources
   */
  dispose(): void;
}
