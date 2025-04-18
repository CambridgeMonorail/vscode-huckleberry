/**
 * Task handlers facade module
 * Re-exports all task handler functionality from the new modular structure
 */
import * as vscode from 'vscode';
import { ToolManager } from '../services/toolManager';
import { handleParseRequirementsRequest as parseRequirementsHandler } from './tasks/requirementsHandler';

// Re-export everything from the tasks module
export * from './tasks';

/**
 * Handler for parsing requirements and creating tasks
 * @param prompt The user's prompt text
 * @param stream The chat response stream for output
 * @param toolManager The tool manager for accessing VS Code APIs
 */
export async function handleParseRequirementsRequest(
  prompt: string, 
  stream: vscode.ChatResponseStream, 
  toolManager: ToolManager
): Promise<void> {
  // Forward to the dedicated handler implementation
  await parseRequirementsHandler(prompt, stream, toolManager);
}