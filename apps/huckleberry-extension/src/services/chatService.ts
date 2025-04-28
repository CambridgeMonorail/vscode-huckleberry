/**
 * Chat service for managing Huckleberry chat participants
 */
import * as vscode from 'vscode';
import { logWithChannel, LogLevel, showDebugChannel as _showDebugChannel } from '../utils/debugUtils';
import { ToolManager } from './toolManager';
// Fix the import by using a more explicit path with the file extension
import { handleChatRequest } from '../handlers/chatHandler.js';

/**
 * Interface for chat participant registration options
 */
export interface ChatParticipantOptions {
  /** Primary ID for the chat participant */
  primaryId: string;
  /** Debug name for identifying this participant in logs */
  debugName?: string;
}

/**
 * Service for managing Huckleberry chat participants
 */
export class ChatService {
  private _context: vscode.ExtensionContext;
  private toolManager: ToolManager;
  private participants: Map<string, vscode.Disposable> = new Map();
  private lastActiveTimestamp: number | null = null;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private isMonitoring = false;

  /**
   * Creates a new ChatService instance
   * @param context The extension context
   * @param toolManager The tool manager instance
   */
  constructor(context: vscode.ExtensionContext, toolManager: ToolManager) {
    this._context = context;
    this.toolManager = toolManager;
  }

  /**
   * Gets the extension context
   */
  public get context(): vscode.ExtensionContext {
    return this._context;
  }

  /**
   * Gets whether chat participants are currently active
   */
  public get isActive(): boolean {
    return this.participants.size > 0;
  }

  /**
   * Gets the timestamp of the last activity
   */
  public get lastActive(): number | null {
    return this.lastActiveTimestamp;
  }

  /**
   * Updates the last active timestamp
   */
  public updateLastActive(): void {
    this.lastActiveTimestamp = Date.now();
    logWithChannel(LogLevel.DEBUG, `Chat participant last active timestamp updated to ${new Date(this.lastActiveTimestamp).toISOString()}`);
  }

  /**
   * Registers all chat participants
   * @returns Array of disposables for the registered participants
   */
  public registerAll(): vscode.Disposable[] {
    logWithChannel(LogLevel.INFO, '🚀 Registering Huckleberry chat participant');
    this.disposeAll();
    const options: ChatParticipantOptions = {
      primaryId: 'huckleberry',
      debugName: 'Huckleberry Task Manager',
    };
    const disposables = this.register(options);
    this.dumpParticipantState();
    if (!this.isMonitoring) {
      this.startMonitoring();
    }
    return disposables;
  }

  /**
   * Registers chat participants with the given options
   * @param options The registration options
   * @returns Array of disposables for the registered participants
   */
  public register(options: ChatParticipantOptions): vscode.Disposable[] {
    const disposables: vscode.Disposable[] = [];
    const { primaryId, debugName } = options;
    logWithChannel(LogLevel.DEBUG, `Registering chat participant: ${debugName || primaryId}`);
    try {
      const primaryParticipant = vscode.chat.createChatParticipant(
        primaryId,
        async (request: vscode.ChatRequest, context: vscode.ChatContext, response: vscode.ChatResponseStream, token: vscode.CancellationToken) => {
          this.logRequestReceived(primaryId, request);
          this.updateLastActive();
          try {
            await handleChatRequest(request, context, response, token, this.toolManager);
            logWithChannel(LogLevel.INFO, `✅ Chat request handled successfully by ${primaryId}`);
          } catch (error) {
            logWithChannel(LogLevel.ERROR, `❌ Error handling chat request in ${primaryId}:`, error);
            await response.markdown(`**Well now, I seem to be having a bad day.** Try again, darlin'.`);
          }
        },
      );
      logWithChannel(LogLevel.INFO, `Chat participant successfully registered with ID: ${primaryId}`);
      this.participants.set(primaryId, primaryParticipant);
      disposables.push(primaryParticipant);
      this.updateLastActive();
      return disposables;
    } catch (error) {
      logWithChannel(LogLevel.CRITICAL, `❌ Failed to register chat participant: ${debugName || primaryId}`, error);
      vscode.window.showErrorMessage(
        'Huckleberry extension failed to register the chat participant. ' +
        'The @Huckleberry commands will not work. Please reload the window or restart VS Code.',
      );
      return [];
    }
  }

  /**
   * Logs information about a received chat request
   * @param participantId The ID of the participant that received the request
   * @param request The chat request
   */
  private logRequestReceived(participantId: string, request: vscode.ChatRequest): void {
    logWithChannel(LogLevel.INFO, `👂 Chat request received by ${participantId}:`, {
      prompt: request.prompt,
      participant: participantId,
      timestamp: new Date().toISOString(),
    });

    // Also log to the console for immediate visibility
    console.log(`🔵 ${participantId} received: "${request.prompt}"`);
  }

