/**
 * Handler for next task recommendation
 */
import * as vscode from 'vscode';
import { ToolManager } from '../../services/toolManager';
import { streamMarkdown, showProgress } from '../../utils/uiHelpers';
import { Task, TaskPriority } from '../../types';
import {
  getWorkspacePaths,
  readTasksJson,
  priorityEmoji,
  recommendAgentModeInChat
} from './taskUtils';
import { logWithChannel, LogLevel } from '../../utils/debugUtils';

// Priority order for sorting tasks (highest to lowest)
const PRIORITY_ORDER: Record<string, number> = {
  'critical': 0,
  'high': 1,
  'medium': 2,
  'low': 3
};

/**
 * Recommends the next task to work on based on priority and status
 * @param prompt The user's prompt text
 * @param stream The chat response stream
 * @param toolManager The tool manager instance
 */
export async function handleNextTaskRequest(
  prompt: string, 
  stream: vscode.ChatResponseStream, 
  toolManager: ToolManager
): Promise<void> {
  console.log('🎯 Processing next task request:', prompt);
  await showProgress(stream);
  
  await streamMarkdown(stream, `🔍 **Finding your next task to work on**`);
  
  try {
    const { tasksJsonPath } = await getWorkspacePaths();
    
    // Read and parse tasks.json
    const tasksData = await readTasksJson(toolManager, tasksJsonPath);
    
    // Check if we have any tasks
    if (!tasksData.tasks || tasksData.tasks.length === 0) {
      await streamMarkdown(stream, `
No tasks found. Create a task with: \`@Huckleberry Create a task to...\`
      `);
      return;
    }
    
    // Get only incomplete tasks
    const openTasks = tasksData.tasks.filter(task => !task.completed);
    
    if (openTasks.length === 0) {
      await streamMarkdown(stream, `
I'm your huckleberry. Looks like you've completed all your tasks. Well done!

You can create more tasks with: \`@Huckleberry Create a task to...\`
      `);
      return;
    }
    
    // Sort tasks by priority (critical, high, medium, low)
    openTasks.sort((a, b) => {
      const priorityA = PRIORITY_ORDER[a.priority?.toLowerCase() || 'medium'] || 2;
      const priorityB = PRIORITY_ORDER[b.priority?.toLowerCase() || 'medium'] || 2;
      return priorityA - priorityB;
    });
    
    // Get the top task (highest priority)
    const nextTask = openTasks[0];
    const taskEmoji = priorityEmoji[nextTask.priority?.toLowerCase() || 'medium'];
    
    // Find how many tasks are at the same priority level
    const samePriorityTasks = openTasks.filter(task => 
      (task.priority?.toLowerCase() || 'medium') === (nextTask.priority?.toLowerCase() || 'medium')
    );
    
    // Count tasks by priority for summary
    const taskCountByPriority: Record<string, number> = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0
    };
    
    openTasks.forEach(task => {
      const priority = task.priority?.toLowerCase() || 'medium';
      if (taskCountByPriority[priority] !== undefined) {
        taskCountByPriority[priority]++;
      }
    });
    
    // Log the next task recommendation
    logWithChannel(LogLevel.INFO, '✅ Next task recommendation', {
      taskId: nextTask.id,
      taskTitle: nextTask.title,
      taskPriority: nextTask.priority,
      openTasksCount: openTasks.length
    });
    
    // Send recommendation
    await streamMarkdown(stream, `
I'm your huckleberry. Here's what you should work on next:

## ${taskEmoji} ${nextTask.id}: ${nextTask.title}

**Priority**: ${nextTask.priority || 'Medium'}
${nextTask.description && nextTask.description !== nextTask.title ? `**Description**: ${nextTask.description}\n` : ''}${nextTask.dueDate ? `**Due Date**: ${nextTask.dueDate}\n` : ''}

This task was selected based on priority${samePriorityTasks.length > 1 ? ' (you have ' + samePriorityTasks.length + ' tasks at this priority level)' : ''}.

**Task summary:**
${taskCountByPriority['critical'] > 0 ? `- ${priorityEmoji['critical']} Critical: ${taskCountByPriority['critical']} tasks\n` : ''}${taskCountByPriority['high'] > 0 ? `- ${priorityEmoji['high']} High: ${taskCountByPriority['high']} tasks\n` : ''}${taskCountByPriority['medium'] > 0 ? `- ${priorityEmoji['medium']} Medium: ${taskCountByPriority['medium']} tasks\n` : ''}${taskCountByPriority['low'] > 0 ? `- ${priorityEmoji['low']} Low: ${taskCountByPriority['low']} tasks\n` : ''}
Total: ${openTasks.length} open tasks

You can mark this task as complete with: \`@Huckleberry Mark task ${nextTask.id} as complete\`
    `);
    
    // Check and recommend agent mode if applicable
    await recommendAgentModeInChat(stream);
    
  } catch (error) {
    console.error('Failed to recommend next task:', error);
    await streamMarkdown(stream, `❌ Failed to recommend next task: ${error instanceof Error ? error.message : String(error)}`);
  }
}