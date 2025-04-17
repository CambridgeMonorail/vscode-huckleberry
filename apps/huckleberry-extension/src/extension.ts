import * as vscode from 'vscode';
import * as path from 'path';

// Import the tools
import { ReadFileTool } from './tools/ReadFileTool';
import { WriteFileTool } from './tools/WriteFileTool';
import { MarkDoneTool } from './tools/MarkDoneTool';

// Import task data types
import { Task, TaskPriority, TaskCollection, taskmanagerConfig } from './types';

// Default configuration for Huckleberry
const DEFAULT_CONFIG: taskmanagerConfig = {
  defaultTasksLocation: 'tasks',
  taskFileTemplate: 'markdown',
  defaultTaskPriority: 'medium'
};

// System prompt for Huckleberry assistant
const SYSTEM_PROMPT = `You are Huckleberry, a specialized assistant that helps users manage tasks and project requirements.
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
 * Handle chat requests for Huckleberry
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
    console.log(`Huckleberry received request: ${request.prompt}`);

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
    const lowerPrompt = request.prompt.toLowerCase();
    
    // Handle README example commands
    if (lowerPrompt.includes('initialize task tracking')) {
      await handleInitializeTaskTracking(stream, toolManager);
    } else if (lowerPrompt.includes('create a task')) {
      await handleCreateTaskRequest(request.prompt, stream, toolManager);
    } else if (lowerPrompt.match(/what tasks are (\w+) priority/)) {
      await handlePriorityTaskQuery(request.prompt, stream, toolManager);
    } else if (lowerPrompt.match(/mark task .+ as complete/)) {
      await handleMarkTaskDoneRequest(request.prompt, stream, toolManager);
    } else if (lowerPrompt.match(/parse .+ and create tasks/)) {
      await handleParseRequirementsRequest(request.prompt, stream, toolManager);
    } else if (lowerPrompt.includes('read') || lowerPrompt.includes('show') || 
        lowerPrompt.includes('list') || lowerPrompt.includes('get')) {
      await handleReadTasksRequest(request.prompt, stream, toolManager);
    } else if (lowerPrompt.includes('create') || lowerPrompt.includes('add') || 
               lowerPrompt.includes('new')) {
      await handleCreateTaskRequest(request.prompt, stream, toolManager);
    } else if (lowerPrompt.includes('done') || lowerPrompt.includes('complete') || 
               lowerPrompt.includes('mark')) {
      await handleMarkTaskDoneRequest(request.prompt, stream, toolManager);
    } else {
      await stream.markdown('I can help you manage your tasks. Try commands like:');
      await stream.markdown('- Initialize task tracking for this project');
      await stream.markdown('- Create a task to [description]');
      await stream.markdown('- What tasks are high priority?');
      await stream.markdown('- Mark task TASK-123 as complete');
      await stream.markdown('- Parse requirements.md and create tasks');
    }
  } catch (error) {
    console.error('Huckleberry error:', error);
    await stream.markdown(`**Error**: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Handler for initializing task tracking
 * @param stream The response stream
 * @param toolManager The tool manager for accessing tools
 */
