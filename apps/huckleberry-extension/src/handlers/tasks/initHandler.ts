/**
 * Handler for task tracking initialization
 */
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs/promises';
import { ToolManager } from '../../services/toolManager';
import { streamMarkdown, showProgress } from '../../utils/uiHelpers';
import { getConfiguration } from '../../config/index';
import { logWithChannel, LogLevel } from '../../utils/debugUtils';
import { 
  getWorkspacePaths, 
  writeTasksJson,
  recommendAgentModeInChat,
  readTasksJson 
} from './taskUtils';
import { TaskCollection } from '../../types';

/**
 * Initializes task tracking for the project
 * @param stream The chat response stream
 * @param toolManager The tool manager instance
 */
export async function handleInitializeTaskTracking(
  stream: vscode.ChatResponseStream, 
  toolManager: ToolManager
): Promise<void> {
  logWithChannel(LogLevel.INFO, '🎯 Initializing task tracking...');
  await showProgress(stream);
  await streamMarkdown(stream, '📋 **Initializing task tracking for this project**');
  
  try {
    // Check for workspace availability before proceeding
    if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
      await streamMarkdown(stream, `
⚠️ **No workspace is currently open**

Huckleberry Task Manager requires an open workspace or folder to initialize task tracking. 

Please:
1. Open a folder or workspace using File > Open Folder
2. Then try initializing task tracking again

You can use the button below to open a folder.
      `);
      
      // Show notification with action button
      vscode.window.showInformationMessage(
        'Huckleberry Task Manager requires an open workspace to initialize task tracking.',
        'Open Folder'
      ).then(selection => {
        if (selection === 'Open Folder') {
          vscode.commands.executeCommand('workbench.action.files.openFolder');
        }
      });
      
      return;
    }

    const { workspaceFolder, tasksDir, tasksJsonPath } = await getWorkspacePaths();
    logWithChannel(LogLevel.INFO, '📁 Tasks directory:', { tasksDir });
    
    const config = getConfiguration();
    logWithChannel(LogLevel.INFO, '⚙️ Loaded configuration:', config);
    
    await streamMarkdown(stream, `I'll set up task tracking in: \`${config.defaultTasksLocation}\``);

    await recommendAgentModeInChat(stream);

    // Get the WriteFileTool instance
    let writeFileTool = toolManager.getTool('writeFile');
    
    // Log the available tools for debugging
    const availableTools = toolManager.getTools();
    logWithChannel(LogLevel.DEBUG, 'Available tools:', { 
      toolCount: availableTools.length,
      toolIds: availableTools.map(t => t.id)
    });
    
    if (!writeFileTool) {
      logWithChannel(LogLevel.WARN, 'WriteFileTool not found in ToolManager. Will try to use fs API directly.');
      // Create the tasks directory (fallback method if tool not found)
      await createDirectoriesIfNeeded(tasksDir);
    }

    // Check if tasks.json already exists by attempting to read it
    let existingData: TaskCollection | null = null;
    let isAlreadyInitialized = false;
    
    try {
      // Try to read existing tasks.json
      existingData = await readTasksJson(toolManager, tasksJsonPath);
      
      // Check if the file actually exists (not just created by readTasksJson)
      const readFileTool = toolManager.getTool('readFile');
      if (readFileTool) {
        await readFileTool.execute({ path: tasksJsonPath });
        isAlreadyInitialized = true;
      } else {
        // Fallback to direct file system API
        await fs.access(tasksJsonPath);
        isAlreadyInitialized = true;
      }
      
      logWithChannel(LogLevel.INFO, '📋 Found existing tasks.json, preserving tasks', {
        taskCount: existingData.tasks.length
      });
    } catch (error) {
      // If we can't read the file, it likely doesn't exist
      isAlreadyInitialized = false;
      logWithChannel(LogLevel.DEBUG, 'No existing tasks.json found, will create new one');
    }
    
    // If we couldn't read existing data, create a new structure
    if (!existingData) {
      existingData = {
        name: 'Project Tasks',
        description: 'Task collection for the project',
        tasks: []
      };
    }

    // Write the tasks.json (either with preserved data or new empty data)
    await writeTasksJson(toolManager, tasksJsonPath, existingData);

    // Create README.md in tasks directory if it doesn't exist
    const readmePath = path.join(tasksDir, 'README.md');
    const readmeExists = await fileExists(readmePath);
    
    if (!readmeExists) {
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
- Scan TODOs: \`@Huckleberry Scan for TODOs in the codebase\`
`;

      if (writeFileTool) {
        // Use the tool if available
        await writeFileTool.execute({
          path: readmePath,
          content: readmeContent,
          createParentDirectories: true
        });
      } else {
        // Use direct file system API if tool is not available
        await createDirectoriesIfNeeded(path.dirname(readmePath));
        await fs.writeFile(readmePath, readmeContent);
      }
    }
    
    // Response depends on whether we're initializing for the first time or not
    if (isAlreadyInitialized) {
      await streamMarkdown(stream, '✅ Task tracking already initialized!');
      await streamMarkdown(stream, "I'm your huckleberry. Existing tasks have been preserved.");
      await streamMarkdown(stream, `
Tasks are stored in the \`${config.defaultTasksLocation}\` directory.
- Current task count: **${existingData.tasks.length}**
- Default task priority: **${config.defaultTaskPriority}**
    
You can continue managing your tasks through our chat interface.
`);
    } else {
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
    }

    // Log success
    logWithChannel(LogLevel.INFO, '✅ Task tracking initialized successfully', { 
      tasksDir,
      isAlreadyInitialized,
      taskCount: existingData.tasks.length
    });
  } catch (error) {
    logWithChannel(LogLevel.ERROR, '❌ Error initializing task tracking:', error);
    await streamMarkdown(stream, `❌ Failed to initialize task tracking: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Helper function to create directories if they don't exist
 * @param dirPath The directory path to create
 */
async function createDirectoriesIfNeeded(dirPath: string): Promise<void> {
  try {
    // Recursively create directories
    await vscode.workspace.fs.createDirectory(vscode.Uri.file(dirPath));
    logWithChannel(LogLevel.DEBUG, `Created directory: ${dirPath}`);
  } catch (error) {
    // Log error but don't throw - this is a best-effort operation
    logWithChannel(LogLevel.ERROR, `Failed to create directory ${dirPath}:`, error);
  }
}

/**
 * Helper function to check if a file exists
 * @param filePath Path to the file to check
 * @returns Promise resolving to true if the file exists, false otherwise
 */
async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}