/**
 * Handler for task tracking initialization
 */
import * as vscode from 'vscode';
import * as path from 'path';
import { ToolManager } from '../../services/toolManager';
import { streamMarkdown, showProgress } from '../../utils/uiHelpers';
import { getConfiguration } from '../../config/index';
import { 
  getWorkspacePaths, 
  writeTasksJson,
  recommendAgentModeInChat 
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
  console.log('🎯 Initializing task tracking...');
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
    console.log('📁 Tasks directory:', tasksDir);
    
    const config = getConfiguration();
    console.log('⚙️ Loaded configuration:', config);
    
    await streamMarkdown(stream, `I'll set up task tracking in: \`${config.defaultTasksLocation}\``);

    await recommendAgentModeInChat(stream);

    // Get the WriteFileTool instance
    const writeFileTool = toolManager.getTool('writeFile');
    if (!writeFileTool) {
      throw new Error('WriteFileTool not found');
    }

    // Create tasks.json with initial structure
    const initialTasksJson: TaskCollection = {
      name: 'Project Tasks',
      description: 'Task collection for the project',
      tasks: []
    };

    await writeTasksJson(toolManager, tasksJsonPath, initialTasksJson);

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
- Scan TODOs: \`@Huckleberry Scan for TODOs in the codebase\`
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