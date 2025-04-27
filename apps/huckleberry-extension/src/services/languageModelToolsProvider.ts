/**
 * Service for registering and managing language model tools
 */
import * as vscode from 'vscode';
import { ToolManager } from './toolManager';
import { logWithChannel, LogLevel } from '../utils/debugUtils';
import { isWorkspaceAvailable, notifyNoWorkspace } from '../handlers/chatHandler';
import { getConfiguration } from '../config/index';
import { getWorkspacePaths, readTasksJson, writeTasksJson } from '../handlers/tasks/taskUtils';

// Import task handlers
import {
  handleInitializeTaskTracking,
  handleCreateTaskRequest,
  handleMarkTaskDoneRequest,
  handleReadTasksRequest,
  handleChangeTaskPriorityRequest,
  handleScanTodosRequest,
} from '../handlers/taskHandlers';

// Importing unused handlers but prefixing with underscore to indicate they're intentionally imported but not used directly
import {
  handleParseRequirementsRequest as _handleParseRequirementsRequest,
  handlePriorityTaskQuery as _handlePriorityTaskQuery,
} from '../handlers/taskHandlers';

/**
 * Enhanced error logging utility
 * @param area The area/component where the error occurred
 * @param error The error object
 * @param additionalInfo Optional additional context information
 */
export function logDetailedError(area: string, error: unknown, additionalInfo?: Record<string, unknown>): void {
  let errorMessage = 'Unknown error';
  let errorStack = '';
  let errorObject: Record<string, unknown> = {};

  if (error instanceof Error) {
    errorMessage = error.message;
    errorStack = error.stack || '';
    errorObject = {
      name: error.name,
      message: error.message,
      stack: error.stack,
      ...Object.getOwnPropertyNames(error).reduce((acc, prop) => {
        // Convert Error to unknown first to avoid type errors
        acc[prop] = (error as unknown as Record<string, unknown>)[prop];
        return acc;
      }, {} as Record<string, unknown>),
    };
  } else if (typeof error === 'string') {
    errorMessage = error;
  } else {
    try {
      errorMessage = JSON.stringify(error);
      errorObject = error as Record<string, unknown>;
    } catch (e) {
      errorMessage = 'Error cannot be stringified';
    }
  }

  logWithChannel(LogLevel.ERROR, `[${area}] Error: ${errorMessage}`);
  if (errorStack) {
    logWithChannel(LogLevel.DEBUG, `[${area}] Stack: ${errorStack}`);
  }

  logWithChannel(LogLevel.DEBUG, `[${area}] Error details:`, errorObject);

  if (additionalInfo) {
    logWithChannel(LogLevel.DEBUG, `[${area}] Additional context:`, additionalInfo);
  }
}

// Define a comprehensive interface for ChatResponseStream to ensure compatibility
interface ChatResponseStreamLike {
  markdown(content: string): Promise<void>;
  progress(message: string): Promise<void>;
  anchor(value: vscode.Uri | vscode.Location, title?: string): void;
  button(command: vscode.Command): void;
  reference(value: vscode.Uri | vscode.Location, iconPath?: vscode.IconPath): void;
  filetree(value: vscode.ChatResponseFileTree[], baseUri: vscode.Uri): void;
  push(part: vscode.ChatResponsePart): void;
}

/**
 * Response stream wrapper for tool results
 */
class ToolResponseStream {
  private result: string[] = [];

  /**
   * Creates a new ToolResponseStream
   * Empty constructor is intentional - no initialization needed
   */
  constructor() {
    // No initialization needed
  }

  /**
   * Adds markdown content to the stream
   * @param content Markdown content
   * @returns Promise that resolves when content is added
   */
  public async markdown(content: string): Promise<void> {
    this.result.push(content);
  }

  /**
   * Gets the accumulated result as a string
   * @returns The accumulated tool result
   */
  public getResult(): string {
    return this.result.join('\n');
  }

  /**
   * Progress method implementation to match the expected interface
   * @param _message Progress message
   * @returns Promise that resolves when progress is updated
   */
  public async progress(_message: string): Promise<void> {
    // Silently ignore progress updates for now
    return Promise.resolve();
  }

  /**
   * Empty implementation for anchor method
   */
  public anchor(_value: vscode.Uri | vscode.Location, _title?: string): void {
    // No-op implementation
  }