  /**
   * Disposes all registered chat participants
   */
  public disposeAll(): void {
    if (this.participants.size === 0) {
      logWithChannel(LogLevel.DEBUG, '⚠️ No chat participants to dispose');
      return;
    }

    logWithChannel(LogLevel.INFO, `Disposing ${this.participants.size} chat participants`);
    
    for (const [id, disposable] of this.participants.entries()) {
      try {
        disposable.dispose();
        logWithChannel(LogLevel.DEBUG, `✓ Successfully disposed chat participant: ${id}`);
      } catch (error) {
        logWithChannel(LogLevel.ERROR, `❌ Error disposing chat participant: ${id}`, error);
      }
    }
    
    this.participants.clear();
    logWithChannel(LogLevel.INFO, '🧹 All chat participants have been disposed');
  }

  /**
   * Forces a refresh of all chat participants
   */
  public async forceRefresh(): Promise<void> {
    logWithChannel(LogLevel.INFO, '🔄 Forcing chat participant refresh');
    
    // Dispose all existing participants
    this.disposeAll();
    
    // Wait a moment for VS Code to process the disposal
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Re-register all participants
    const newParticipants = this.registerAll();
    logWithChannel(LogLevel.INFO, `✅ Re-registered ${newParticipants.length} chat participants`);
    
    // Reset the last active timestamp
    this.updateLastActive();
    
    // Show notification to the user
    // vscode.window.showInformationMessage('Huckleberry chat participants have been refreshed.');
  }

  /**
   * Starts monitoring chat participants for health
   */
  public startMonitoring(): void {
    if (this.isMonitoring) {
      return;
    }

    logWithChannel(LogLevel.INFO, '🔍 Starting chat participant health monitoring');
    
    this.monitoringInterval = setInterval(() => {
      this.checkHealth();
    }, 30 * 1000); // Check every 30 seconds
    
    this.isMonitoring = true;
    
    // Register the interval for disposal when the extension is deactivated
    this.context.subscriptions.push({
      dispose: () => {
        if (this.monitoringInterval) {
          clearInterval(this.monitoringInterval);
          this.monitoringInterval = null;
          this.isMonitoring = false;
          logWithChannel(LogLevel.DEBUG, '⏹️ Stopped chat participant health monitoring');
        }
      },
    });
  }

  /**
   * Checks the health of chat participants
   */
  private checkHealth(): void {
    // Only log detailed health checks at DEBUG level to avoid spam
    const workspaceAvailable = vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0;
    logWithChannel(LogLevel.DEBUG, '🩺 Checking chat participant health', {
      participantsCount: this.participants.size,
      lastActive: this.lastActive ? new Date(this.lastActive).toISOString() : 'never',
      workspaceAvailable,
      workspaceFolders: vscode.workspace.workspaceFolders?.map(f => f.name) || [],
    });

    // If we've been inactive for too long, consider refreshing
    if (this.lastActive && Date.now() - this.lastActive > 5 * 60 * 1000) {
      logWithChannel(LogLevel.WARN, '⚠️ Chat participants have been inactive for over 5 minutes');
      
      // Only force refresh if we have a workspace
      if (workspaceAvailable) {
        logWithChannel(LogLevel.INFO, '🔄 Refreshing inactive chat participants with workspace available');
        this.forceRefresh().catch(err => {
          logWithChannel(LogLevel.ERROR, '❌ Failed to refresh chat participants during health check:', err);
        });
      }
    }

    // If we have no participants but should have them, try to register
    if (this.participants.size === 0) {
      logWithChannel(LogLevel.WARN, '⚠️ No active chat participants found');
      this.registerAll();
    }

    // Dump state during health checks occasionally
    if (Math.random() < 0.2) { // 20% chance
      this.dumpParticipantState();
    }
  }

  /**
   * Dumps the current state of chat participants to the debug channel
   */
  private dumpParticipantState(): void {
    const state = {
      participantCount: this.participants.size,
      participantIds: Array.from(this.participants.keys()),
      lastActive: this.lastActive ? new Date(this.lastActive).toISOString() : null,
      isMonitoring: this.isMonitoring,
      workspaceAvailable: vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0,
      workspaceFolders: vscode.workspace.workspaceFolders?.map(f => ({
        name: f.name,
        path: f.uri.fsPath,
        uri: f.uri.toString(),
      })),
    };

    logWithChannel(LogLevel.DEBUG, '📊 Chat Participant State:', state);
  }
}