import * as vscode from 'vscode';

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
}

/**
 * Detects the current state of GitHub Copilot and its agent mode
 * @returns Promise with Copilot mode information
 */
export async function detectCopilotMode(): Promise<CopilotModeInfo> {
  const result: CopilotModeInfo = {
    isAvailable: false,
    isAgentModeEnabled: false,
    isChatAvailable: false
  };

  try {
    // Check if GitHub Copilot extension is installed
    const copilotExtension = vscode.extensions.getExtension('GitHub.copilot');
    result.isAvailable = !!copilotExtension;

    // Check if GitHub Copilot Chat extension is installed
    const copilotChatExtension = vscode.extensions.getExtension('GitHub.copilot-chat');
    result.isChatAvailable = !!copilotChatExtension;

    // Try to access GitHub Copilot configuration to check agent mode
    if (result.isAvailable) {
      const config = vscode.workspace.getConfiguration('github.copilot');
      // The setting for agent mode might be under different paths depending on Copilot version
      // These are the most likely paths based on current documentation
      const agentMode = config.get('advanced.agentMode') || 
                       config.get('chat.agentMode') || 
                       config.get('enable.agentMode');
                       
      result.isAgentModeEnabled = !!agentMode;
    }

    return result;
  } catch (error) {
    console.error('Error detecting Copilot mode:', error);
    return result;
  }
}

/**
 * Shows a notification recommending agent mode if not enabled
 * @param showAnyway Force showing the notification even if agent mode is enabled
 * @returns Promise resolving to true if the notification was shown
 */
export async function recommendAgentMode(showAnyway: boolean = false): Promise<boolean> {
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
        'Dismiss'
      );
      
      if (result === 'Enable Agent Mode') {
        // Open settings to the relevant Copilot configuration
        await vscode.commands.executeCommand(
          'workbench.action.openSettings',
          'github.copilot.chat.agentMode'
        );
        return true;
      } else if (result === 'Learn More') {
        // Open documentation about agent mode
        await vscode.env.openExternal(
          vscode.Uri.parse('https://code.visualstudio.com/docs/editor/github-copilot#_agent-mode')
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