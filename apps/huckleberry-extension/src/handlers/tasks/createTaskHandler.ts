/**
 * Handler for task creation operations
 */
import * as vscode from 'vscode';
import * as path from 'path';
import { ToolManager } from '../../services/toolManager';
import { Task, TaskPriority } from '../../types';
import { streamMarkdown, showProgress } from '../../utils/uiHelpers';
import { getConfiguration } from '../../config/index';
import {
  getWorkspacePaths,
  readTasksJson,
  writeTasksJson,
  generateTaskId,
  createTaskObject,
  priorityEmoji,
  recommendAgentModeInChat
} from './taskUtils';

/**
 * Extracts task description from the user's prompt
 * @param prompt The user's prompt text
 * @returns The extracted task description or a default
 */
function extractTaskDescription(prompt: string): string {
  // Handle priority-specific patterns first
  const priorityMatch = prompt.match(/create a (high|medium|low|critical) priority task( to)?:?\s+(.+)/i);
  if (priorityMatch) {
    return priorityMatch[3].trim();
  }
  
  // Handle standard patterns
  const descriptionMatch = prompt.match(/create a task( to)?:?\s+(.+)/i);
  return descriptionMatch ? descriptionMatch[2].trim() : "New task";
}

/**
 * Creates a new task based on user input
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
  
  // Extract task description from the prompt
  const description = extractTaskDescription(prompt);
  console.log('📝 Task description:', description);
  
  const config = getConfiguration();
  
  // Use provided priority or default from config
  const taskPriority = priority || config.defaultTaskPriority;
  console.log('🔖 Task priority:', taskPriority);
  
  const taskId = generateTaskId();
  console.log('🏷️ Generated task ID:', taskId);
  
  await streamMarkdown(stream, `✏️ **Creating new ${taskPriority} priority task**`);
  
  try {
    const { tasksDir, tasksJsonPath } = await getWorkspacePaths();

    // Get the tools we need
    const writeFileTool = toolManager.getTool('writeFile');
    if (!writeFileTool) {
      throw new Error('WriteFileTool not found');
    }

    // Read existing tasks.json or create new one
    const tasksData = await readTasksJson(toolManager, tasksJsonPath);

    // Create new task
    const newTask: Task = createTaskObject(
      taskId, 
      description, 
      taskPriority as TaskPriority,
      {
        createdAt: new Date().toISOString()
      }
    );

    // Add to tasks collection
    tasksData.tasks.push(newTask);

    // Write back to tasks.json
    await writeTasksJson(toolManager, tasksJsonPath, tasksData);

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

    // Send success message
    await streamMarkdown(stream, `
I'm your huckleberry. Task created faster than Johnny Ringo can draw.

${priorityEmoji[taskPriority as keyof typeof priorityEmoji]} **${taskId}**: ${description}
- **Priority**: ${taskPriority.toUpperCase()}
- **Status**: Open
- **Created**: ${new Date().toLocaleDateString()}

You can mark this task as complete with: \`@Huckleberry Mark task ${taskId} as complete\`
    `);
    
    // Check and recommend agent mode if applicable
    await recommendAgentModeInChat(stream);
  } catch (error) {
    console.error('Failed to create task:', error);
    await streamMarkdown(stream, `❌ Failed to create task: ${error instanceof Error ? error.message : String(error)}`);
  }
}