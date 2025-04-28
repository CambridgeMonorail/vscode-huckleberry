/**
 * Handler for prioritizing and sorting tasks
 */
import * as vscode from 'vscode';
import { ToolManager } from '../../services/toolManager';
import { streamMarkdown, showProgress } from '../../utils/uiHelpers';
import { Task } from '../../types';
import {
  getWorkspacePaths,
  readTasksJson,
  writeTasksJson,
} from './taskUtils';
import { logWithChannel, LogLevel } from '../../utils/debugUtils';

/**
 * Priority order mapping for sorting tasks
 */
const PRIORITY_ORDER: Record<string, number> = {
  'critical': 0,
  'high': 1,
  'medium': 2,
  'low': 3,
};

/**
 * Sorts tasks based on status (todo first) and then by priority
 * @param tasks Array of tasks to sort
 * @returns Sorted array of tasks
 */
function sortTasksByStatusAndPriority(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    // First sort by completion status (incomplete tasks first)
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }
    
    // For tasks with the same completion status, sort by priority
    const priorityA = PRIORITY_ORDER[a.priority?.toLowerCase() || 'medium'] || 2;
    const priorityB = PRIORITY_ORDER[b.priority?.toLowerCase() || 'medium'] || 2;
    
    return priorityA - priorityB;
  });
}

/**
 * Handles requests to prioritize and sort tasks in the tasks.json file
 * @param prompt The user's prompt text
 * @param stream The chat response stream
 * @param toolManager The tool manager instance
 */
export async function handlePrioritizeTasksRequest(
  prompt: string, 
  stream: vscode.ChatResponseStream, 
  toolManager: ToolManager,
): Promise<void> {
  console.log('🔄 Processing prioritize tasks request:', prompt);
  await showProgress(stream);
  
  await streamMarkdown(stream, `🔄 **Prioritizing tasks in your collection**`);
  
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
    
    // Count tasks before sorting for reporting
    const totalTasks = tasksData.tasks.length;
    const openTasks = tasksData.tasks.filter(task => !task.completed).length;
    const completedTasks = totalTasks - openTasks;
    
    // Sort tasks by status and priority
    tasksData.tasks = sortTasksByStatusAndPriority(tasksData.tasks);
    
    // Write back sorted tasks to tasks.json
    await writeTasksJson(toolManager, tasksJsonPath, tasksData);
    
    // Log the prioritization
    logWithChannel(LogLevel.INFO, '✅ Tasks prioritized', {
      taskCount: totalTasks,
      openTasks,
      completedTasks,
    });
    
    // Send success message
    await streamMarkdown(stream, `
I'm your huckleberry. I've prioritized your tasks faster than you can say "Why Johnny Ringo, you look like somebody just walked over your grave."

Tasks have been sorted by:
1. Status (open tasks before completed tasks)
2. Priority (critical → high → medium → low)

**Summary:**
- Total Tasks: ${totalTasks}
- Open Tasks: ${openTasks}
- Completed Tasks: ${completedTasks}

You can view your prioritized tasks with: \`@Huckleberry List all tasks\`
    `);
    
  } catch (error) {
    console.error('Failed to prioritize tasks:', error);
    await streamMarkdown(stream, `❌ Failed to prioritize tasks: ${error instanceof Error ? error.message : String(error)}`);
  }
}