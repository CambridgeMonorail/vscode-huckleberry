/**
 * Task handler utilities for common operations
 */
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs/promises';
import { Task, TaskCollection, TaskPriority, TaskStatus } from '../../types';
import { getConfiguration } from '../../config/index';
import { ToolManager } from '../../services/toolManager';
import { streamMarkdown as _streamMarkdown } from '../../utils/uiHelpers';
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
  critical: '⚠️',
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
  tasksJsonPath: string,
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
      tasks: [],
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
  tasksData: TaskCollection,
): Promise<void> {
  const writeFileTool = toolManager.getTool('writeFile');
  const content = JSON.stringify(tasksData, null, 2);

  try {
    if (writeFileTool) {
      // Use the tool if available
      await writeFileTool.execute({
        path: tasksJsonPath,
        content,
        createParentDirectories: true,
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
 * Extracts the numeric part of a task ID and returns it as a number
 * @param taskId The task ID string (e.g., "TASK-042")
 * @returns The numeric part as a number (e.g., 42), or 0 if parsing fails
 */
function extractTaskNumber(taskId: string): number {
  try {
    const match = taskId.match(/TASK-(\d+)/i);
    if (match && match[1]) {
      return parseInt(match[1], 10);
    }
  } catch (error) {
    logWithChannel(LogLevel.WARN, `Failed to parse task ID number from ${taskId}:`, error);
  }
  return 0;
}

/**
 * Finds the highest task ID number from the existing tasks
 * @param tasks Array of tasks to search through
 * @returns The highest task number found, or 0 if no valid task IDs exist
 */
function findHighestTaskNumber(tasks: Task[]): number {
  if (!tasks || tasks.length === 0) {
    return 0;
  }

  let highest = 0;
  for (const task of tasks) {
    const taskNumber = extractTaskNumber(task.id);
    if (taskNumber > highest) {
      highest = taskNumber;
    }
  }

  return highest;
}

/**
 * Creates a new task ID by incrementing the highest existing ID
 * @param tasksData Optional task collection to find the highest existing ID
 * @returns A sequential task ID in the format TASK-XXX with consistent digit formatting
 */
export function generateTaskId(tasksData?: TaskCollection): string {
  let nextNumber = 1; // Default start

  if (tasksData && tasksData.tasks) {
    // Find the highest existing task number and increment
    const highestNumber = findHighestTaskNumber(tasksData.tasks);
    nextNumber = highestNumber + 1;
  }

  // Determine the number of digits required for consistent formatting
  const digitCount = Math.max(3, String(nextNumber).length);
  return `TASK-${String(nextNumber).padStart(digitCount, '0')}`;
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
  additionalProps: Partial<Task> = {},
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
    ...additionalProps,
  };
}

/**
 * Finds a task by its ID in the task collection
 * @param tasksData The task collection to search within
 * @param taskId The task ID to look for
 * @returns The found task, or undefined if not found
 */
export function getTaskById(
  tasksData: TaskCollection,
  taskId: string,
): Task | undefined {
  // Normalize the task ID for comparison (uppercase)
  const normalizedTaskId = taskId.toUpperCase();

  // Find the task with the matching ID
  return tasksData.tasks.find(task => task.id.toUpperCase() === normalizedTaskId);
}

/**
 * Checks and recommends agent mode usage in chat responses if applicable
 * @param _stream The chat response stream
 * @returns Promise resolving when recommendation is added (if needed)
 */
export async function recommendAgentModeInChat(_stream: vscode.ChatResponseStream): Promise<void> {
  try {
    // Temporarily disabled based on user feedback that these notifications are annoying
    // Keep implementation for potential future re-enablement
    /*
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
    */

    // Just log that the recommendation was suppressed
    console.debug('Agent mode chat recommendation suppressed based on user feedback');
  } catch (error) {
    // Silently ignore errors in recommendation logic
    console.warn('Error checking agent mode for recommendation:', error);
  }
}