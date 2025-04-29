/**
 * Utilities for handling command parameters and user input
 */
import * as vscode from 'vscode';
import { TaskPriority } from '../types';
import { getWorkspacePaths, readTasksJson, priorityEmoji } from '../handlers/tasks/taskUtils';
import { ToolManager } from '../services/toolManager';
import { logWithChannel, LogLevel } from './debugUtils';

/**
 * Represents a task quick pick item with additional metadata
 */
interface TaskQuickPickItem extends vscode.QuickPickItem {
  taskId: string,
}

/**
 * Represents the result of task selection with parameter collection
 */
interface TaskSelectionResult {
  taskId?: string,
  priority?: TaskPriority,
  pattern?: string,
  filePath?: string,
  topic?: string,
}

/**
 * Prompts the user to select a task
 * @param toolManager The tool manager instance
 * @param excludeCompleted Whether to exclude completed tasks from the list
 * @returns A promise that resolves with the selected task ID or undefined if cancelled
 */
export async function promptForTaskSelection(toolManager: ToolManager, excludeCompleted = false): Promise<string | undefined> {
  try {
    // Get workspace paths
    const { tasksJsonPath } = await getWorkspacePaths();
    
    // Read tasks.json
    const tasksData = await readTasksJson(toolManager, tasksJsonPath);
    
    // Check if we have any tasks
    if (!tasksData.tasks || tasksData.tasks.length === 0) {
      vscode.window.showInformationMessage('No tasks found. Create a task first.');
      return undefined;
    }
    
    // Filter tasks if needed
    const availableTasks = excludeCompleted 
      ? tasksData.tasks.filter(task => !task.completed)
      : tasksData.tasks;

    if (excludeCompleted && availableTasks.length === 0) {
      vscode.window.showInformationMessage('No incomplete tasks found. All tasks are completed!');
      return undefined;
    }
    
    // Create quick pick items with task details
    const items: TaskQuickPickItem[] = availableTasks.map(task => {
      const priorityIcon = task.priority ? priorityEmoji[task.priority] || '⚪' : '⚪';
      return {
        label: `${task.id}`,
        description: task.title,
        detail: `${priorityIcon} ${task.priority || 'medium'} priority${task.completed ? ' (completed)' : ''}`,
        taskId: task.id,
      };
    });
    
    // Show quick pick to select a task
    const selected = await vscode.window.showQuickPick(items, {
      placeHolder: 'Select a task',
      title: 'Huckleberry: Select Task',
    });
    
    return selected?.taskId;
  } catch (error) {
    logWithChannel(LogLevel.ERROR, 'Error prompting for task selection:', error);
    vscode.window.showErrorMessage(`Failed to load tasks: ${error instanceof Error ? error.message : String(error)}`);
    return undefined;
  }
}

/**
 * Prompts the user to select a priority
 * @returns A promise that resolves with the selected priority or undefined if cancelled
 */
export async function promptForPrioritySelection(): Promise<TaskPriority | undefined> {
  const items = [
    { label: `${priorityEmoji.critical} Critical`, description: 'Urgent issues that need immediate attention' },
    { label: `${priorityEmoji.high} High`, description: 'Important tasks that should be done soon' },
    { label: `${priorityEmoji.medium} Medium`, description: 'Standard priority tasks' },
    { label: `${priorityEmoji.low} Low`, description: 'Tasks that can wait' },
  ];
  
  const selected = await vscode.window.showQuickPick(items, {
    placeHolder: 'Select a priority level',
    title: 'Huckleberry: Select Priority',
  });
  
  if (!selected) {
    return undefined;
  }
  
  // Extract the priority from the label
  const priorityMap: Record<string, TaskPriority> = {
    '⚠️ Critical': 'critical',
    '🔴 High': 'high',
    '🟠 Medium': 'medium',
    '🟢 Low': 'low',
  };
  
  return priorityMap[selected.label] as TaskPriority;
}

/**
 * Prompts the user to select both a task and a priority
 * @param toolManager The tool manager instance
 * @returns A promise that resolves with the selected task ID and priority or undefined if cancelled
 */
