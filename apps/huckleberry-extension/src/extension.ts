import * as vscode from 'vscode';
import * as path from 'path';

// Import the tools
import { ReadFileTool } from './tools/ReadFileTool';
import { WriteFileTool } from './tools/WriteFileTool';
import { MarkDoneTool } from './tools/MarkDoneTool';

// Import task data types
import { Task, TaskPriority, TaskCollection, taskmanagerConfig } from './types';

/**
 * Utility function to stream markdown with consistent spacing
 * @param stream The chat response stream
 * @param content The markdown content to stream
 */
async function streamMarkdown(stream: vscode.ChatResponseStream, content: string): Promise<void> {
  // Add a newline before content if it doesn't start with one
  const spacedContent = content.startsWith('\n') ? content : '\n' + content;
  await stream.markdown(spacedContent);
}

/**
 * Utility function to show progress in a consistent and thematic way
 * @param stream The chat response stream
 * @returns A promise that resolves when the progress message is shown
 */
async function showProgress(stream: vscode.ChatResponseStream): Promise<void> {
  await stream.progress("I'll be your huckleberry");
}

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
        await streamMarkdown(stream, 'Opening task management interface...');
        vscode.commands.executeCommand('huckleberry-extension.manageTasks');
        await streamMarkdown(stream, 'Task management interface opened.');
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
      await streamMarkdown(stream, 'I can help you manage your tasks. Try commands like:');
      await streamMarkdown(stream, '- Initialize task tracking for this project');
      await streamMarkdown(stream, '- Create a task to [description]');
      await streamMarkdown(stream, '- What tasks are high priority?');
      await streamMarkdown(stream, '- Mark task TASK-123 as complete');
      await streamMarkdown(stream, '- Parse requirements.md and create tasks');
    }
  } catch (error) {
    console.error('Huckleberry error:', error);
    await streamMarkdown(stream, `**Error**: ${error instanceof Error ? error.message : String(error)}`);
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
  console.log('🎯 Initializing task tracking...');
  await showProgress(stream);
  await streamMarkdown(stream, '📋 **Initializing task tracking for this project**');
  
  try {
    const folders = vscode.workspace.workspaceFolders;
    console.log('📂 Workspace folders:', folders?.map(f => f.uri.fsPath));
    
    if (!folders || folders.length === 0) {
      console.log('⚠️ No workspace folders found');
      await streamMarkdown(stream, '⚠️ No workspace folder is open. Please open a folder or workspace first.');
      return;
    }
    
    const config = getConfiguration();
    console.log('⚙️ Loaded configuration:', config);
    
    const workspaceFolder = folders[0].uri.fsPath;
    const tasksDir = path.join(workspaceFolder, config.defaultTasksLocation);
    console.log('📁 Tasks directory:', tasksDir);
    
    await streamMarkdown(stream, `I'll set up task tracking in: \`${config.defaultTasksLocation}\``);

    // Get the WriteFileTool instance
    const writeFileTool = toolManager.getTool('writeFile');
    if (!writeFileTool) {
      throw new Error('WriteFileTool not found');
    }

    // Create tasks.json with initial structure
    const tasksJsonPath = path.join(tasksDir, 'tasks.json');
    const initialTasksJson: TaskCollection = {
      name: 'Project Tasks',
      description: 'Task collection for the project',
      tasks: []
    };

    await writeFileTool.execute({
      path: tasksJsonPath,
      content: JSON.stringify(initialTasksJson, null, 2),
      createParentDirectories: true
    });

    // Create README.md in tasks directory
    const readmePath = path.join(tasksDir, 'README.md');
    const readmeContent = `# Tasks Directory

This directory contains task files for the project managed by Huckleberry Task Manager.

## Structure

- \`tasks.json\` - Master index of all tasks
- Individual task files will be created here as tasks are added

## Task Management

Use the VS Code command palette or chat with @Huckleberry to manage tasks:

- Create tasks: \`@Huckleberry Create a task to...\`
- List tasks: \`@Huckleberry List all tasks\`
- Mark complete: \`@Huckleberry Mark task TASK-XXX as complete\`
`;

    await writeFileTool.execute({
      path: readmePath,
      content: readmeContent,
      createParentDirectories: true
    });
    
    await streamMarkdown(stream, '✅ Task tracking initialized!');
    await streamMarkdown(stream, `
Tasks will be stored in the \`${config.defaultTasksLocation}\` directory.
- Default task priority: **${config.defaultTaskPriority}**
- Task file format: **${config.taskFileTemplate}**
    
You can now create tasks and manage them through our chat interface.

I've created:
- \`${config.defaultTasksLocation}/tasks.json\` - For tracking all tasks
- \`${config.defaultTasksLocation}/README.md\` - With usage instructions
`);
  } catch (error) {
    console.error('❌ Error initializing task tracking:', error);
    await streamMarkdown(stream, `❌ Failed to initialize task tracking: ${error instanceof Error ? error.message : String(error)}`);
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
  console.log('🔍 Processing priority task query:', prompt);
  
  let priority = "high";
  if (prompt.toLowerCase().includes("low priority")) {
    priority = "low";
  } else if (prompt.toLowerCase().includes("medium priority")) {
    priority = "medium";
  }
  console.log('📊 Detected priority level:', priority);

  await streamMarkdown(stream, `📋 **${priority.toUpperCase()} Priority Tasks**`);
  
  // Placeholder implementation - will be replaced with actual task retrieval
  if (priority === "high") {
    await streamMarkdown(stream, `
1. 🔴 **TASK-001**: Implement user authentication system
2. 🔴 **TASK-004**: Fix critical security vulnerability in data layer
    `);
  } else if (priority === "medium") {
    await streamMarkdown(stream, `
1. 🟠 **TASK-002**: Add unit tests for core components
2. 🟠 **TASK-005**: Update documentation for API endpoints
    `);
  } else {
    await streamMarkdown(stream, `
1. 🟢 **TASK-003**: Refactor utility functions
2. 🟢 **TASK-006**: Improve code comments for better readability
    `);
  }
  
  await streamMarkdown(stream, `
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
  console.log('📄 Processing requirements parsing request:', prompt);
  await showProgress(stream);
  
  const filenameMatch = prompt.match(/parse\s+(\S+)\s+and/i);
  const filename = filenameMatch ? filenameMatch[1] : "requirements.md";
  console.log('📑 Target file:', filename);
  
  await streamMarkdown(stream, `🔍 **Parsing ${filename} for requirements**`);
  
  try {
    const folders = vscode.workspace.workspaceFolders;
    if (!folders || folders.length === 0) {
      await streamMarkdown(stream, '⚠️ No workspace folder is open. Please open a folder or workspace first.');
      return;
    }
    
    await streamMarkdown(stream, `Looking for \`${filename}\` in your workspace...`);
    
    // Placeholder implementation - will be replaced with actual file parsing
    await streamMarkdown(stream, `
✅ I've analyzed \`${filename}\` and created the following tasks:

1. **TASK-007**: Implement user registration form [HIGH]
2. **TASK-008**: Create database schema for user profiles [MEDIUM]
3. **TASK-009**: Design password reset workflow [MEDIUM]
4. **TASK-010**: Add email verification functionality [LOW]

These tasks have been added to your task collection.
    `);
  } catch (error) {
    console.error('❌ Error parsing requirements:', error);
    await streamMarkdown(stream, `❌ Failed to parse requirements: ${error instanceof Error ? error.message : String(error)}`);
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
  await streamMarkdown(stream, '📋 **Your Tasks**');
  
  // Placeholder implementation - will be replaced with actual task retrieval
  await streamMarkdown(stream, `
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
  console.log('✏️ Processing create task request:', prompt);
  await showProgress(stream);
  
  const descriptionMatch = prompt.match(/create a task( to)?:?\s+(.+)/i);
  const description = descriptionMatch ? descriptionMatch[2].trim() : "New task";
  console.log('📝 Task description:', description);
  
  const config = getConfiguration();
  console.log('⚙️ Using configuration:', config);
  
  const taskId = `TASK-${Math.floor(Math.random() * 900) + 100}`;
  console.log('🏷️ Generated task ID:', taskId);
  
  await streamMarkdown(stream, `✏️ **Creating new task**`);
  
  try {
    const folders = vscode.workspace.workspaceFolders;
    if (!folders || folders.length === 0) {
      throw new Error('No workspace folder is open');
    }

    const workspaceFolder = folders[0].uri.fsPath;
    const tasksDir = path.join(workspaceFolder, config.defaultTasksLocation);
    const tasksJsonPath = path.join(tasksDir, 'tasks.json');

    // Get the tools we need
    const readFileTool = toolManager.getTool('readFile');
    const writeFileTool = toolManager.getTool('writeFile');
    if (!readFileTool || !writeFileTool) {
      throw new Error('Required tools not found');
    }

    // Read existing tasks.json
    let tasksData: TaskCollection;
    try {
      const content = await readFileTool.execute({ path: tasksJsonPath });
      tasksData = JSON.parse(content);
    } catch (error) {
      // If file doesn't exist or is invalid, create new structure
      tasksData = {
        name: 'Project Tasks',
        description: 'Task collection for the project',
        tasks: []
      };
    }

    // Create new task
    const newTask: Task = {
      id: taskId,
      title: description,
      description: description,
      priority: config.defaultTaskPriority,
      status: 'todo',
      completed: false,
      createdAt: new Date().toISOString(),
      tags: []
    };

    // Add to tasks collection
    tasksData.tasks.push(newTask);

    // Write back to tasks.json
    await writeFileTool.execute({
      path: tasksJsonPath,
      content: JSON.stringify(tasksData, null, 2),
      createParentDirectories: true
    });

    // If using markdown template, create individual task file
    if (config.taskFileTemplate === 'markdown') {
      const taskFilePath = path.join(tasksDir, `${taskId}.md`);
      const taskContent = `# ${taskId}: ${description}

## Details
- **Priority**: ${config.defaultTaskPriority}
- **Status**: To Do
- **Created**: ${new Date().toLocaleDateString()}

## Description
${description}

## Notes
- Created via Huckleberry Task Manager
`;

      await writeFileTool.execute({
        path: taskFilePath,
        content: taskContent,
        createParentDirectories: true
      });
    }

    // Send success message
    await streamMarkdown(stream, `
✅ Task created successfully!

**${taskId}**: ${description}
- **Priority**: ${config.defaultTaskPriority}
- **Status**: Open
- **Created**: ${new Date().toLocaleDateString()}

You can mark this task as complete with: \`@Huckleberry Mark task ${taskId} as complete\`
    `);
  } catch (error) {
    console.error('Failed to create task:', error);
    await streamMarkdown(stream, `❌ Failed to create task: ${error instanceof Error ? error.message : String(error)}`);
  }
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
  console.log('✅ Processing mark task done request:', prompt);
  await showProgress(stream);
  
  const taskIdMatch = prompt.match(/task\s+([A-Z]+-\d+)/i);
  const taskId = taskIdMatch ? taskIdMatch[1].toUpperCase() : "UNKNOWN";
  console.log('🎯 Target task ID:', taskId);
  
  await streamMarkdown(stream, `✅ **Marking task ${taskId} as complete**`);
  
  // Placeholder implementation - will be replaced with actual task update
  await streamMarkdown(stream, `
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
  console.log('⚙️ Loading Huckleberry configuration...');
  const config = vscode.workspace.getConfiguration('huckleberry.taskmanager');
  
  const defaultPriority = (config.get('defaultTaskPriority') || DEFAULT_CONFIG.defaultTaskPriority) as string;
  const taskPriority = defaultPriority as TaskPriority;
  
  const finalConfig: taskmanagerConfig = {
    defaultTasksLocation: config.get('defaultTasksLocation') as string || DEFAULT_CONFIG.defaultTasksLocation,
    taskFileTemplate: (config.get('taskFileTemplate') || DEFAULT_CONFIG.taskFileTemplate) as 'markdown' | 'json',
    defaultTaskPriority: taskPriority,
    defaultDueDate: config.get('defaultDueDate') || 'none',
    customDueDateDays: config.get('customDueDateDays') || 0
  };
  
  console.log('📋 Loaded configuration:', finalConfig);
  return finalConfig;
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

  console.log('Registering Huckleberry chat participant...');
  // Register the chat participant with the correct VS Code API
  const taskmanagerDisposable = vscode.chat.createChatParticipant(
    'huckleberry-extension.taskmanager',
    async (request: vscode.ChatRequest, context: vscode.ChatContext, response: vscode.ChatResponseStream, token: vscode.CancellationToken) => {
      console.log('🔵 Chat request received:', {
        prompt: request.prompt,
        contextLength: context.history.length
      });

      try {
        await handleChatRequest(request, context, response, token, toolManager);
        console.log('✅ Chat request handled successfully');
      } catch (error) {
        console.error('❌ Error handling chat request:', error);
        throw error;
      }
    }
  );
  console.log('Chat participant registered successfully');

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
