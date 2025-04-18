/**
 * Handler for task status operations (marking complete, changing priority)
 */
import * as vscode from 'vscode';
import * as path from 'path';
import { ToolManager } from '../../services/toolManager';
import { TaskPriority } from '../../types';
import { streamMarkdown, showProgress } from '../../utils/uiHelpers';
import {
  getWorkspacePaths,
  readTasksJson,
  writeTasksJson,
  priorityEmoji,
} from './taskUtils';
import { getConfiguration } from '../../config';

/**
 * Extracts task ID from the user's prompt
 * @param prompt The user's prompt text
 * @returns The extracted task ID or null if not found
 */
function extractTaskId(prompt: string): string | null {
  const taskIdMatch = prompt.match(/task\s+([A-Z]+-\d+)/i);
  return taskIdMatch ? taskIdMatch[1].toUpperCase() : null;
}

/**
 * Extracts priority from the user's prompt
 * @param prompt The user's prompt text
 * @returns The extracted priority or null if not found
 */
function extractPriority(prompt: string): TaskPriority | null {
  if (prompt.toLowerCase().includes("high priority")) {
    return "high";
  } else if (prompt.toLowerCase().includes("medium priority")) {
    return "medium";
  } else if (prompt.toLowerCase().includes("low priority")) {
    return "low";
  } else if (prompt.toLowerCase().includes("critical priority")) {
    return "critical";
  }
  return null;
}

/**
 * Handles requests to mark a task as complete
 * @param prompt The user's prompt text
 * @param stream The chat response stream
 * @param toolManager The tool manager instance
 */
export async function handleMarkTaskDoneRequest(
  prompt: string, 
  stream: vscode.ChatResponseStream, 
  toolManager: ToolManager
): Promise<void> {
  console.log('✅ Processing mark task done request:', prompt);
  await showProgress(stream);
  
  const taskId = extractTaskId(prompt);
  
  if (!taskId) {
    await streamMarkdown(stream, `❌ Please specify a task ID (e.g., TASK-123) to mark as complete.`);
    return;
  }
  
  console.log('🎯 Target task ID:', taskId);
  await streamMarkdown(stream, `✅ **Marking task ${taskId} as complete**`);
  
  try {
    const { tasksJsonPath } = await getWorkspacePaths();
    const tasksData = await readTasksJson(toolManager, tasksJsonPath);
    
    // Find the task by ID
    const taskIndex = tasksData.tasks.findIndex(task => task.id.toUpperCase() === taskId);
    if (taskIndex === -1) {
      await streamMarkdown(stream, `❌ Task ${taskId} not found in your task collection.`);
      return;
    }
    
    // Update task status
    const task = tasksData.tasks[taskIndex];
    task.completed = true;
    task.status = 'completed';
    task.completedAt = new Date().toISOString();
    
    // Write back to tasks.json
    await writeTasksJson(toolManager, tasksJsonPath, tasksData);
    
    // Update markdown file if template is markdown
    const config = getConfiguration();
    if (config.taskFileTemplate === 'markdown') {
      const taskFilePath = path.join(
        (await getWorkspacePaths()).workspaceFolder, 
        config.defaultTasksLocation, 
        `${taskId}.md`
      );
      
      try {
        // Check if the file exists
        const readFileTool = toolManager.getTool('readFile');
        const writeFileTool = toolManager.getTool('writeFile');
        
        if (!readFileTool || !writeFileTool) {
          throw new Error('Required tools not found');
        }
        
        let taskContent = await readFileTool.execute({ path: taskFilePath }) as string;
        
        // Replace status in markdown file
        taskContent = taskContent.replace(
          /- \*\*Status\*\*: .+/i,
          `- **Status**: Completed ✅`
        );
        
        // Add completed date
        if (!taskContent.includes("Completed Date")) {
          taskContent = taskContent.replace(
            /- \*\*Created\*\*: .+/i,
            `$&\n- **Completed Date**: ${new Date().toLocaleDateString()}`
          );
        } else {
          taskContent = taskContent.replace(
            /- \*\*Completed Date\*\*: .+/i,
            `- **Completed Date**: ${new Date().toLocaleDateString()}`
          );
        }
        
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

    // Send success message
    await streamMarkdown(stream, `
I'm your huckleberry. That task won't be bothering you anymore.

Task **${taskId}** has been marked as complete.

- **ID**: ${taskId}
- **Title**: ${task.title}
- **Status**: ✅ Complete
- **Completed Date**: ${new Date().toLocaleDateString()}

It appears Mr. Task's an educated man. Now I really hate him.
    `);
    
  } catch (error) {
    console.error('Failed to mark task as done:', error);
    await streamMarkdown(stream, `❌ Failed to mark task as done: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Handles requests to change a task's priority
 * @param prompt The user's prompt text
 * @param stream The chat response stream
 * @param toolManager The tool manager instance
 */
export async function handleChangeTaskPriorityRequest(
  prompt: string, 
  stream: vscode.ChatResponseStream, 
  toolManager: ToolManager
): Promise<void> {
  console.log('🔄 Processing change task priority request:', prompt);
  await showProgress(stream);
  
  // Extract task ID and priority from the prompt
  const taskId = extractTaskId(prompt);
  const newPriority = extractPriority(prompt);
  
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
    const { tasksJsonPath } = await getWorkspacePaths();
    const config = getConfiguration();

    // Read and parse tasks.json
    const tasksData = await readTasksJson(toolManager, tasksJsonPath);

    // Find the task by ID
    const taskIndex = tasksData.tasks.findIndex(task => task.id.toUpperCase() === taskId);
    if (taskIndex === -1) {
      await streamMarkdown(stream, `❌ Task ${taskId} not found in your task collection.`);
      return;
    }

    // Store old priority for feedback
    const oldPriority = tasksData.tasks[taskIndex].priority;
    
    // Update task priority
    tasksData.tasks[taskIndex].priority = newPriority;
    
    // Write back to tasks.json
    await writeTasksJson(toolManager, tasksJsonPath, tasksData);
    
    // Update markdown file if template is markdown
    if (config.taskFileTemplate === 'markdown') {
      const writeFileTool = toolManager.getTool('writeFile');
      const readFileTool = toolManager.getTool('readFile');
      
      if (!readFileTool || !writeFileTool) {
        throw new Error('Required tools not found');
      }
      
      const taskFilePath = path.join(
        (await getWorkspacePaths()).workspaceFolder, 
        config.defaultTasksLocation, 
        `${taskId}.md`
      );
      
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

    // Send success message
    await streamMarkdown(stream, `
Well now, I'm your huckleberry. This task just had a reckoning with its priority.

**${taskId}** priority changed:
- From: ${oldPriority}
- To: ${priorityEmoji[newPriority]} **${newPriority.toUpperCase()}**

Evidently, Mr. Task is particular about its standing. Very cosmopolitan.

You can view your tasks with: \`@Huckleberry List all tasks\`
    `);
  } catch (error) {
    console.error('Failed to update task priority:', error);
    await streamMarkdown(stream, `❌ Failed to update task priority: ${error instanceof Error ? error.message : String(error)}`);
  }
}