/**
 * Command handler for initializing task tracking
 */
import * as vscode from 'vscode';
import { isWorkspaceAvailable, notifyNoWorkspace } from '../chatHandler';
import { logWithChannel, LogLevel } from '../../utils/debugUtils';
import { checkCopilotAvailability } from '../../utils/copilotHelper';
import { handleInitializeTaskTracking } from '../tasks/initHandler';
import { getExtensionState } from '../../services/extensionStateService';

/**
 * Command handler for initializing task tracking (US spelling)
 */
export async function initializeTaskTracking(): Promise<void> {
  try {
    logWithChannel(LogLevel.DEBUG, '🎯 Entering initializeTaskTracking command handler');
    
    if (!isWorkspaceAvailable()) {
      logWithChannel(LogLevel.DEBUG, '❌ No workspace available');
      notifyNoWorkspace();
      return;
    }
    logWithChannel(LogLevel.DEBUG, '✓ Workspace is available');

    // Check for Copilot availability before proceeding
    logWithChannel(LogLevel.DEBUG, '🔍 Checking Copilot availability...');
    if (!(await checkCopilotAvailability())) {
      logWithChannel(LogLevel.DEBUG, '❌ Copilot is not available');
      return;
    }
    logWithChannel(LogLevel.DEBUG, '✓ Copilot is available');

    logWithChannel(LogLevel.INFO, '🎯 Command: Initialize Task Tracking');

    // Get the extension state to access the tool manager
    logWithChannel(LogLevel.DEBUG, '🔍 Getting extension state and tool manager');
    const state = getExtensionState();
    if (!state) {
      logWithChannel(LogLevel.ERROR, '❌ Extension state is undefined');
      throw new Error('Extension state is undefined');
    }
    if (!state.toolManager) {
      logWithChannel(LogLevel.ERROR, '❌ Tool manager is undefined in extension state');
      throw new Error('Extension not properly initialized: toolManager is undefined');
    }
    logWithChannel(LogLevel.DEBUG, '✓ Extension state and tool manager available');

    // Create stream for capturing output
    logWithChannel(LogLevel.DEBUG, '🔄 Creating ChatResponseStream');
    const outputAccumulator: string[] = [];
    const stream = new class implements vscode.ChatResponseStream {
      push(_part: unknown): void { 
        logWithChannel(LogLevel.DEBUG, '🔹 Stream push called with:', _part);
        if (_part && typeof _part === 'object' && 'value' in _part) {
          const value = (_part as { value: unknown }).value;
          if (value instanceof vscode.MarkdownString) {
            outputAccumulator.push(value.value);
          } else if (typeof value === 'string') {
            outputAccumulator.push(value);
          }
        }
      }
      
      append(content: string): void {
        logWithChannel(LogLevel.DEBUG, '🔹 Stream append called:', content);
        outputAccumulator.push(content);
      }
      appendLine(line: string): void {
        logWithChannel(LogLevel.DEBUG, '🔹 Stream appendLine called:', line);
        outputAccumulator.push(line + '\n');
      }
      replace(_content: string): void {
        logWithChannel(LogLevel.DEBUG, '🔹 Stream replace called:', _content);
      }
      progress(): void {
        logWithChannel(LogLevel.DEBUG, '🔹 Stream progress called');
      }
      end(): void {
        logWithChannel(LogLevel.DEBUG, '🔹 Stream end called');
      }
      error(error: Error): void {
        logWithChannel(LogLevel.ERROR, '❌ Stream error:', error);
        throw error;
      }
      markdown(markdown: string): void {
        logWithChannel(LogLevel.DEBUG, '🔹 Stream markdown called:', markdown);
        outputAccumulator.push(markdown);
      }
      anchor(value: vscode.Uri | vscode.Location, _title?: string): void {
        logWithChannel(LogLevel.DEBUG, '🔹 Stream anchor called:', value);
        outputAccumulator.push(value instanceof vscode.Uri ? value.fsPath : value.uri.fsPath);
      }
      button(command: vscode.Command): void {
        logWithChannel(LogLevel.DEBUG, '🔹 Stream button called:', command);
        if (command.title) { outputAccumulator.push(command.title); }
      }
      filetree(items: vscode.ChatResponseFileTree[], _baseUri: vscode.Uri): void {
        logWithChannel(LogLevel.DEBUG, '🔹 Stream filetree called:', items);
        items.forEach(item => {
          if (typeof item === 'object' && 'name' in item) {
            outputAccumulator.push(String(item.name));
          }
        });
      }
      reference(value: vscode.Uri | vscode.Location, _iconPath?: vscode.Uri | { light: vscode.Uri; dark: vscode.Uri }): void {
        logWithChannel(LogLevel.DEBUG, '🔹 Stream reference called:', value);
        outputAccumulator.push(value instanceof vscode.Uri ? value.fsPath : value.uri.fsPath);
      }
      table(headerRow: string[], bodyRows: string[][]): void {
        logWithChannel(LogLevel.DEBUG, '🔹 Stream table called:', { headerRow, bodyRows });
        outputAccumulator.push(headerRow.join(' | '));
        outputAccumulator.push('-'.repeat(headerRow.length * 3));
        bodyRows.forEach(row => outputAccumulator.push(row.join(' | ')));
      }
    };

    try {
      // Call the initialization handler directly
      await handleInitializeTaskTracking('Initialize task tracking', stream, state.toolManager);
      
      // Show success message and accumulated output
      const output = outputAccumulator.join('\n');
      if (output) {
        logWithChannel(LogLevel.INFO, 'Initialization output:', output);
      }
      vscode.window.showInformationMessage('Task tracking initialized successfully!');
    } catch (error) {
      logWithChannel(LogLevel.ERROR, 'Error in handleInitializeTaskTracking:', error);
      throw error; // Re-throw to be caught by outer try-catch
    }
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