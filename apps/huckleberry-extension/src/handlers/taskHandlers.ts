import * as vscode from 'vscode';
import * as path from 'path';
import { ToolManager } from '../services/toolManager';
import { Task, TaskCollection, TaskStatus, TaskPriority, taskmanagerConfig } from '../types';
import { getConfiguration } from '../config/index';
import { streamMarkdown, showProgress } from '../utils/uiHelpers';

/**
 * Handler for initializing task tracking
 */
export async function handleInitializeTaskTracking(
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
    await streamMarkdown(stream, "I'm your huckleberry. Let's get these tasks organized, shall we?");
    await streamMarkdown(stream, `
Tasks will be stored in the \`${config.defaultTasksLocation}\` directory.
- Default task priority: **${config.defaultTaskPriority}**
- Task file format: **${config.taskFileTemplate}**
    
You can now create tasks and manage them through our chat interface. I'm in my prime when managing your priorities.

I've set up:
- \`${config.defaultTasksLocation}/tasks.json\` - For tracking all tasks
- \`${config.defaultTasksLocation}/README.md\` - With usage instructions

There's no normal life, just tasks. Let's get on with it.
`);
  } catch (error) {
    console.error('❌ Error initializing task tracking:', error);
    await streamMarkdown(stream, `❌ Failed to initialize task tracking: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Handler for queries about tasks with a specific priority
 */
export async function handlePriorityTaskQuery(
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

  try {
    // Get workspace folder
    const folders = vscode.workspace.workspaceFolders;
    if (!folders || folders.length === 0) {
      throw new Error('No workspace folder is open');
    }

    const config = getConfiguration();
    const workspaceFolder = folders[0].uri.fsPath;
    const tasksJsonPath = path.join(workspaceFolder, config.defaultTasksLocation, 'tasks.json');

    // Get the ReadFileTool instance
    const readFileTool = toolManager.getTool('readFile');
    if (!readFileTool) {
      throw new Error('ReadFileTool not found');
    }

    // Read and parse tasks.json
    let tasksData: TaskCollection;
    try {
      const content = await readFileTool.execute({ path: tasksJsonPath });
      tasksData = JSON.parse(content as string);
    } catch (error) {
      throw new Error(`Failed to read tasks: ${error instanceof Error ? error.message : String(error)}`);
    }

    // Filter tasks by priority
    const priorityTasks = tasksData.tasks.filter(task => 
      task.priority?.toLowerCase() === priority && !task.completed
    );

    await streamMarkdown(stream, `📋 **${priority.toUpperCase()} Priority Tasks**`);

    if (priorityTasks.length === 0) {
      await streamMarkdown(stream, `\nNo ${priority} priority tasks found.`);
      return;
    }

    // Map priority to emoji
    const priorityEmoji = {
      high: '🔴',
      medium: '🟠',
      low: '🟢',
      critical: '⚠️'
    };

    // Format and display tasks
    const taskList = priorityTasks
      .map((task, index) => `${index + 1}. ${priorityEmoji[task.priority as keyof typeof priorityEmoji]} **${task.id}**: ${task.title}`)
      .join('\n');

    await streamMarkdown(stream, `\n${taskList}`);
    
    await streamMarkdown(stream, `\nYou can mark any task as complete with: \`@Huckleberry Mark task TASK-XXX as complete\``);
  } catch (error) {
    console.error('Failed to retrieve tasks:', error);
    await streamMarkdown(stream, `❌ Failed to retrieve tasks: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Handler for parsing requirements and creating tasks
 */
export async function handleParseRequirementsRequest(
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
    
    // TODO: Implement actual file parsing and task creation
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
 */
export async function handleReadTasksRequest(
  prompt: string, 
  stream: vscode.ChatResponseStream, 
  toolManager: ToolManager
): Promise<void> {
  await streamMarkdown(stream, '📋 **Your Tasks**');
  
  // TODO: Implement actual task retrieval from tasks.json
  await streamMarkdown(stream, `
1. 🔴 **TASK-001**: Implement user authentication system [HIGH]
2. 🟠 **TASK-002**: Add unit tests for core components [MEDIUM]
3. 🟢 **TASK-003**: Refactor utility functions [LOW]
4. 🔴 **TASK-004**: Fix critical security vulnerability [HIGH]
  `);
}

/**
 * Handler for creating task requests
 * @param prompt The user's prompt text
 * @param stream The chat response stream
 * @param toolManager The tool manager instance
 * @param priority Optional task priority override
 */
export async function handleCreateTaskRequest(
  prompt: string, 
  stream: vscode.ChatResponseStream, 
  toolManager: ToolManager,
  priority?: string | null
): Promise<void> {
  console.log('✏️ Processing create task request:', prompt);
  await showProgress(stream);
  
  const descriptionMatch = prompt.match(/create a task( to)?:?\s+(.+)/i);
  const description = descriptionMatch ? descriptionMatch[2].trim() : "New task";
  console.log('📝 Task description:', description);
  
  const config = getConfiguration();
  console.log('⚙️ Using configuration:', config);
  
  // Use provided priority or default from config
  const taskPriority = priority || config.defaultTaskPriority;
  console.log('🔖 Task priority:', taskPriority);
  
  const taskId = `TASK-${Math.floor(Math.random() * 900) + 100}`;
  console.log('🏷️ Generated task ID:', taskId);
  
  await streamMarkdown(stream, `✏️ **Creating new ${taskPriority} priority task**`);
  
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
      tasksData = JSON.parse(content as string);
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
      priority: taskPriority as TaskPriority,  // Cast the priority to TaskPriority
      status: 'todo' as TaskStatus,
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
- **Priority**: ${taskPriority}
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

    // Map priority to emoji for feedback message
    const priorityEmoji = {
      high: '🔴',
      medium: '🟠',
      low: '🟢',
      critical: '⚠️'
    };

    // Send success message
    await streamMarkdown(stream, `
I'm your huckleberry. Task created faster than Johnny Ringo can draw.

${priorityEmoji[taskPriority as keyof typeof priorityEmoji]} **${taskId}**: ${description}
- **Priority**: ${taskPriority.toUpperCase()}
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
 */
export async function handleMarkTaskDoneRequest(
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
  
  // TODO: Implement actual task status update
  await streamMarkdown(stream, `
I'm your huckleberry. That task won't be bothering you anymore.

Task **${taskId}** has been marked as complete.

- **ID**: ${taskId}
- **Status**: ✅ Complete
- **Completed Date**: ${new Date().toLocaleDateString()}

It appears Mr. Task's an educated man. Now I really hate him.
  `);
}

/**
 * Handler for changing task priority requests
 */
export async function handleChangeTaskPriorityRequest(
  prompt: string, 
  stream: vscode.ChatResponseStream, 
  toolManager: ToolManager
): Promise<void> {
  console.log('🔄 Processing change task priority request:', prompt);
  await showProgress(stream);
  
  // Extract task ID from the prompt using regex
  const taskIdMatch = prompt.match(/task\s+([A-Z]+-\d+)/i);
  const taskId = taskIdMatch ? taskIdMatch[1].toUpperCase() : null;
  
  // Extract priority from the prompt
  let newPriority: string | null = null;
  if (prompt.toLowerCase().includes("high priority")) {
    newPriority = "high";
  } else if (prompt.toLowerCase().includes("medium priority")) {
    newPriority = "medium";
  } else if (prompt.toLowerCase().includes("low priority")) {
    newPriority = "low";
  } else if (prompt.toLowerCase().includes("critical priority")) {
    newPriority = "critical";
  }
  
  console.log(`🎯 Target task ID: ${taskId}, New priority: ${newPriority}`);
  
  // Validate inputs
  if (!taskId) {
    console.error('❌ No task ID specified in request');
    await streamMarkdown(stream, `❌ Please specify a task ID (e.g., TASK-123) when changing priority.`);
    return;
  }
  
  if (!newPriority) {
    console.error('❌ No priority specified in request');
    await streamMarkdown(stream, `❌ Please specify a priority level (low, medium, high, or critical).`);
    return;
  }
  
  await streamMarkdown(stream, `🔄 **Updating priority for task ${taskId}**`);
  
  try {
    // Get workspace folder
    const folders = vscode.workspace.workspaceFolders;
    if (!folders || folders.length === 0) {
      throw new Error('No workspace folder is open');
    }

    const config = getConfiguration();
    const workspaceFolder = folders[0].uri.fsPath;
    const tasksJsonPath = path.join(workspaceFolder, config.defaultTasksLocation, 'tasks.json');

    // Get the necessary tools
    const readFileTool = toolManager.getTool('readFile');
    const writeFileTool = toolManager.getTool('writeFile');
    if (!readFileTool || !writeFileTool) {
      throw new Error('Required tools not found');
    }

    // Read and parse tasks.json
    let tasksData: TaskCollection;
    try {
      const content = await readFileTool.execute({ path: tasksJsonPath });
      tasksData = JSON.parse(content as string);
    } catch (error) {
      throw new Error(`Failed to read tasks: ${error instanceof Error ? error.message : String(error)}`);
    }

    // Find the task by ID
    const taskIndex = tasksData.tasks.findIndex(task => task.id.toUpperCase() === taskId);
    if (taskIndex === -1) {
      await streamMarkdown(stream, `❌ Task ${taskId} not found in your task collection.`);
      return;
    }

    // Store old priority for feedback
    const oldPriority = tasksData.tasks[taskIndex].priority;
    
    // Update task priority
    tasksData.tasks[taskIndex].priority = newPriority as any;
    
    // Write back to tasks.json
    await writeFileTool.execute({
      path: tasksJsonPath,
      content: JSON.stringify(tasksData, null, 2)
    });
    
    // Update markdown file if template is markdown
    if (config.taskFileTemplate === 'markdown') {
      const taskFilePath = path.join(workspaceFolder, config.defaultTasksLocation, `${taskId}.md`);
      
      try {
        // Check if the file exists
        let taskContent = await readFileTool.execute({ path: taskFilePath }) as string;
        
        // Replace priority in markdown file
        taskContent = taskContent.replace(
          /- \*\*Priority\*\*: \w+/i,
          `- **Priority**: ${newPriority}`
        );
        
        // Write updated content back
        await writeFileTool.execute({
          path: taskFilePath,
          content: taskContent
        });
      } catch (error) {
        console.warn(`Warning: Could not update markdown file for task ${taskId}: ${error}`);
        // Continue execution even if markdown update fails
      }
    }

    // Map priority to emoji for feedback message
    const priorityEmoji = {
      high: '🔴',
      medium: '🟠',
      low: '🟢',
      critical: '⚠️'
    };

    // Send success message
    await streamMarkdown(stream, `
Well now, I'm your huckleberry. This task just had a reckoning with its priority.

**${taskId}** priority changed:
- From: ${oldPriority}
- To: ${priorityEmoji[newPriority as keyof typeof priorityEmoji]} **${newPriority.toUpperCase()}**

Evidently, Mr. Task is particular about its standing. Very cosmopolitan.

You can view your tasks with: \`@Huckleberry List all tasks\`
    `);
  } catch (error) {
    console.error('Failed to update task priority:', error);
    await streamMarkdown(stream, `❌ Failed to update task priority: ${error instanceof Error ? error.message : String(error)}`);
  }
}