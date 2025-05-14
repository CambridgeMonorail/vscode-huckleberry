/**
 * Utilities for handling command parameters and user input
 */
import * as vscode from 'vscode';
import { TaskPriority, Task, TaskCollection } from '../types';
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
 * Interface for VS Code UI interactions
 * This makes it easier to mock in tests
 */
export interface UIProvider {
  showInformationMessage(message: string): Thenable<string | undefined>;
  showErrorMessage(message: string): Thenable<string | undefined>;
  showQuickPick<T extends vscode.QuickPickItem>(
    items: T[], 
    options: vscode.QuickPickOptions
  ): Thenable<T | undefined>;
  showInputBox(options: vscode.InputBoxOptions): Thenable<string | undefined>;
  showOpenDialog(options: vscode.OpenDialogOptions): Thenable<vscode.Uri[] | undefined>;
}

/**
 * Interface for task data operations
 */
export interface TaskDataProvider {
  getTasksData(toolManager: ToolManager, tasksJsonPath: string): Promise<TaskCollection>;
  getWorkspacePaths(): Promise<{ workspaceFolder: string; tasksDir: string; tasksJsonPath: string }>;
}

/**
 * Default implementation of UIProvider using VS Code API
 */
export const defaultUIProvider: UIProvider = {
  showInformationMessage: vscode.window.showInformationMessage.bind(vscode.window),
  showErrorMessage: vscode.window.showErrorMessage.bind(vscode.window),
  showQuickPick: vscode.window.showQuickPick.bind(vscode.window),
  showInputBox: vscode.window.showInputBox.bind(vscode.window),
  showOpenDialog: vscode.window.showOpenDialog.bind(vscode.window),
};

/**
 * Default implementation of TaskDataProvider
 */
export const defaultTaskDataProvider: TaskDataProvider = {
  getTasksData: readTasksJson,
  getWorkspacePaths,
};

/**
 * Creates task quick pick items from task data
 * This pure function is easy to test
 */
export function createTaskQuickPickItems(tasks: Task[], excludeCompleted = false): TaskQuickPickItem[] {
  const availableTasks = excludeCompleted 
    ? tasks.filter(task => !task.completed)
    : tasks;
    
  return availableTasks.map(task => {
    const priorityIcon = task.priority ? priorityEmoji[task.priority] || '⚪' : '⚪';
    return {
      label: `${task.id}`,
      description: task.title,
      detail: `${priorityIcon} ${task.priority || 'medium'} priority${task.completed ? ' (completed)' : ''}`,
      taskId: task.id,
    };
  });
}

/**
 * Prompts the user to select a task
 * @param toolManager The tool manager instance
 * @param excludeCompleted Whether to exclude completed tasks from the list
 * @param uiProvider Custom UI provider for testing
 * @param taskDataProvider Custom task data provider for testing
 * @returns A promise that resolves with the selected task ID or undefined if cancelled
 */
export async function promptForTaskSelection(  toolManager: ToolManager, 
  excludeCompleted = false,
  uiProvider: UIProvider = defaultUIProvider,
  taskDataProvider: TaskDataProvider = defaultTaskDataProvider,
): Promise<string | undefined> {
  try {
    // Get workspace paths
    const { tasksJsonPath } = await taskDataProvider.getWorkspacePaths();
    
    // Read tasks.json
    const tasksData = await taskDataProvider.getTasksData(toolManager, tasksJsonPath);
    
    // Check if we have any tasks
    if (!tasksData.tasks || tasksData.tasks.length === 0) {
      await uiProvider.showInformationMessage('No tasks found. Create a task first.');
      return undefined;
    }
    
    // Filter tasks if needed
    const availableTasks = excludeCompleted 
      ? tasksData.tasks.filter(task => !task.completed)
      : tasksData.tasks;

    if (excludeCompleted && availableTasks.length === 0) {
      await uiProvider.showInformationMessage('No incomplete tasks found. All tasks are completed!');
      return undefined;
    }
    
    // Create quick pick items with task details
    const items = createTaskQuickPickItems(tasksData.tasks, excludeCompleted);
    
    // Show quick pick to select a task
    const selected = await uiProvider.showQuickPick(items, {
      placeHolder: 'Select a task',
      title: 'Huckleberry: Select Task',
    });
    
    return selected?.taskId;
  } catch (error) {
    logWithChannel(LogLevel.ERROR, 'Error prompting for task selection:', error);
    await uiProvider.showErrorMessage(`Failed to load tasks: ${error instanceof Error ? error.message : String(error)}`);
    return undefined;
  }
}

/**
 * Creates priority quick pick items
 * This pure function is easy to test
 */
export function createPriorityQuickPickItems(): vscode.QuickPickItem[] {
  return [
    { label: `${priorityEmoji.critical} Critical`, description: 'Urgent issues that need immediate attention' },
    { label: `${priorityEmoji.high} High`, description: 'Important tasks that should be done soon' },
    { label: `${priorityEmoji.medium} Medium`, description: 'Standard priority tasks' },
    { label: `${priorityEmoji.low} Low`, description: 'Tasks that can wait' },
  ];
}

