/**
 * Service for registering and managing language model tools
 */
import * as vscode from 'vscode';
import { ToolManager } from './toolManager';
import { logWithChannel, LogLevel } from '../utils/debugUtils';
import { isWorkspaceAvailable, notifyNoWorkspace } from '../handlers/chatHandler';

// Import task handlers
import {
  handleInitializeTaskTracking,
  handleCreateTaskRequest,
  handlePriorityTaskQuery,
  handleMarkTaskDoneRequest,
  handleParseRequirementsRequest,
  handleReadTasksRequest,
  handleChangeTaskPriorityRequest,
  handleScanTodosRequest
} from '../handlers/taskHandlers';

/**
 * Response stream wrapper for tool results
 */
class ToolResponseStream {
  private result: string[] = [];
  
  /**
   * Creates a new ToolResponseStream
   */
  constructor() {}

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
    return this.result.join("\n");
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
 * Service for registering language model tools
 */
export class LanguageModelToolsProvider {
  private toolManager: ToolManager;
  private disposables: vscode.Disposable[] = [];
  private initialized: boolean = false;

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
          async invoke(options, token) {
            const input = options.input as TaskWithPriorityInput;
            const description = input?.description;
            const priority = input?.priority;
            
            if (!isWorkspaceAvailable()) {
              notifyNoWorkspace();
              return {
                content: [{
                  text: "No workspace available. Please open a workspace to use this tool."
                }]
              };
            }
            
            if (!description) {
              return {
                content: [{
                  text: "A task description is required."
                }]
              };
            }
            
            try {
              const stream = new ToolResponseStream();
              // Construct a prompt that the existing handler can understand
              const prompt = priority 
                ? `Create a ${priority} priority task to ${description}`
                : `Create a task to ${description}`;
                
              await handleCreateTaskRequest(prompt, stream as any, toolManager, priority || null);
              return {
                content: [{
                  text: stream.getResult()
                }]
              };
            } catch (error) {
              logWithChannel(LogLevel.ERROR, 'Error in createTask tool:', error);
              return { 
                content: [{
                  text: `Failed to create task: ${error instanceof Error ? error.message : String(error)}`
                }]
              };
            }
          }
        });
        this.disposables.push(createTaskDisposable);
        logWithChannel(LogLevel.DEBUG, '✓ create_task registered successfully');
      } catch (error) {
        logWithChannel(LogLevel.ERROR, 'Failed to register create_task tool:', error);
        throw error; // Re-throw to handle in the main try/catch
      }

      // Initialize Task Tracking tool
      try {
        logWithChannel(LogLevel.DEBUG, 'Registering initialize_task_tracking tool...');
        const initializeToolDisposable = vscode.lm.registerTool('initialize_task_tracking', {
          async invoke(options, token) {
            if (!isWorkspaceAvailable()) {
              notifyNoWorkspace();
              return {
                content: [{
                  text: "No workspace available. Please open a workspace to use this tool."
                }]
              };
            }
            
            try {
              const stream = new ToolResponseStream();
              await handleInitializeTaskTracking(stream as any, toolManager);
              return {
                content: [{
                  text: stream.getResult()
                }]
              };
            } catch (error) {
              logWithChannel(LogLevel.ERROR, 'Error in initializeTaskTracking tool:', error);
              return {
                content: [{
                  text: `Failed to initialize task tracking: ${error instanceof Error ? error.message : String(error)}`
                }]
              };
            }
          }
        });
        this.disposables.push(initializeToolDisposable);
        logWithChannel(LogLevel.DEBUG, '✓ initialize_task_tracking registered successfully');
      } catch (error) {
        logWithChannel(LogLevel.ERROR, 'Failed to register initialize_task_tracking tool:', error);
        throw error;
      }

      // Scan TODOs tool
      this.disposables.push(
        vscode.lm.registerTool('scan_todos', {
          async invoke(options, token) {
            if (!isWorkspaceAvailable()) {
              notifyNoWorkspace();
              return {
                content: [{
                  text: "No workspace available. Please open a workspace to use this tool."
                }]
              };
            }
            
            try {
              const input = options.input as ScanTodosInput;
              const pattern = input?.pattern;
              const stream = new ToolResponseStream();
              // Construct a prompt that the existing handler can understand
              const prompt = pattern 
                ? `Scan for TODOs in ${pattern}` 
                : 'Scan for TODOs in the codebase';
                
              await handleScanTodosRequest(prompt, stream as any, toolManager);
              return {
                content: [{
                  text: stream.getResult()
                }]
              };
            } catch (error) {
              logWithChannel(LogLevel.ERROR, 'Error in scanTodos tool:', error);
              return {
                content: [{
                  text: `Failed to scan for TODOs: ${error instanceof Error ? error.message : String(error)}`
                }]
              };
            }
          }
        })
      );

      // List Tasks tool
      this.disposables.push(
        vscode.lm.registerTool('list_tasks', {
          async invoke(options, token) {
            if (!isWorkspaceAvailable()) {
              notifyNoWorkspace();
              return {
                content: [{
                  text: "No workspace available. Please open a workspace to use this tool."
                }]
              };
            }
            
            try {
              const input = options.input as ListTasksInput;
              const priority = input?.priority;
              const status = input?.status;
              const stream = new ToolResponseStream();
              
              // Construct a prompt that the existing handler can understand
              let prompt = 'List all tasks';
              if (priority) {
                prompt = `What tasks are ${priority} priority?`;
              }
              if (status) {
                prompt += ` with status ${status}`;
              }
                
              await handleReadTasksRequest(prompt, stream as any, toolManager);
              return {
                content: [{
                  text: stream.getResult()
                }]
              };
            } catch (error) {
              logWithChannel(LogLevel.ERROR, 'Error in listTasks tool:', error);
              return {
                content: [{
                  text: `Failed to list tasks: ${error instanceof Error ? error.message : String(error)}`
                }]
              };
            }
          }
        })
      );

      // Mark Task Done tool
      this.disposables.push(
        vscode.lm.registerTool('mark_task_done', {
          async invoke(options, token) {
            if (!isWorkspaceAvailable()) {
              notifyNoWorkspace();
              return {
                content: [{
                  text: "No workspace available. Please open a workspace to use this tool."
                }]
              };
            }
            
            try {
              const input = options.input as TaskIdInput;
              const taskId = input?.taskId;
              
              if (!taskId) {
                return {
                  content: [{
                    text: "A task ID is required."
                  }]
                };
              }
              
              const stream = new ToolResponseStream();
              
              // Construct a prompt that the existing handler can understand
              const prompt = `Mark task ${taskId} as complete`;
                
              await handleMarkTaskDoneRequest(prompt, stream as any, toolManager);
              return {
                content: [{
                  text: stream.getResult()
                }]
              };
            } catch (error) {
              logWithChannel(LogLevel.ERROR, 'Error in markTaskDone tool:', error);
              return {
                content: [{
                  text: `Failed to mark task as done: ${error instanceof Error ? error.message : String(error)}`
                }]
              };
            }
          }
        })
      );

      // Change Task Priority tool
      this.disposables.push(
        vscode.lm.registerTool('change_task_priority', {
          async invoke(options, token) {
            if (!isWorkspaceAvailable()) {
              notifyNoWorkspace();
              return {
                content: [{
                  text: "No workspace available. Please open a workspace to use this tool."
                }]
              };
            }
            
            try {
              const input = options.input as TaskPriorityChangeInput;
              const taskId = input?.taskId;
              const priority = input?.priority;
              
              if (!taskId || !priority) {
                return {
                  content: [{
                    text: "Both task ID and priority are required."
                  }]
                };
              }
              
              const stream = new ToolResponseStream();
              
              // Construct a prompt that the existing handler can understand
              const prompt = `Mark task ${taskId} as ${priority} priority`;
                
              await handleChangeTaskPriorityRequest(prompt, stream as any, toolManager);
              return {
                content: [{
                  text: stream.getResult()
                }]
              };
            } catch (error) {
              logWithChannel(LogLevel.ERROR, 'Error in changeTaskPriority tool:', error);
              return {
                content: [{
                  text: `Failed to change task priority: ${error instanceof Error ? error.message : String(error)}`
                }]
              };
            }
          }
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
}