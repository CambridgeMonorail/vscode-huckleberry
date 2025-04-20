/**
 * Task handler utilities for common operations
 */
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs/promises';
import { Task, TaskCollection, TaskPriority, TaskStatus } from '../../types';
import { getConfiguration } from '../../config/index';
import { ToolManager } from '../../services/toolManager';
import { streamMarkdown } from '../../utils/uiHelpers';
import { logWithChannel, LogLevel } from '../../utils/debugUtils';

/**
 * Interface for the priority emoji mapping
 */
interface PriorityEmojiMap {
  high: string;
  medium: string;
  low: string;
  critical: string;
  [key: string]: string;
}

/**
 * Emoji mapping for different task priorities
 */
export const priorityEmoji: PriorityEmojiMap = {
  high: '🔴',
  medium: '🟠',
  low: '🟢',
  critical: '⚠️'
};

/**
 * Gets the workspace folder paths
 * @returns Object containing workspace folder information
 * @throws Error if no workspace folder is open
 */
export async function getWorkspacePaths(): Promise<{
  workspaceFolder: string;
  tasksDir: string;
  tasksJsonPath: string;
}> {
  const folders = vscode.workspace.workspaceFolders;
  
  if (!folders || folders.length === 0) {
    throw new Error('No workspace folder is open');
  }

  const config = getConfiguration();
  const workspaceFolder = folders[0].uri.fsPath;
  const tasksDir = path.join(workspaceFolder, config.defaultTasksLocation);
  const tasksJsonPath = path.join(tasksDir, 'tasks.json');
  
  return { workspaceFolder, tasksDir, tasksJsonPath };
}

/**
 * Reads the tasks.json file or creates a new one if it doesn't exist
 * @param toolManager The tool manager instance
 * @param tasksJsonPath Path to tasks.json
 * @returns Promise resolving to the task collection
 */
export async function readTasksJson(
  toolManager: ToolManager,
  tasksJsonPath: string
): Promise<TaskCollection> {
  const readFileTool = toolManager.getTool('readFile');

  try {
    let content: string;

    if (readFileTool) {
      // Try to read with the tool first
      content = await readFileTool.execute({ path: tasksJsonPath }) as string;
    } else {
      // Fallback to direct file system API
      logWithChannel(LogLevel.WARN, 'ReadFileTool not found, using fs API directly');
      content = await fs.readFile(tasksJsonPath, 'utf8');
    }

    return JSON.parse(content);
  } catch (error) {
    // Log the error but don't fail - we'll create a new structure
    logWithChannel(LogLevel.DEBUG, `Could not read tasks.json (${tasksJsonPath}), will create new structure:`, error);
    
    // If file doesn't exist or is invalid, create new structure
    return {
      name: 'Project Tasks',
      description: 'Task collection for the project',
      tasks: []
    };
  }
}

/**
 * Writes content to the tasks.json file
 * @param toolManager The tool manager instance
 * @param tasksJsonPath Path to tasks.json
 * @param tasksData The task collection data to write
 */
export async function writeTasksJson(
  toolManager: ToolManager,
  tasksJsonPath: string,
  tasksData: TaskCollection
): Promise<void> {
  const writeFileTool = toolManager.getTool('writeFile');
  const content = JSON.stringify(tasksData, null, 2);
  
  try {
    if (writeFileTool) {
      // Use the tool if available
      await writeFileTool.execute({
        path: tasksJsonPath,
        content,
        createParentDirectories: true
      });
      logWithChannel(LogLevel.DEBUG, `Tasks JSON written to ${tasksJsonPath} using WriteFileTool`);
    } else {
      // Fallback to direct file system API
      logWithChannel(LogLevel.WARN, 'WriteFileTool not found, using fs API directly');
      
      // Ensure directory exists
      const dirPath = path.dirname(tasksJsonPath);
      await vscode.workspace.fs.createDirectory(vscode.Uri.file(dirPath));
      
      // Write the file
      await fs.writeFile(tasksJsonPath, content, 'utf8');
      logWithChannel(LogLevel.DEBUG, `Tasks JSON written to ${tasksJsonPath} using fs API`);
    }
  } catch (error) {
    logWithChannel(LogLevel.ERROR, `Failed to write tasks.json to ${tasksJsonPath}:`, error);
    throw new Error(`Failed to write tasks.json: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Creates a new task ID
 * @returns A unique task ID in the format TASK-XXX
 */
export function generateTaskId(): string {
  return `TASK-${Math.floor(Math.random() * 900) + 100}`;
}

/**
 * Creates a new task object
 * @param id Task ID
 * @param title Task title/description
 * @param priority Task priority
 * @param additionalProps Additional task properties
 * @returns A new Task object
 */
export function createTaskObject(
  id: string,
  title: string,
  priority: TaskPriority,
  additionalProps: Partial<Task> = {}
): Task {
  return {
    id,
    title,
    description: title,
    priority,
    status: 'todo' as TaskStatus,
    completed: false,
    createdAt: new Date().toISOString(),
    tags: [],
    ...additionalProps
  };
}

/**
 * Checks and recommends agent mode usage in chat responses if applicable
 * @param stream The chat response stream
 * @returns Promise resolving when recommendation is added (if needed)
 */
export async function recommendAgentModeInChat(stream: vscode.ChatResponseStream): Promise<void> {
  try {
    // Import dynamically to avoid circular dependencies
    const { detectCopilotMode } = await import('../../utils/copilotHelper');
    const modeInfo = await detectCopilotMode();
    
    // Only add recommendation if Copilot is available but not in agent mode
    if (modeInfo.isAvailable && !modeInfo.isAgentModeEnabled) {
      await streamMarkdown(stream, `
> **💡 Tip:** For the best experience with Huckleberry, try enabling GitHub Copilot's agent mode. 
> You can do this by running \`Huckleberry: Check Copilot Agent Mode\` from the command palette.
      `);
    }
  } catch (error) {
    // Silently ignore errors in recommendation logic
    console.warn('Error checking agent mode for recommendation:', error);
  }
}