/**
 * Extracts priority from label
 * This pure function is easy to test
 */
export function extractPriorityFromLabel(label: string): TaskPriority | undefined {
  const priorityMap: Record<string, TaskPriority> = {
    '⚠️ Critical': 'critical',
    '🔴 High': 'high',
    '🟠 Medium': 'medium',
    '🟢 Low': 'low',
  };
  
  return priorityMap[label];
}

/**
 * Prompts the user to select a priority
 * @param uiProvider Custom UI provider for testing
 * @returns A promise that resolves with the selected priority or undefined if cancelled
 */
export async function promptForPrioritySelection(
  uiProvider: UIProvider = defaultUIProvider,
): Promise<TaskPriority | undefined> {
  const items = createPriorityQuickPickItems();
  
  const selected = await uiProvider.showQuickPick(items, {
    placeHolder: 'Select a priority level',
    title: 'Huckleberry: Select Priority',
  });
  
  if (!selected) {
    return undefined;
  }
  
  return extractPriorityFromLabel(selected.label);
}

/**
 * Prompts the user to select both a task and a priority
 * @param toolManager The tool manager instance
 * @param uiProvider Custom UI provider for testing
 * @param taskDataProvider Custom task data provider for testing
 * @returns A promise that resolves with the selected task ID and priority or undefined if cancelled
 */
export async function promptForTaskAndPriority(
  toolManager: ToolManager,
  uiProvider: UIProvider = defaultUIProvider,
  taskDataProvider: TaskDataProvider = defaultTaskDataProvider,
): Promise<TaskSelectionResult> {
  const taskId = await promptForTaskSelection(toolManager, false, uiProvider, taskDataProvider);
  if (!taskId) {
    return {};
  }
  
  const priority = await promptForPrioritySelection(uiProvider);
  return { taskId, priority };
}

/**
 * Creates file pattern quick pick items
 * This pure function is easy to test
 */
export function createFilePatternQuickPickItems(): vscode.QuickPickItem[] {
  return [
    { label: 'All Files', description: 'Scan all files in the workspace' },
    { label: 'TypeScript Files', description: '**/*.ts', detail: 'Scan all TypeScript files' },
    { label: 'JavaScript Files', description: '**/*.js', detail: 'Scan all JavaScript files' },
    { label: 'React Files', description: '**/*.{jsx,tsx}', detail: 'Scan all React component files' },
    { label: 'Python Files', description: '**/*.py', detail: 'Scan all Python files' },
    { label: 'Custom Pattern', description: 'Enter a custom file pattern' },
  ];
}

/**
 * Prompts the user to enter a file pattern for TODO scanning
 * @param uiProvider Custom UI provider for testing
 * @returns A promise that resolves with the entered pattern or undefined if cancelled
 */
export async function promptForFilePattern(
  uiProvider: UIProvider = defaultUIProvider,
): Promise<string | undefined> {
  const options = createFilePatternQuickPickItems();
  
  const selected = await uiProvider.showQuickPick(options, {
    placeHolder: 'Select files to scan',
    title: 'Huckleberry: Scan Files',
  });
  
  if (!selected) {
    return undefined;
  }
  
  if (selected.label === 'Custom Pattern') {
    return await uiProvider.showInputBox({
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
 * Creates document filters for open dialog
 * This pure function is easy to test
 */
export function createDocumentFilters(): { [key: string]: string[] } {
  return {
    'Markdown': ['md', 'markdown'], 
    'Text': ['txt'], 
    'HTML': ['html', 'htm'],
    'All Files': ['*'],
  };
}

/**
 * Prompts the user to select a document to parse for requirements
 * @param uiProvider Custom UI provider for testing
 * @returns A promise that resolves with the selected file path or undefined if cancelled
 */
export async function promptForDocumentSelection(
  uiProvider: UIProvider = defaultUIProvider,
): Promise<string | undefined> {
  try {
    const filters = createDocumentFilters();
    
    // Show open dialog to select a file
    const fileUri = await uiProvider.showOpenDialog({
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
    await uiProvider.showErrorMessage(`Failed to select document: ${error instanceof Error ? error.message : String(error)}`);
    return undefined;
  }
}

/**
 * Creates help topic quick pick items
 * This pure function is easy to test
 */
export function createHelpTopicQuickPickItems(): Array<vscode.QuickPickItem & { value: string }> {
  return [
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
}

/**
 * Prompts the user to select a help topic
 * @param uiProvider Custom UI provider for testing
 * @returns A promise that resolves with the selected topic or undefined if cancelled
 */
export async function promptForHelpTopic(
  uiProvider: UIProvider = defaultUIProvider,
): Promise<string | undefined> {
  const topics = createHelpTopicQuickPickItems();
  
  const selected = await uiProvider.showQuickPick(topics, {
    placeHolder: 'Select a help topic',
    title: 'Huckleberry: Help Topics',
  });
  
  return selected ? selected.value : undefined;
}