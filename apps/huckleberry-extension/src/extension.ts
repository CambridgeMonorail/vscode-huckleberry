import * as vscode from 'vscode';
import * as path from 'path';

// Import the tools
import { ReadFileTool } from './tools/ReadFileTool';
import { WriteFileTool } from './tools/WriteFileTool';
import { MarkDoneTool } from './tools/MarkDoneTool';

// Import task data types
import { Task, TaskPriority, TaskCollection, TaskMasterConfig } from './types';

// Default configuration for the Task Manager
const DEFAULT_CONFIG: TaskMasterConfig = {
  defaultTasksLocation: 'tasks',
  taskFileTemplate: 'markdown',
  defaultTaskPriority: 'medium'
};

// System prompt for the Task Manager assistant
const SYSTEM_PROMPT = `You are the Huckleberry Task Manager, a specialized assistant that helps users manage tasks and project requirements.
Your responsibilities include:
- Helping users track their tasks and project status
- Creating, updating, and organizing tasks
- Providing summaries and reports on project progress
- Offering suggestions for task prioritization

Always be concise, helpful, and focus on task management. If asked about topics unrelated to task management,
politely redirect the conversation back to task-related discussions.`;

/**
 * Tool manager to handle tool registration and execution
 */
class ToolManager {
  private tools: Map<string, any> = new Map();
  
  /**
   * Register a tool with the manager
   * @param tool The tool to register
   */
  public registerTool(tool: any): void {
    this.tools.set(tool.id, tool);
    console.log(`Registered tool: ${tool.id}`);
  }
  
  /**
   * Get a tool by ID
   * @param id The tool ID to retrieve
   * @returns The tool instance or undefined if not found
   */
  public getTool(id: string): any | undefined {
    return this.tools.get(id);
  }
  
  /**
   * Execute a tool by ID with the provided parameters
   * @param id The ID of the tool to execute
   * @param params Parameters to pass to the tool
   * @returns The result of the tool execution
   */
  public async executeTool(id: string, params: any): Promise<any> {
    const tool = this.getTool(id);
    if (!tool) {
      throw new Error(`Tool not found: ${id}`);
    }
    
    return await tool.execute(params);
  }

  /**
   * Get all registered tools
   * @returns Array of all registered tools
   */
  public getTools(): any[] {
    return Array.from(this.tools.values());
  }
}

/**
 * Interface for our extended chat request with command support
 */
interface Command {
  name: string;
  args?: Record<string, any>;
}

// Create our own response finish type since VS Code doesn't export this
interface ResponseFinishType {
  success: boolean;
  message?: string;
}

/**
 * Handle chat requests for the Task Manager
 * @param request The chat request
 * @param context The chat context
 * @param stream The response stream
 * @param token Cancellation token
 * @param toolManager The tool manager instance
 */
