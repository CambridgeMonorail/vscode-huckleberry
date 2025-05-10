/**
 * Command handler for initializing task tracking
 */
import * as vscode from 'vscode';
import { isWorkspaceAvailable, notifyNoWorkspace } from '../chatHandler';
import { logWithChannel, LogLevel } from '../../utils/debugUtils';
import { checkCopilotAvailability } from '../../utils/copilotHelper';

/**
 * Command handler for initializing task tracking (US spelling)
 */
export async function initializeTaskTracking(): Promise<void> {
  try {
    if (!isWorkspaceAvailable()) {
      notifyNoWorkspace();
      return;
    }

    // Check for Copilot availability before proceeding
    if (!(await checkCopilotAvailability())) {
      return;
    }

    logWithChannel(LogLevel.INFO, '🎯 Command: Initialize Task Tracking');

    // Open chat with Huckleberry and send the initialize command
    vscode.commands.executeCommand(
      'workbench.action.chat.open',
      '@huckleberry Initialize task tracking for this project',
    );
  } catch (error) {
    logWithChannel(LogLevel.ERROR, 'Error in initializeTaskTracking command:', error);
    vscode.window.showErrorMessage(`Failed to initialize task tracking: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Command handler for initializing task tracking (UK spelling - alias)
 * This is an alias for the US spelling to support UK English users
 */
export async function initialiseTaskTracking(): Promise<void> {
  // Simply call the US spelling variant to maintain code consistency
  return initializeTaskTracking();
}