  /**
   * Empty implementation for button method
   */
  public button(_command: vscode.Command): void {
    // No-op implementation
  }

  /**
   * Empty implementation for reference method
   */
  public reference(_value: vscode.Uri | vscode.Location, _iconPath?: vscode.IconPath): void {
    // No-op implementation
  }

  /**
   * Empty implementation for filetree method
   */
  public filetree(_value: vscode.ChatResponseFileTree[], _baseUri: vscode.Uri): void {
    // No-op implementation
  }

  /**
   * Empty implementation for push method
   */
  public push(_part: vscode.ChatResponsePart): void {
    // No-op implementation
  }
}

/**
 * Type definition for tool input parameters with priority
 */
interface TaskWithPriorityInput {
  description?: string;
  priority?: string;
}

/**
 * Type definition for scanning TODOs input
 */
interface ScanTodosInput {
  pattern?: string;
}

/**
 * Type definition for listing tasks input
 */
interface ListTasksInput {
  priority?: string;
  status?: string;
}

/**
 * Type definition for task ID input
 */
interface TaskIdInput {
  taskId?: string;
}

/**
 * Type definition for task priority change input
 */
interface TaskPriorityChangeInput {
  taskId?: string;
  priority?: string;
}

/**
 * Checks if task tracking is initialized in the current workspace
 * @returns A promise resolving to true if initialized, false otherwise
 */
async function isTaskTrackingInitialized(): Promise<boolean> {
  try {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      logWithChannel(LogLevel.DEBUG, 'Task tracking initialization check failed: No workspace folders');
      return false;
    }

    const { tasksDir, tasksJsonPath } = await getWorkspacePaths();

    // Check for required files/directories using try/catch with await instead of Promise chains
    let tasksJsonExists = false;
    let tasksDirExists = false;

    try {
      // Check if tasks.json exists
      const _tasksJsonStat = await vscode.workspace.fs.stat(vscode.Uri.file(tasksJsonPath));
      tasksJsonExists = true;
    } catch (_error) {
      // File doesn't exist or is inaccessible
      tasksJsonExists = false;
    }

    try {
      // Check if tasks directory exists and is actually a directory
      const tasksDirStat = await vscode.workspace.fs.stat(vscode.Uri.file(tasksDir));
      tasksDirExists = tasksDirStat.type === vscode.FileType.Directory;
    } catch (_error) {
      // Directory doesn't exist or is inaccessible
      tasksDirExists = false;
    }

    const isInitialized = tasksJsonExists && tasksDirExists;
    logWithChannel(LogLevel.DEBUG, `Task tracking initialization check: ${isInitialized ? 'Initialized' : 'Not initialized'}`);
    logWithChannel(LogLevel.DEBUG, `- tasks.json exists: ${tasksJsonExists}`);
    logWithChannel(LogLevel.DEBUG, `- tasks/ directory exists: ${tasksDirExists}`);

    return isInitialized;
  } catch (error) {
    logDetailedError('isTaskTrackingInitialized', error);
    return false;
  }
}

/**
 * Service for registering language model tools
 */
export class LanguageModelToolsProvider {
  private toolManager: ToolManager;
  private disposables: vscode.Disposable[] = [];
  private initialized = false;

  /**
   * Creates a new LanguageModelToolsProvider
   * @param toolManager The tool manager instance
   */
  constructor(toolManager: ToolManager) {
    this.toolManager = toolManager;
  }