async function handleChatRequest(
  request: vscode.ChatRequest, 
  context: vscode.ChatContext, 
  stream: vscode.ChatResponseStream,
  token: vscode.CancellationToken,
  toolManager: ToolManager
): Promise<void> {
  try {
    console.log(`Task Manager received request: ${request.prompt}`);

    // Process command if present
    const commandMatch = request.prompt.match(/\/(\w+)(?:\s+(.*))?$/);
    if (commandMatch) {
      const commandName = commandMatch[1];
      if (commandName === 'manageTasks') {
        await stream.markdown('Opening task management interface...');
        vscode.commands.executeCommand('huckleberry-extension.manageTasks');
        await stream.markdown('Task management interface opened.');
        return;
      }
    }

    // Process regular chat request
    await stream.markdown('Processing your request about tasks...');

    // Determine the intent of the request
    const lowerPrompt = request.prompt.toLowerCase();
    if (lowerPrompt.includes('read') || lowerPrompt.includes('show') || 
        lowerPrompt.includes('list') || lowerPrompt.includes('get')) {
      await handleReadTasksRequest(request.prompt, stream, toolManager);
    } else if (lowerPrompt.includes('create') || lowerPrompt.includes('add') || 
               lowerPrompt.includes('new')) {
      await handleCreateTaskRequest(request.prompt, stream, toolManager);
    } else if (lowerPrompt.includes('done') || lowerPrompt.includes('complete') || 
               lowerPrompt.includes('mark')) {
      await handleMarkTaskDoneRequest(request.prompt, stream, toolManager);
    } else {
      await stream.markdown('I can help you manage your tasks. You can ask me to:');
      await stream.markdown('- List your tasks');
      await stream.markdown('- Create new tasks');
      await stream.markdown('- Mark tasks as done or undone');
      await stream.markdown('- Generate reports on your project progress');
    }
  } catch (error) {
    console.error('Task Manager error:', error);
    await stream.markdown(`**Error**: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Handler for reading tasks requests
 * @param prompt The user's prompt
 * @param stream The response stream
 * @param toolManager The tool manager for accessing tools
 */
async function handleReadTasksRequest(
  prompt: string, 
  stream: vscode.ChatResponseStream, 
  toolManager: ToolManager
): Promise<void> {
  await stream.markdown('I\'m working on reading your tasks...');
  
  // For now, use a placeholder implementation
  await stream.markdown('Feature coming soon! In the future, I\'ll be able to read and display your tasks from files.');
  await stream.markdown('You can create task files in Markdown format with checkboxes or JSON files with task objects.');
}

/**
 * Handler for creating task requests
 * @param prompt The user's prompt
 * @param stream The response stream
 * @param toolManager The tool manager for accessing tools
 */
async function handleCreateTaskRequest(
  prompt: string, 
  stream: vscode.ChatResponseStream, 
  toolManager: ToolManager
): Promise<void> {
  await stream.markdown('I\'m working on creating a new task for you...');
  
  // For now, use a placeholder implementation
  await stream.markdown('Feature coming soon! In the future, I\'ll be able to create new tasks and save them to files.');
  await stream.markdown('You can specify details like title, description, priority, and due date.');
}

/**
 * Handler for marking tasks done requests
 * @param prompt The user's prompt
 * @param stream The response stream
 * @param toolManager The tool manager for accessing tools
 */
async function handleMarkTaskDoneRequest(
  prompt: string, 
  stream: vscode.ChatResponseStream, 
  toolManager: ToolManager
): Promise<void> {
  await stream.markdown('I\'m working on updating your task status...');
  
  // For now, use a placeholder implementation
  await stream.markdown('Feature coming soon! In the future, I\'ll be able to mark tasks as done or undone in your task files.');
  await stream.markdown('You\'ll be able to reference tasks by title, ID, or description.');
}

/**
 * Command handler for the manageTasks command
 */
function manageTasks(): void {
  vscode.window.showInformationMessage('Task management interface will be implemented soon!');
}

/**
 * Get the extension configuration
 * @returns The Task Manager configuration
 */
function getConfiguration(): TaskMasterConfig {
  const config = vscode.workspace.getConfiguration('huckleberry.taskMaster');
  
  // Fix for TaskPriority issue
  const defaultPriority = (config.get('defaultTaskPriority') || DEFAULT_CONFIG.defaultTaskPriority) as string;
  const taskPriority = defaultPriority as TaskPriority;
  
  return {
    defaultTasksLocation: config.get('defaultTasksLocation') || DEFAULT_CONFIG.defaultTasksLocation,
    taskFileTemplate: (config.get('taskFileTemplate') || DEFAULT_CONFIG.taskFileTemplate) as 'markdown' | 'json',
    defaultTaskPriority: taskPriority,
    defaultDueDate: config.get('defaultDueDate'),
    customDueDateDays: config.get('customDueDateDays')
  };
}

/**
 * Activates the extension
 * @param context The extension context
 */
export function activate(context: vscode.ExtensionContext): void {
  console.log('Huckleberry Task Manager extension is now active!');

  // Create and register tools
  const toolManager = new ToolManager();
  const readFileTool = new ReadFileTool();
  const writeFileTool = new WriteFileTool();
  const markDoneTool = new MarkDoneTool();
  
  toolManager.registerTool(readFileTool);
  toolManager.registerTool(writeFileTool);
  toolManager.registerTool(markDoneTool);

  // Register the hello world command
  const helloWorldDisposable = vscode.commands.registerCommand('huckleberry-extension.helloWorld', () => {
    vscode.window.showInformationMessage('Hello from Huckleberry Task Manager!');
  });

  // Register the manage tasks command
  const manageTasksDisposable = vscode.commands.registerCommand('huckleberry-extension.manageTasks', manageTasks);

  // Register the chat participant with the correct VS Code API
  const taskMasterDisposable = vscode.chat.createChatParticipant(
    'huckleberry-extension.taskmaster',
    async (request: vscode.ChatRequest, context: vscode.ChatContext, response: vscode.ChatResponseStream, token: vscode.CancellationToken) => {
      return handleChatRequest(request, context, response, token, toolManager);
    }
  );

  // Add all disposables to the context subscriptions
  context.subscriptions.push(helloWorldDisposable);
  context.subscriptions.push(manageTasksDisposable);
  context.subscriptions.push(taskMasterDisposable);
}

/**
 * Deactivates the extension
 */
export function deactivate(): void {
  // Clean up resources when the extension is deactivated
}