async function handleInitializeTaskTracking(
  stream: vscode.ChatResponseStream, 
  toolManager: ToolManager
): Promise<void> {
  await stream.markdown('📋 **Initializing task tracking for this project**');
  
  try {
    // Get the workspace folders
    const folders = vscode.workspace.workspaceFolders;
    if (!folders || folders.length === 0) {
      await stream.markdown('⚠️ No workspace folder is open. Please open a folder or workspace first.');
      return;
    }
    
    const config = getConfiguration();
    const workspaceFolder = folders[0].uri.fsPath;
    const tasksDir = path.join(workspaceFolder, config.defaultTasksLocation);
    
    await stream.markdown(`I'll set up task tracking in: \`${config.defaultTasksLocation}\``);
    
    // Create initial tasks file structure (placeholder)
    await stream.markdown('✅ Task tracking initialized!');
    await stream.markdown(`
Tasks will be stored in the \`${config.defaultTasksLocation}\` directory.
- Default task priority: **${config.defaultTaskPriority}**
- Task file format: **${config.taskFileTemplate}**
    
You can now create tasks and manage them through our chat interface.`);
  } catch (error) {
    console.error('Error initializing task tracking:', error);
    await stream.markdown(`❌ Failed to initialize task tracking: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Handler for queries about tasks with a specific priority
 * @param prompt The user's prompt
 * @param stream The response stream
 * @param toolManager The tool manager for accessing tools
 */
async function handlePriorityTaskQuery(
  prompt: string, 
  stream: vscode.ChatResponseStream, 
  toolManager: ToolManager
): Promise<void> {
  // Extract priority from the prompt
  let priority = "high";
  if (prompt.toLowerCase().includes("low priority")) {
    priority = "low";
  } else if (prompt.toLowerCase().includes("medium priority")) {
    priority = "medium";
  }

  await stream.markdown(`📋 **${priority.toUpperCase()} Priority Tasks**`);
  
  // Placeholder implementation - will be replaced with actual task retrieval
  if (priority === "high") {
    await stream.markdown(`
1. 🔴 **TASK-001**: Implement user authentication system
2. 🔴 **TASK-004**: Fix critical security vulnerability in data layer
    `);
  } else if (priority === "medium") {
    await stream.markdown(`
1. 🟠 **TASK-002**: Add unit tests for core components
2. 🟠 **TASK-005**: Update documentation for API endpoints
    `);
  } else {
    await stream.markdown(`
1. 🟢 **TASK-003**: Refactor utility functions
2. 🟢 **TASK-006**: Improve code comments for better readability
    `);
  }
  
  await stream.markdown(`
You can mark any task as complete with: \`@Huckleberry Mark task TASK-XXX as complete\`
  `);
}

/**
 * Handler for parsing requirements and creating tasks
 * @param prompt The user's prompt
 * @param stream The response stream
 * @param toolManager The tool manager for accessing tools
 */
async function handleParseRequirementsRequest(
  prompt: string, 
  stream: vscode.ChatResponseStream, 
  toolManager: ToolManager
): Promise<void> {
  // Extract filename from prompt
  const filenameMatch = prompt.match(/parse\s+(\S+)\s+and/i);
  const filename = filenameMatch ? filenameMatch[1] : "requirements.md";
  
  await stream.markdown(`🔍 **Parsing ${filename} for requirements**`);
  
  try {
    const folders = vscode.workspace.workspaceFolders;
    if (!folders || folders.length === 0) {
      await stream.markdown('⚠️ No workspace folder is open. Please open a folder or workspace first.');
      return;
    }
    
    await stream.markdown(`Looking for \`${filename}\` in your workspace...`);
    
    // Placeholder implementation - will be replaced with actual file parsing
    await stream.markdown(`
✅ I've analyzed \`${filename}\` and created the following tasks:

1. **TASK-007**: Implement user registration form [HIGH]
2. **TASK-008**: Create database schema for user profiles [MEDIUM]
3. **TASK-009**: Design password reset workflow [MEDIUM]
4. **TASK-010**: Add email verification functionality [LOW]

These tasks have been added to your task collection.
    `);
  } catch (error) {
    console.error('Error parsing requirements:', error);
    await stream.markdown(`❌ Failed to parse requirements: ${error instanceof Error ? error.message : String(error)}`);
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
  await stream.markdown('📋 **Your Tasks**');
  
  // Placeholder implementation - will be replaced with actual task retrieval
  await stream.markdown(`
1. 🔴 **TASK-001**: Implement user authentication system [HIGH]
2. 🟠 **TASK-002**: Add unit tests for core components [MEDIUM]
3. 🟢 **TASK-003**: Refactor utility functions [LOW]
4. 🔴 **TASK-004**: Fix critical security vulnerability [HIGH]
  `);
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
  // Extract task description from prompt
  const descriptionMatch = prompt.match(/create a task( to)?:?\s+(.+)/i);
  const description = descriptionMatch ? descriptionMatch[2].trim() : "New task";
  
  await stream.markdown(`✏️ **Creating new task**`);
  
  const config = getConfiguration();
  const priority = config.defaultTaskPriority;
  const taskId = `TASK-${Math.floor(Math.random() * 900) + 100}`; // Generate random 3-digit task ID
  
  await stream.markdown(`
✅ Task created successfully!

**${taskId}**: ${description}
- **Priority**: ${priority}
- **Status**: Open
- **Created**: ${new Date().toLocaleDateString()}

You can mark this task as complete with: \`@Huckleberry Mark task ${taskId} as complete\`
  `);
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
  // Extract task ID from prompt
  const taskIdMatch = prompt.match(/task\s+([A-Z]+-\d+)/i);
  const taskId = taskIdMatch ? taskIdMatch[1].toUpperCase() : "UNKNOWN";
  
  await stream.markdown(`✅ **Marking task ${taskId} as complete**`);
  
  // Placeholder implementation - will be replaced with actual task update
  await stream.markdown(`
Task **${taskId}** has been marked as complete.

Updated task details:
- **ID**: ${taskId}
- **Status**: ✅ Complete
- **Completed Date**: ${new Date().toLocaleDateString()}
  `);
}

/**
 * Command handler for the manageTasks command
 */
function manageTasks(): void {
  vscode.window.showInformationMessage('Task management interface will be implemented soon!');
}

/**
 * Get the extension configuration
 * @returns The Huckleberry configuration
 */
function getConfiguration(): taskmanagerConfig {
  const config = vscode.workspace.getConfiguration('huckleberry.taskmanager');
  
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
  console.log('Huckleberry extension is now active!');

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
    vscode.window.showInformationMessage('Hello from Huckleberry!');
  });

  // Register the manage tasks command
  const manageTasksDisposable = vscode.commands.registerCommand('huckleberry-extension.manageTasks', manageTasks);

  // Register the chat participant with the correct VS Code API
  const taskmanagerDisposable = vscode.chat.createChatParticipant(
    'huckleberry-extension.taskmanager',
    async (request: vscode.ChatRequest, context: vscode.ChatContext, response: vscode.ChatResponseStream, token: vscode.CancellationToken) => {
      return handleChatRequest(request, context, response, token, toolManager);
    }
  );

  // Add all disposables to the context subscriptions
  context.subscriptions.push(helloWorldDisposable);
  context.subscriptions.push(manageTasksDisposable);
  context.subscriptions.push(taskmanagerDisposable);
}

/**
 * Deactivates the extension
 */
export function deactivate(): void {
  // Clean up resources when the extension is deactivated
}