  /**
   * Registers all language model tools
   * @param context Extension context for registration
   * @returns Array of disposables for all registered tools
   */
  public registerAllTools(context: vscode.ExtensionContext): vscode.Disposable[] {
    if (this.initialized) {
      logWithChannel(LogLevel.WARN, 'LanguageModelToolsProvider already initialized, skipping registration');
      return this.disposables;
    }

    logWithChannel(LogLevel.INFO, '🔧 Registering language model tools for Huckleberry');

    try {
      // Store reference to toolManager for use in the closures
      const toolManager = this.toolManager;

      // Explicitly check for and log VS Code API availability
      if (!vscode.lm || typeof vscode.lm.registerTool !== 'function') {
        throw new Error('VS Code Language Model Tools API not available');
      }

      // Create Task tool
      try {
        logWithChannel(LogLevel.DEBUG, 'Registering create_task tool...');
        const createTaskDisposable = vscode.lm.registerTool('create_task', {
          prepareInvocation(options, _token): vscode.ProviderResult<vscode.PreparedToolInvocation> {
            const input = options.input as TaskWithPriorityInput;
            const description = input?.description;
            const priority = input?.priority;

            // Create user-friendly confirmation message
            const priorityText = priority ? `with **${priority}** priority` : '';

            return {
              confirmationMessages: {
                title: 'Create Task',
                message: new vscode.MarkdownString(
                  `**Create a new task**\n\n` +
                  `Task Description: "${description}"\n` +
                  (priorityText ? `Priority: ${priorityText}\n` : '')
                ),
              },
              invocationMessage: `Creating task: ${description}`,
            };
          },

          async invoke(options, _token) {
            const input = options.input as TaskWithPriorityInput;
            const description = input?.description;
            const priority = input?.priority;

            if (!isWorkspaceAvailable()) {
              notifyNoWorkspace();
              throw new Error('No workspace available. Please open a workspace to use this tool.');
            }

            if (!description) {
              throw new Error('A task description is required to create a task.');
            }

            try {
              // Check if task tracking has been initialized
              const isInitialized = await isTaskTrackingInitialized();
              if (!isInitialized) {
                throw new Error('Task tracking has not been initialized in this workspace. Please run "Initialize Task Tracking" first.');
              }

              const stream = new ToolResponseStream();
              // Construct a prompt that the existing handler can understand
              const prompt = priority
                ? `Create a ${priority} priority task to ${description}`
                : `Create a task to ${description}`;

              await handleCreateTaskRequest(prompt, stream as ChatResponseStreamLike, toolManager, priority || null);

              // Use VS Code's recommended LanguageModelToolResult format
              return new vscode.LanguageModelToolResult([
                new vscode.LanguageModelTextPart(stream.getResult()),
              ]);
            } catch (error) {
              // Enhanced error logging with details
              logDetailedError('createTask', error, {
                description,
                priority,
                workspaceAvailable: isWorkspaceAvailable(),
              });

              throw new Error(`Failed to create task: ${error instanceof Error ? error.message : String(error)}`);
            }
          },
        });
        this.disposables.push(createTaskDisposable);
        logWithChannel(LogLevel.DEBUG, '✓ create_task registered successfully');
      } catch (error) {
        logWithChannel(LogLevel.ERROR, 'Failed to register create_task tool:', error);
        throw error; // Re-throw to handle in the main try/catch
      }

      // Initialize Task Tracking tool
      try {
        logWithChannel(LogLevel.DEBUG, 'Registering initialize_tracking tool...');
        const initializeToolDisposable = vscode.lm.registerTool('initialize_tracking', {
          prepareInvocation(options, _token): vscode.ProviderResult<vscode.PreparedToolInvocation> {
            const config = getConfiguration();

            // Get the potential tasks directory location for better context
            let tasksLocation: string;
            try {
              const folders = vscode.workspace.workspaceFolders;
              if (folders && folders.length > 0) {
                const workspaceFolder = folders[0].uri.fsPath;
                tasksLocation = `${workspaceFolder}/${config.defaultTasksLocation}`;
              } else {
                tasksLocation = `<workspace>/${config.defaultTasksLocation}`;
              }
            } catch (error) {
              tasksLocation = `<workspace>/${config.defaultTasksLocation}`;
            }

            // Return a PreparedToolInvocation object with confirmationMessages as required by VS Code API
            return {
              confirmationMessages: {
                title: 'Initialize Task Tracking',
                message: new vscode.MarkdownString(
                  `**Initialize Task Tracking**\n\n` +
                  `This will set up task tracking in your workspace by:\n\n` +
                  `- Creating a \`${config.defaultTasksLocation}\` directory\n` +
                  `- Adding \`tasks.json\` for storing task metadata\n` +
                  `- Setting up a README with usage instructions\n\n` +
                  `Location: \`${tasksLocation}\``
                ),
              },
              invocationMessage: `Initializing task tracking in ${config.defaultTasksLocation}...`,
            };
          },

          async invoke(_options, _token) {
            if (!isWorkspaceAvailable()) {
              notifyNoWorkspace();
              throw new Error('No workspace available. Please open a workspace to use this tool.');
            }

            try {
              // Create a custom stream to collect output from the handler
              const stream = new ToolResponseStream();

              // Process the task initialization
              await handleInitializeTaskTracking(stream as ChatResponseStreamLike, toolManager);

              // Get the workspace folder and task directory for the result message
              const { tasksDir } = await getWorkspacePaths();

              // Use VS Code's recommended LanguageModelToolResult format
              return new vscode.LanguageModelToolResult([
                new vscode.LanguageModelTextPart(
                  `✅ Task tracking initialized successfully in ${tasksDir}\n\n` +
                  stream.getResult()
                ),
              ]);
            } catch (_error) {
              logWithChannel(LogLevel.ERROR, 'Error in initializeTaskTracking tool:', _error);
              throw new Error(
                `Failed to initialize task tracking: ${_error instanceof Error ? _error.message : String(_error)}. ` +
                `Make sure you have write access to the workspace directory.`
              );
            }
          },
        });
        this.disposables.push(initializeToolDisposable);
        logWithChannel(LogLevel.DEBUG, '✓ initialize_tracking registered successfully');
      } catch (error) {
        logWithChannel(LogLevel.ERROR, 'Failed to register initialize_tracking tool:', error);
        throw error;
      }

      // British spelling alias for Initialize Task Tracking tool
      try {
        logWithChannel(LogLevel.DEBUG, 'Registering initialise_tracking tool (British spelling alias)...');
        const initialiseToolDisposable = vscode.lm.registerTool('initialise_tracking', {
          prepareInvocation(options, _token): vscode.ProviderResult<vscode.PreparedToolInvocation> {
            const config = getConfiguration();

            // Get the potential tasks directory location for better context
            let tasksLocation: string;
            try {
              const folders = vscode.workspace.workspaceFolders;
              if (folders && folders.length > 0) {
                const workspaceFolder = folders[0].uri.fsPath;
                tasksLocation = `${workspaceFolder}/${config.defaultTasksLocation}`;
              } else {
                tasksLocation = `<workspace>/${config.defaultTasksLocation}`;
              }
            } catch (error) {
              tasksLocation = `<workspace>/${config.defaultTasksLocation}`;
            }

            // Return a PreparedToolInvocation object with confirmationMessages as required by VS Code API
            return {
              confirmationMessages: {
                title: 'Initialise Task Tracking',
                message: new vscode.MarkdownString(
                  `**Initialise Task Tracking**\n\n` +
                  `This will set up task tracking in your workspace by:\n\n` +
                  `- Creating a \`${config.defaultTasksLocation}\` directory\n` +
                  `- Adding \`tasks.json\` for storing task metadata\n` +
                  `- Setting up a README with usage instructions\n\n` +
                  `Location: \`${tasksLocation}\``
                ),
              },
              invocationMessage: `Initialising task tracking in ${config.defaultTasksLocation}...`,
            };
          },

          async invoke(_options, _token) {
            if (!isWorkspaceAvailable()) {
              notifyNoWorkspace();
              throw new Error('No workspace available. Please open a workspace to use this tool.');
            }

            try {
              // Create a custom stream to collect output from the handler
              const stream = new ToolResponseStream();

              // Process the task initialization
              await handleInitializeTaskTracking(stream as ChatResponseStreamLike, toolManager);

              // Get the workspace folder and task directory for the result message
              const { tasksDir } = await getWorkspacePaths();

              // Use VS Code's recommended LanguageModelToolResult format
              return new vscode.LanguageModelToolResult([
                new vscode.LanguageModelTextPart(
                  `✅ Task tracking initialised successfully in ${tasksDir}\n\n` +
                  stream.getResult()
                ),
              ]);
            } catch (_error) {
              logWithChannel(LogLevel.ERROR, 'Error in initialiseTaskTracking tool:', _error);
              throw new Error(
                `Failed to initialise task tracking: ${_error instanceof Error ? _error.message : String(_error)}. ` +
                `Make sure you have write access to the workspace directory.`
              );
            }
          },
        });
        this.disposables.push(initialiseToolDisposable);
        logWithChannel(LogLevel.DEBUG, '✓ initialise_tracking registered successfully');
      } catch (error) {
        logWithChannel(LogLevel.ERROR, 'Failed to register initialise_tracking tool:', error);
        throw error;
      }

      // Scan TODOs tool
      this.disposables.push(
        vscode.lm.registerTool('scan_todos', {
          prepareInvocation(options, _token): vscode.ProviderResult<vscode.PreparedToolInvocation> {
            const input = options.input as ScanTodosInput;
            const pattern = input?.pattern;

            return {
              confirmationMessages: {
                title: 'Scan TODOs',
                message: new vscode.MarkdownString(
                  `**Scan Codebase for TODOs**\n\n` +
                  `This will scan your codebase for TODO comments and convert them to tasks.\n\n` +
                  (pattern ? `File pattern: \`${pattern}\`` : 'All files will be scanned')
                ),
              },
              invocationMessage: pattern
                ? `Scanning for TODOs with pattern: ${pattern}`
                : 'Scanning entire codebase for TODOs',
            };
          },

          async invoke(options, _token) {
            if (!isWorkspaceAvailable()) {
              notifyNoWorkspace();
              throw new Error('No workspace available. Please open a workspace to use this tool.');
            }

            try {
              const input = options.input as ScanTodosInput;
              const pattern = input?.pattern;
              const stream = new ToolResponseStream();

              // Construct a prompt that the existing handler can understand
              const prompt = pattern
                ? `Scan for TODOs in ${pattern}`
                : 'Scan for TODOs in the codebase';

              await handleScanTodosRequest(prompt, stream as ChatResponseStreamLike, toolManager);

              // Use VS Code's recommended LanguageModelToolResult format
              return new vscode.LanguageModelToolResult([
                new vscode.LanguageModelTextPart(stream.getResult()),
              ]);
            } catch (error) {
              logWithChannel(LogLevel.ERROR, 'Error in scanTodos tool:', error);
              throw new Error(
                `Failed to scan for TODOs: ${error instanceof Error ? error.message : String(error)}. ` +
                `Make sure the workspace is accessible and you have permission to read files.`
              );
            }
          },
        })
      );

      // List Tasks tool
      this.disposables.push(
        vscode.lm.registerTool('list_tasks', {
          prepareInvocation(options, _token): vscode.ProviderResult<vscode.PreparedToolInvocation> {
            const input = options.input as ListTasksInput;
            const priority = input?.priority;
            const status = input?.status;

            // Format the filter information for user-friendly display
            let filterInfo = '';
            if (priority && priority !== 'all') {
              filterInfo += `Priority: **${priority}**`;
            }
            if (status && status !== 'all') {
              filterInfo += filterInfo ? `\nStatus: **${status}**` : `Status: **${status}**`;
            }

            return {
              confirmationMessages: {
                title: 'List Tasks',
                message: new vscode.MarkdownString(
                  `**List Tasks**\n\n` +
                  `This will retrieve and display your project tasks.` +
                  (filterInfo ? `\n\n**Filters:**\n${filterInfo}` : '\n\nAll tasks will be listed.')
                ),
              },
              invocationMessage: 'Retrieving task list...',
            };
          },

          async invoke(options, _token) {
            if (!isWorkspaceAvailable()) {
              notifyNoWorkspace();
              throw new Error('No workspace available. Please open a workspace to use this tool.');
            }

            try {
              const input = options.input as ListTasksInput;
              const priority = input?.priority;
              const status = input?.status;
              const stream = new ToolResponseStream();

              // Construct a prompt that the existing handler can understand
              let prompt = 'List all tasks';
              if (priority && priority !== 'all') {
                prompt = `What tasks are ${priority} priority?`;
              }
              if (status && status !== 'all') {
                prompt += ` with status ${status}`;
              }

              await handleReadTasksRequest(prompt, stream as ChatResponseStreamLike, toolManager);

              // Use VS Code's recommended LanguageModelToolResult format
              return new vscode.LanguageModelToolResult([
                new vscode.LanguageModelTextPart(stream.getResult()),
              ]);
            } catch (error) {
              logWithChannel(LogLevel.ERROR, 'Error in listTasks tool:', error);
              throw new Error(
                `Failed to list tasks: ${error instanceof Error ? error.message : String(error)}. ` +
                `Make sure task tracking has been initialized.`
              );
            }
          },
        })
      );

      // Mark Task Done tool
      this.disposables.push(
        vscode.lm.registerTool('mark_task_done', {
          prepareInvocation(options, _token): vscode.ProviderResult<vscode.PreparedToolInvocation> {
            const input = options.input as TaskIdInput;
            const taskId = input?.taskId;

            return {
              confirmationMessages: {
                title: 'Mark Task Complete',
                message: new vscode.MarkdownString(
                  `**Mark Task Complete**\n\n` +
                  `This will mark task **${taskId}** as completed.\n\n` +
                  `*Note: This action cannot be undone through the tool.*`
                ),
              },
              invocationMessage: `Marking task ${taskId} as complete...`,
            };
          },

          async invoke(options, _token) {
            if (!isWorkspaceAvailable()) {
              notifyNoWorkspace();
              throw new Error('No workspace available. Please open a workspace to use this tool.');
            }

            try {
              const input = options.input as TaskIdInput;
              const taskId = input?.taskId;

              if (!taskId) {
                throw new Error('A task ID is required to mark a task as complete.');
              }

              const stream = new ToolResponseStream();

              // Construct a prompt that the existing handler can understand
              const prompt = `Mark task ${taskId} as complete`;

              await handleMarkTaskDoneRequest(prompt, stream as ChatResponseStreamLike, toolManager);

              // Use VS Code's recommended LanguageModelToolResult format
              return new vscode.LanguageModelToolResult([
                new vscode.LanguageModelTextPart(stream.getResult()),
              ]);
            } catch (error) {
              logWithChannel(LogLevel.ERROR, 'Error in markTaskDone tool:', error);
              throw new Error(
                `Failed to mark task as done: ${error instanceof Error ? error.message : String(error)}. ` +
                `Make sure the task exists and task tracking has been initialized.`
              );
            }
          },
        })
      );

      // Change Task Priority tool
      this.disposables.push(
        vscode.lm.registerTool('update_task_priority', {
          prepareInvocation(options, _token): vscode.ProviderResult<vscode.PreparedToolInvocation> {
            const input = options.input as TaskPriorityChangeInput;
            const taskId = input?.taskId;
            const priority = input?.priority;

            return {
              confirmationMessages: {
                title: 'Change Task Priority',
                message: new vscode.MarkdownString(
                  `**Change Task Priority**\n\n` +
                  `This will set the priority of task **${taskId}** to **${priority}**.\n\n` +
                  `The task's status and other properties will remain unchanged.`
                ),
              },
              invocationMessage: `Changing priority of task ${taskId} to ${priority}...`,
            };
          },

          async invoke(options, _token) {
            if (!isWorkspaceAvailable()) {
              notifyNoWorkspace();
              throw new Error('No workspace available. Please open a workspace to use this tool.');
            }

            try {
              const input = options.input as TaskPriorityChangeInput;
              const taskId = input?.taskId;
              const priority = input?.priority;

              if (!taskId || !priority) {
                throw new Error("Both task ID and priority are required to change a task's priority.");
              }

              const stream = new ToolResponseStream();

              // Construct a prompt that the existing handler can understand
              const prompt = `Mark task ${taskId} as ${priority} priority`;

              await handleChangeTaskPriorityRequest(prompt, stream as ChatResponseStreamLike, toolManager);

              // Use VS Code's recommended LanguageModelToolResult format
              return new vscode.LanguageModelToolResult([
                new vscode.LanguageModelTextPart(stream.getResult()),
              ]);
            } catch (error) {
              logWithChannel(LogLevel.ERROR, 'Error in changeTaskPriority tool:', error);
              throw new Error(
                `Failed to change task priority: ${error instanceof Error ? error.message : String(error)}. ` +
                `Make sure the task exists and task tracking has been initialized.`
              );
            }
          },
        })
      );

      // Prioritize Tasks tool
      this.disposables.push(
        vscode.lm.registerTool('prioritize_tasks', {
          prepareInvocation(_options, _token): vscode.ProviderResult<vscode.PreparedToolInvocation> {
            return {
              confirmationMessages: {
                title: 'Prioritize Tasks',
                message: new vscode.MarkdownString(
                  `**Prioritize Tasks**\n\n` +
                  `This will sort your tasks in the following order:\n\n` +
                  `1. Open tasks before completed tasks\n` +
                  `2. By priority: critical → high → medium → low\n\n` +
                  `The sorting will be applied to your tasks.json file.`
                ),
              },
              invocationMessage: `Prioritizing tasks by status and priority...`,
            };
          },

          async invoke(_options, _token) {
            if (!isWorkspaceAvailable()) {
              notifyNoWorkspace();
              throw new Error('No workspace available. Please open a workspace to use this tool.');
            }

            try {
              // Create a stream for collecting output
              const stream = new ToolResponseStream();

              // Import and call the handler dynamically to avoid circular dependencies
              const { handlePrioritizeTasksRequest } = require('../handlers/tasks/taskPrioritizer');
              await handlePrioritizeTasksRequest('Prioritize tasks', stream as ChatResponseStreamLike, toolManager);

              // Return the results
              return new vscode.LanguageModelToolResult([
                new vscode.LanguageModelTextPart(stream.getResult()),
              ]);
            } catch (error) {
              logWithChannel(LogLevel.ERROR, 'Error in prioritizeTasks tool:', error);
              throw new Error(
                `Failed to prioritize tasks: ${error instanceof Error ? error.message : String(error)}. ` +
                `Make sure task tracking has been initialized.`
              );
            }
          },
        })
      );

      // Next Task tool
      this.disposables.push(
        vscode.lm.registerTool('next_task', {
          prepareInvocation(_options, _token): vscode.ProviderResult<vscode.PreparedToolInvocation> {
            return {
              confirmationMessages: {
                title: 'Get Next Task',
                message: new vscode.MarkdownString(
                  `**Get Next Task Recommendation**\n\n` +
                  `This will analyze your task list and recommend the next task to work on ` +
                  `based on priority and status.`
                ),
              },
              invocationMessage: `Finding the next task you should work on...`,
            };
          },

          async invoke(_options, _token) {
            if (!isWorkspaceAvailable()) {
              notifyNoWorkspace();
              throw new Error('No workspace available. Please open a workspace to use this tool.');
            }

            try {
              // Create a stream for collecting output
              const stream = new ToolResponseStream();

              // Import and call the handler dynamically to avoid circular dependencies
              const { handleNextTaskRequest } = require('../handlers/tasks/nextTaskHandler');
              await handleNextTaskRequest('What task should I work on next?', stream as ChatResponseStreamLike, toolManager);

              // Return the results
              return new vscode.LanguageModelToolResult([
                new vscode.LanguageModelTextPart(stream.getResult()),
              ]);
            } catch (error) {
              logWithChannel(LogLevel.ERROR, 'Error in nextTask tool:', error);
              throw new Error(
                `Failed to get next task recommendation: ${error instanceof Error ? error.message : String(error)}. ` +
                `Make sure task tracking has been initialized.`
              );
            }
          },
        })
      );

      // Help tool
      this.disposables.push(
        vscode.lm.registerTool('help', {
          prepareInvocation(options, _token): vscode.ProviderResult<vscode.PreparedToolInvocation> {
            const input = options.input as { topic?: string };
            const topic = input?.topic || 'general';

            let topicDisplay = 'General Help';
            if (topic !== 'general') {
              // Convert kebab-case to Title Case
              topicDisplay = topic.split('-')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
            }

            return {
              confirmationMessages: {
                title: `Huckleberry Help: ${topicDisplay}`,
                message: new vscode.MarkdownString(
                  `**Get Huckleberry Task Manager Help**\n\n` +
                  `This will show information about ${topic === 'general' ?
                    'all available features and commands' :
                    `how to use the ${topicDisplay} feature`}.`
                ),
              },
              invocationMessage: `Showing help for ${topicDisplay}...`,
            };
          },

          async invoke(options, _token) {
            try {
              // Get the optional topic
              const input = options.input as { topic?: string };
              const topic = input?.topic || null;

              // Create a stream for collecting output
              const stream = new ToolResponseStream();

              // Import and call the handler dynamically to avoid circular dependencies
              const { handleHelpRequest } = require('../handlers/tasks/helpHandler');

              // Construct a specific prompt based on the topic
              let prompt = 'Help';
              if (topic && topic !== 'general') {
                // Map topic names to natural language prompts
                const topicPrompts: Record<string, string> = {
                  'task-creation': 'How do I create tasks?',
                  'task-listing': 'How do I list tasks?',
                  'task-completion': 'How do I mark tasks as complete?',
                  'task-priority': 'How do I change task priorities?',
                  'todo-scanning': 'Help with scanning TODOs',
                  'requirements-parsing': 'How do I parse requirements?',
                  'task-decomposition': 'How do I break down tasks into subtasks?',
                  'next-task': 'How do I find my next task?',
                  'task-initialization': 'How do I initialize task tracking?',
                };

                prompt = topicPrompts[topic] || `Help with ${topic.replace(/-/g, ' ')}`;
              }

              await handleHelpRequest(prompt, stream as ChatResponseStreamLike, toolManager);

              // Return the results
              return new vscode.LanguageModelToolResult([
                new vscode.LanguageModelTextPart(stream.getResult()),
              ]);
            } catch (error) {
              logWithChannel(LogLevel.ERROR, 'Error in help tool:', error);
              throw new Error(`Failed to get help information: ${error instanceof Error ? error.message : String(error)}`);
            }
          },
        })
      );

      // Register all disposables with the extension context
      this.disposables.forEach(disposable => {
        context.subscriptions.push(disposable);
      });

      this.initialized = true;
      logWithChannel(LogLevel.INFO, `✅ Successfully registered ${this.disposables.length} language model tools`);
      return [...this.disposables];
    } catch (error) {
      logWithChannel(LogLevel.CRITICAL, '❌ Failed to register language model tools:', error);
      throw error;
    }
  }