export async function promptForTaskAndPriority(toolManager: ToolManager): Promise<TaskSelectionResult> {
  const taskId = await promptForTaskSelection(toolManager);
  if (!taskId) {
    return {};
  }
  
  const priority = await promptForPrioritySelection();
  return { taskId, priority };
}

/**
 * Prompts the user to enter a file pattern for TODO scanning
 * @returns A promise that resolves with the entered pattern or undefined if cancelled
 */
export async function promptForFilePattern(): Promise<string | undefined> {
  const options = [
    { label: 'All Files', description: 'Scan all files in the workspace' },
    { label: 'TypeScript Files', description: '**/*.ts', detail: 'Scan all TypeScript files' },
    { label: 'JavaScript Files', description: '**/*.js', detail: 'Scan all JavaScript files' },
    { label: 'React Files', description: '**/*.{jsx,tsx}', detail: 'Scan all React component files' },
    { label: 'Python Files', description: '**/*.py', detail: 'Scan all Python files' },
    { label: 'Custom Pattern', description: 'Enter a custom file pattern' },
  ];
  
  const selected = await vscode.window.showQuickPick(options, {
    placeHolder: 'Select files to scan',
    title: 'Huckleberry: Scan Files',
  });
  
  if (!selected) {
    return undefined;
  }
  
  if (selected.label === 'Custom Pattern') {
    return await vscode.window.showInputBox({
      prompt: 'Enter a glob pattern for files to scan (e.g., src/**/*.ts)',
      placeHolder: '**/*.{ts,js}',
      title: 'Huckleberry: Enter File Pattern',
    });
  } else if (selected.label === 'All Files') {
    return undefined;  // No pattern means scan all files
  } else {
    return selected.description;
  }
}

/**
 * Prompts the user to select a document to parse for requirements
 * @returns A promise that resolves with the selected file path or undefined if cancelled
 */
export async function promptForDocumentSelection(): Promise<string | undefined> {
  try {
    // Create a document filter for common requirement document types
    const filters: { [key: string]: string[] } = {
      'Markdown': ['md', 'markdown'], 
      'Text': ['txt'], 
      'HTML': ['html', 'htm'],
      'All Files': ['*'],
    };
    
    // Show open dialog to select a file
    const fileUri = await vscode.window.showOpenDialog({
      canSelectMany: false,
      openLabel: 'Select Requirements Document',
      filters,
    });
    
    if (fileUri && fileUri.length > 0) {
      return fileUri[0].fsPath;
    }
    
    return undefined;
  } catch (error) {
    logWithChannel(LogLevel.ERROR, 'Error prompting for document selection:', error);
    vscode.window.showErrorMessage(`Failed to select document: ${error instanceof Error ? error.message : String(error)}`);
    return undefined;
  }
}

/**
 * Prompts the user to select a help topic
 * @returns A promise that resolves with the selected topic or undefined if cancelled
 */
export async function promptForHelpTopic(): Promise<string | undefined> {
  const topics = [
    { label: 'Task Creation', value: 'task-creation', description: 'Creating and managing tasks' },
    { label: 'Task Listing', value: 'task-listing', description: 'Listing and filtering tasks' },
    { label: 'Task Completion', value: 'task-completion', description: 'Marking tasks as complete' },
    { label: 'Task Priority', value: 'task-priority', description: 'Setting and changing task priorities' },
    { label: 'TODO Scanning', value: 'todo-scanning', description: 'Scanning for TODOs in code' },
    { label: 'Requirements Parsing', value: 'requirements-parsing', description: 'Creating tasks from requirements docs' },
    { label: 'Task Decomposition', value: 'task-decomposition', description: 'Breaking tasks into subtasks' },
    { label: 'Next Task', value: 'next-task', description: 'Getting task recommendations' },
    { label: 'Task Initialization', value: 'task-initialization', description: 'Setting up task tracking' },
    { label: 'General Help', value: 'general', description: 'Overview of all features' },
  ];
  
  const selected = await vscode.window.showQuickPick(topics, {
    placeHolder: 'Select a help topic',
    title: 'Huckleberry: Help Topics',
  });
  
  return selected ? selected.value : undefined;
}