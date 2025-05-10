import * as vscode from 'vscode';
import { logWithChannel, LogLevel } from './debugUtils';

/**
 * Interface for Copilot mode information
 */
export interface CopilotModeInfo {
  /**
   * Whether Copilot is available/installed
   */
  isAvailable: boolean;

  /**
   * Whether Copilot agent mode is enabled
   */
  isAgentModeEnabled: boolean;
  
  /**
   * Whether Copilot chat is available
   */
  isChatAvailable: boolean;

  /**
   * Error message if detection failed
   */
  error?: string;
}

/**
 * Detects the current mode and availability of GitHub Copilot
 * @returns A promise that resolves to an object containing Copilot mode information
 */
export async function detectCopilotMode(): Promise<{
  isAvailable: boolean;
  isChatAvailable: boolean;
  isAgentModeEnabled: boolean;
  error?: string;
}> {
  try {
    // Set a default result with all features unavailable
    const result = {
      isAvailable: false,
      isChatAvailable: false,
      isAgentModeEnabled: false,
    };

    // First check if Copilot and related extensions are installed
    const extensions = vscode.extensions.all;
    
    // Check GitHub Copilot
    const copilot = extensions.find(ext => ext.id === 'GitHub.copilot');
    result.isAvailable = !!copilot && copilot.isActive;
    
    // Check GitHub Copilot Chat
    const copilotChat = extensions.find(ext => ext.id === 'GitHub.copilot-chat');
    result.isChatAvailable = !!copilotChat && copilotChat.isActive;

    // Only try to check agent mode settings if Copilot is actually available
    // This prevents errors when Copilot isn't installed or isn't active
    if (result.isAvailable) {
      try {
        // Try to get the agent mode setting - this might fail if Copilot's API has changed
        const config = vscode.workspace.getConfiguration('github.copilot');
        const agentMode = config.get<boolean>('advanced.agents.enabled');
        result.isAgentModeEnabled = !!agentMode;
      } catch (settingError) {
        // Log the error but don't fail the overall detection
        logWithChannel(LogLevel.WARN, 'Error checking Copilot agent mode setting:', settingError);
        // Don't modify the isAgentModeEnabled flag - leave it as false
      }
    }

    return result;
  } catch (error) {
    // Handle any unexpected errors gracefully
    logWithChannel(LogLevel.ERROR, 'Error in detectCopilotMode:', error);
    
    // Return a result with an error field but don't throw
    return {
      isAvailable: false,
      isChatAvailable: false,
      isAgentModeEnabled: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Shows a notification recommending agent mode if not enabled
 * @param showAnyway Force showing the notification even if agent mode is enabled
 * @returns Promise resolving to true if the notification was shown
 */
export async function recommendAgentMode(showAnyway = false): Promise<boolean> {
  try {
    const modeInfo = await detectCopilotMode();
    
    // Only show notification if Copilot is available but agent mode is not enabled
    // (or if forced to show anyway)
    if ((modeInfo.isAvailable && !modeInfo.isAgentModeEnabled) || showAnyway) {
      const message = 'Huckleberry works best with GitHub Copilot in agent mode. Would you like to enable agent mode?';
      
      const result = await vscode.window.showInformationMessage(
        message,
        'Enable Agent Mode',
        'Learn More',
        'Dismiss',
      );
      
      if (result === 'Enable Agent Mode') {
        // Open settings to the relevant Copilot configuration
        await vscode.commands.executeCommand(
          'workbench.action.openSettings',
          'github.copilot.chat.agentMode',
        );
        return true;
      } else if (result === 'Learn More') {
        // Open documentation about agent mode
        await vscode.env.openExternal(
          vscode.Uri.parse('https://code.visualstudio.com/docs/editor/github-copilot#_agent-mode'),
        );
        return true;
      }
      
      return result !== 'Dismiss';
    }
    
    return false;
  } catch (error) {
    console.error('Error recommending agent mode:', error);
    return false;
  }
}

/**
 * Checks if GitHub Copilot is available and shows an appropriate message if not
 * @returns True if Copilot is available, false otherwise
 */
export async function checkCopilotAvailability(): Promise<boolean> {
  try {
    const modeInfo = await detectCopilotMode();
    
    if (!modeInfo.isAvailable) {
      vscode.window.showWarningMessage(
        'Copilot is not available. Please ensure you have an active GitHub Copilot subscription or access token.',
        'Get Copilot',
      ).then(selection => {
        if (selection === 'Get Copilot') {
          vscode.env.openExternal(
            vscode.Uri.parse('https://marketplace.visualstudio.com/items?itemName=GitHub.copilot'),
          );
        }
      });
      return false;
    }
    
    if (!modeInfo.isChatAvailable) {
      vscode.window.showWarningMessage(
        'GitHub Copilot Chat is not available. Huckleberry works best with Copilot Chat installed.',
        'Get Copilot Chat',
      ).then(selection => {
        if (selection === 'Get Copilot Chat') {
          vscode.commands.executeCommand(
            'workbench.extensions.search',
            'GitHub.copilot-chat',
          );
        }
      });
      // Return true anyway since basic functionality can work without Chat
      return true;
    }
    
    return true;
  } catch (error) {
    logWithChannel(LogLevel.ERROR, 'Error checking Copilot availability:', error);
    return false;
  }
}