/**
 * Handler for task tracking initialization
 */
import * as vscode from 'vscode';
import * as path from 'path';
import { ToolManager } from '../../services/toolManager';
import { streamMarkdown, showProgress } from '../../utils/uiHelpers';
import { logWithChannel, LogLevel } from '../../utils/debugUtils';
import {
  getWorkspacePaths,
  writeTasksJson,
  recommendAgentModeInChat,
} from './taskUtils';
import { isWorkspaceAvailable, notifyNoWorkspace } from '../chatHandler';

/**
 * Handles task tracking initialization requests
 * @param prompt The user's prompt text
 * @param stream The chat response stream
 * @param toolManager The tool manager instance
 */
export async function handleInitializeTaskTracking(
  prompt: string,
  stream: vscode.ChatResponseStream,
  toolManager: ToolManager,
): Promise<void> {
  logWithChannel(LogLevel.INFO, '🎯 Processing initialize tracking request:', prompt);
  await showProgress(stream);

  if (!isWorkspaceAvailable()) {
    logWithChannel(LogLevel.WARN, '❌ No workspace available for task initialization');
    notifyNoWorkspace();
    return;
  }

  try {
    // Get workspace paths first
    let tasksJsonPath = '';
    let tasksDir = '';
    
    try {
      const paths = await getWorkspacePaths();
      tasksJsonPath = paths.tasksJsonPath;
      tasksDir = paths.tasksDir;
      logWithChannel(LogLevel.DEBUG, `Tasks directory: ${tasksDir}, tasks.json path: ${tasksJsonPath}`);
    } catch (error) {
      logWithChannel(LogLevel.ERROR, 'Failed to get workspace paths:', error);
      await streamMarkdown(stream, `
**Error accessing workspace**

I couldn't determine the paths for task files in your workspace. 
${error instanceof Error ? error.message : String(error)}

Please ensure you have a valid workspace folder open with write permissions.
      `);
      return;
    }

    // Check if tasks.json already exists
    try {
      await vscode.workspace.fs.stat(vscode.Uri.file(tasksJsonPath));

      // If we get here, the file exists
      logWithChannel(LogLevel.INFO, '✓ Tasks are already initialized in this workspace');
      await streamMarkdown(stream, `
Task tracking is already initialized in this workspace. Your tasks are stored in:
- \`tasks.json\`: ${tasksJsonPath}
- Tasks directory: \`${tasksDir}\`

You can:
- Create a task with \`@Huckleberry Create a task to...\`
- List tasks with \`@Huckleberry List all tasks\`
- Get help with \`@Huckleberry Help\`
      `);

      // Check and recommend agent mode if applicable
      await recommendAgentModeInChat(stream);
      return;    } catch {
      // File doesn't exist, continue with initialization
      logWithChannel(LogLevel.DEBUG, 'Tasks not yet initialized, will create new structure.');
    }

    // Create tasks directory if it doesn't exist
    try {
      await vscode.workspace.fs.createDirectory(vscode.Uri.file(tasksDir));
      logWithChannel(LogLevel.DEBUG, `✓ Created tasks directory: ${tasksDir}`);
    } catch (error) {
      logWithChannel(LogLevel.ERROR, `Failed to create tasks directory at ${tasksDir}:`, error);
      await streamMarkdown(stream, `
**Error creating tasks directory**

I couldn't create the tasks directory at \`${tasksDir}\`.
${error instanceof Error ? error.message : String(error)}

Please check your workspace permissions and try again.
      `);
      return;
    }

    // Get the tools we need
    const writeFileTool = toolManager.getTool('writeFile');
    if (!writeFileTool) {
      const errorMsg = 'WriteFileTool not found. The extension may not be properly initialized.';
      logWithChannel(LogLevel.ERROR, errorMsg);
      await streamMarkdown(stream, `
**Extension error**

${errorMsg}

Please try restarting VS Code and try again. If the problem persists, please report this issue.
      `);
      return;
    }

    // Create initial tasks.json with empty tasks array
    const initialTasksContent = {
      version: '1.0',
      lastUpdated: new Date().toISOString(),
      name: 'Project Tasks',
      description: 'Task collection for the project',
      tasks: [],
      metadata: {
        nextId: 1,
      },
    };

    // Write initial tasks.json
    try {
      await writeTasksJson(toolManager, tasksJsonPath, initialTasksContent);
      logWithChannel(LogLevel.DEBUG, `✓ Created tasks.json at ${tasksJsonPath}`);
    } catch (error) {
      logWithChannel(LogLevel.ERROR, `Failed to create tasks.json at ${tasksJsonPath}:`, error);
      await streamMarkdown(stream, `
**Error writing tasks.json**

I couldn't create the tasks.json file at \`${tasksJsonPath}\`.
${error instanceof Error ? error.message : String(error)}

Please check your workspace permissions and try again.
      `);
      return;
    }

    // Create example markdown task file to demonstrate the format
    const exampleTaskFilePath = path.join(tasksDir, 'TASK-0.md');
    const exampleTaskContent = `# TASK-0: Example Task

## Details
- **Priority**: medium
- **Status**: To Do
- **Created**: ${new Date().toLocaleDateString()}

## Description
This is an example task to demonstrate the task file format.

## Notes
- Created automatically during task tracking initialization
- You can edit this file directly or use Huckleberry commands
`;

    try {
      await writeFileTool.execute({
        path: exampleTaskFilePath,
        content: exampleTaskContent,
        createParentDirectories: true,
      });
      logWithChannel(LogLevel.DEBUG, `✓ Created example task file at ${exampleTaskFilePath}`);
    } catch (error) {
      // If example task creation fails, log but continue
      logWithChannel(LogLevel.WARN, `Failed to create example task file at ${exampleTaskFilePath}, continuing:`, error);
    }

    // Send success message with Doc Holliday flair
    await streamMarkdown(stream, `
I'm your huckleberry. Task tracking is now initialized faster than you can draw.

I've set up:
- \`tasks.json\` to store your task data
- \`tasks/\` directory for individual task files
- An example task to demonstrate the format

You can now:
- Create a task with \`@Huckleberry Create a task to...\`
- Create a high priority task with \`@Huckleberry Create a high priority task to...\`
- Scan your codebase with \`@Huckleberry Scan for TODOs\`

Remember:
- Tasks are stored in your workspace and can be version controlled
- Each task gets its own markdown file for detailed documentation
- Use \`@Huckleberry help\` if you need assistance
    `);

    // Log successful initialization
    logWithChannel(LogLevel.INFO, '✅ Task tracking initialized', {
      tasksJsonPath,
      tasksDirectory: tasksDir,
    });

    // Check and recommend agent mode if applicable
    await recommendAgentModeInChat(stream);
  } catch (error) {
    logWithChannel(LogLevel.ERROR, 'Failed to initialize task tracking:', error);
    await streamMarkdown(stream, `
**Well now, I seem to be having a bad day.**

Failed to initialize task tracking: ${error instanceof Error ? error.message : String(error)}

I'm not quite as steady as I used to be. Try again, darlin'.
    `);
  }
}