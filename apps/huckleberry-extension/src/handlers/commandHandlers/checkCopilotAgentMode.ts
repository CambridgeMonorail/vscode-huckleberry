/**
 * Command handler for checking Copilot agent mode
 */
import * as vscode from 'vscode';
import { detectCopilotMode } from '../../utils/copilotHelper';
import { logWithChannel, LogLevel } from '../../utils/debugUtils';

/**
 * Command handler for checking Copilot agent mode
 */
export async function checkCopilotAgentMode(): Promise<void> {
  try {
    // Set a timeout to prevent this check from hanging indefinitely
    const timeoutPromise = new Promise<{isAvailable: false, error: string}>(resolve => {
      setTimeout(() => {
        resolve({ 
          isAvailable: false, 
          error: 'Timeout while checking Copilot availability', 
        });
      }, 5000);
    });

    // Race the detection against the timeout
    const modeInfo = await Promise.race([
      detectCopilotMode().catch(error => ({
        isAvailable: false,
        isChatAvailable: false,
        isAgentModeEnabled: false,
        error: error instanceof Error ? error.message : String(error),
      })),
      timeoutPromise,
    ]);

    // Log results of the check for diagnostic purposes
    logWithChannel(LogLevel.INFO, 'Copilot availability check results:', modeInfo);

    if ('error' in modeInfo) {
      // If we got an error from detectCopilotMode or the timeout
      logWithChannel(LogLevel.WARN, `Copilot check failed: ${modeInfo.error}`);
      vscode.window.showInformationMessage(
        'Huckleberry functions best with GitHub Copilot but will continue with limited AI-powered features.',
        'Learn More',
      ).then(selection => {
        if (selection === 'Learn More') {
          vscode.env.openExternal(
            vscode.Uri.parse('https://marketplace.visualstudio.com/items?itemName=GitHub.copilot'),
          );
        }
      });
      return;
    }

    if (!modeInfo.isAvailable) {
      vscode.window.showWarningMessage(
        'GitHub Copilot does not appear to be installed. Huckleberry will continue with limited AI-powered features.',
        'Install Copilot',
      ).then(selection => {
        if (selection === 'Install Copilot') {
          vscode.commands.executeCommand(
            'workbench.extensions.search',
            'GitHub.copilot',
          );
        }
      });
      return;
    }

    if (!modeInfo.isChatAvailable) {
      vscode.window.showWarningMessage(
        'GitHub Copilot Chat does not appear to be installed. Huckleberry will continue with limited features.',
        'Install Copilot Chat',
      ).then(selection => {
        if (selection === 'Install Copilot Chat') {
          vscode.commands.executeCommand(
            'workbench.extensions.search',
            'GitHub.copilot-chat',
          );
        }
      });
      return;
    }

    if (modeInfo.isAgentModeEnabled) {
      vscode.window.showInformationMessage(
        'GitHub Copilot agent mode is enabled. Huckleberry is optimized for this configuration!',
        'Learn More',
      ).then(selection => {
        if (selection === 'Learn More') {
          vscode.env.openExternal(
            vscode.Uri.parse('https://code.visualstudio.com/docs/editor/github-copilot#_agent-mode'),
          );
        }
      });
    } else {
      // Log that agent mode is not enabled without showing notification based on user feedback
      logWithChannel(LogLevel.DEBUG, 'Copilot agent mode is not enabled, but suppressing notification based on user feedback');
    }
  } catch (error) {
    // Handle any unexpected errors gracefully
    logWithChannel(LogLevel.ERROR, 'Error checking Copilot agent mode:', error);
    vscode.window.showInformationMessage(
      'Unable to check Copilot configuration. Huckleberry will continue with potentially limited functionality.',
    );
  }
}