  /**
   * Disposes all registered tools
   */
  public dispose(): void {
    logWithChannel(LogLevel.INFO, `Disposing ${this.disposables.length} language model tools`);
    this.disposables.forEach(disposable => disposable.dispose());
    this.disposables = [];
    this.initialized = false;
  }

  /**
   * Tool implementation for prioritizing tasks
   */
  private async prioritizeTasks(): Promise<Record<string, unknown>> {
    logWithChannel(LogLevel.INFO, '🔄 LM Tool: prioritize_tasks');

    // Ensure task tracking is initialized
    if (!(await isTaskTrackingInitialized())) {
      return {
        error: 'Task tracking is not initialized. Please initialize task tracking first.',
      };
    }

    try {
      // Read the current tasks collection
      const { workspaceFolder, tasksDir, tasksJsonPath } = await getWorkspacePaths();
      const tasksData = await readTasksJson(this.toolManager, tasksJsonPath);

      // Check if we have tasks to prioritize
      if (!tasksData.tasks || tasksData.tasks.length === 0) {
        return {
          message: 'No tasks found to prioritize.',
        };
      }

      // Count tasks before prioritizing
      const totalTasks = tasksData.tasks.length;
      const openTasks = tasksData.tasks.filter(task => !task.completed).length;
      const completedTasks = totalTasks - openTasks;

      // Sort tasks by status and then priority
      tasksData.tasks.sort((a, b) => {
        // First sort by completion status (incomplete tasks first)
        if (a.completed !== b.completed) {
          return a.completed ? 1 : -1;
        }

        // For tasks with the same completion status, sort by priority
        const priorityOrder: Record<string, number> = {
          critical: 0,
          high: 1,
          medium: 2,
          low: 3,
        };
        const priorityA = priorityOrder[a.priority?.toLowerCase() || 'medium'] || 2;
        const priorityB = priorityOrder[b.priority?.toLowerCase() || 'medium'] || 2;

        return priorityA - priorityB;
      });

      // Write back the prioritized tasks
      await writeTasksJson(this.toolManager, tasksJsonPath, tasksData);

      // Return success with task counts
      return {
        message: `Successfully prioritized ${totalTasks} tasks (${openTasks} open, ${completedTasks} completed)`,
        sortedBy: ['status (open tasks before completed)', 'priority (critical → high → medium → low)'],
        taskCount: {
          total: totalTasks,
          open: openTasks,
          completed: completedTasks,
        },
      };
    } catch (error) {
      logWithChannel(LogLevel.ERROR, 'Error prioritizing tasks:', error);
      return {
        error: `Failed to prioritize tasks: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }
}