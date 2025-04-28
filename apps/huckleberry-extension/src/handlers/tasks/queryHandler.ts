/**
 * Handler for task query operations (listing, filtering tasks)
 */
import * as vscode from 'vscode';
import { ToolManager } from '../../services/toolManager';
import { streamMarkdown, showProgress } from '../../utils/uiHelpers';
import {
  getWorkspacePaths,
  readTasksJson,
  priorityEmoji,
} from './taskUtils';

/**
 * Handles requests to query tasks by priority
 * @param prompt The user's prompt text
 * @param stream The chat response stream
 * @param toolManager The tool manager instance
 */
export async function handlePriorityTaskQuery(
  prompt: string,
  stream: vscode.ChatResponseStream,
  toolManager: ToolManager,
): Promise<void> {
  console.log('🔍 Processing priority task query:', prompt);

  // Determine which priority level the user is asking about
  let priority = 'high';
  if (prompt.toLowerCase().includes('low priority')) {
    priority = 'low';
  } else if (prompt.toLowerCase().includes('medium priority')) {
    priority = 'medium';
  } else if (prompt.toLowerCase().includes('critical priority')) {
    priority = 'critical';
  }
  console.log('📊 Detected priority level:', priority);

  try {
    const { tasksJsonPath } = await getWorkspacePaths();

    // Read and parse tasks.json
    const tasksData = await readTasksJson(toolManager, tasksJsonPath);

    // Filter tasks by priority
    const priorityTasks = tasksData.tasks.filter(task =>
      task.priority?.toLowerCase() === priority && !task.completed,
    );

    await streamMarkdown(stream, `📋 **${priority.toUpperCase()} Priority Tasks**`);

    if (priorityTasks.length === 0) {
      await streamMarkdown(stream, `\nNo ${priority} priority tasks found.`);
      return;
    }

    // Format and display tasks with proper null/undefined handling
    const taskList = priorityTasks
      .map((task, index) => {
        const priorityIcon = task.priority ? priorityEmoji[task.priority] || '⚪' : '⚪';
        return `${index + 1}. ${priorityIcon} **${task.id}**: ${task.title}`;
      })
      .join('\n');

    await streamMarkdown(stream, `\n${taskList}`);

    await streamMarkdown(stream, `\nYou can mark any task as complete with: \`@Huckleberry Mark task TASK-XXX as complete\``);
  } catch (error) {
    console.error('Failed to retrieve tasks:', error);
    await streamMarkdown(stream, `❌ Failed to retrieve tasks: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Handles requests to list all tasks
 * @param prompt The user's prompt text
 * @param stream The chat response stream
 * @param toolManager The tool manager instance
 */
export async function handleReadTasksRequest(
  prompt: string,
  stream: vscode.ChatResponseStream,
  toolManager: ToolManager,
): Promise<void> {
  console.log('📋 Processing read tasks request:', prompt);
  await showProgress(stream);

  try {
    const { tasksJsonPath } = await getWorkspacePaths();

    // Read and parse tasks.json
    const tasksData = await readTasksJson(toolManager, tasksJsonPath);

    // Check if we have any tasks
    if (!tasksData.tasks || tasksData.tasks.length === 0) {
      await streamMarkdown(stream, `
📋 **Your Tasks**

No tasks found. Create a task with: \`@Huckleberry Create a task to...\`
      `);
      return;
    }

    // Separate tasks by completion status
    const openTasks = tasksData.tasks.filter(task => !task.completed);
    const completedTasks = tasksData.tasks.filter(task => task.completed);

    // Sort open tasks by priority (critical, high, medium, low)
    const priorityOrder: Record<string, number> = {
      'critical': 0,
      'high': 1,
      'medium': 2,
      'low': 3,
    };

    openTasks.sort((a, b) => {
      const priorityA = priorityOrder[a.priority?.toLowerCase() || 'medium'] || 2;
      const priorityB = priorityOrder[b.priority?.toLowerCase() || 'medium'] || 2;
      return priorityA - priorityB;
    });

    // Generate output
    await streamMarkdown(stream, `📋 **Your Tasks**`);

    if (openTasks.length > 0) {
      await streamMarkdown(stream, `\n### Open Tasks (${openTasks.length})`);

      const openTasksList = openTasks
        .map(task => {
          const priorityIcon = task.priority ? priorityEmoji[task.priority] || '⚪' : '⚪';
          return `- ${priorityIcon} **${task.id}**: ${task.title}`;
        })
        .join('\n');

      await streamMarkdown(stream, openTasksList);
    } else {
      await streamMarkdown(stream, `\n### Open Tasks (0)\n\nNo open tasks. Create one with: \`@Huckleberry Create a task to...\``);
    }

    if (completedTasks.length > 0) {
      await streamMarkdown(stream, `\n### Completed Tasks (${completedTasks.length})`);

      // Show only the last 5 completed tasks to avoid clutter
      const recentCompletedTasks = completedTasks.slice(0, 5);
      const completedTasksList = recentCompletedTasks
        .map(task => `- ✓ **${task.id}**: ${task.title}`)
        .join('\n');

      await streamMarkdown(stream, completedTasksList);

      if (completedTasks.length > 5) {
        await streamMarkdown(stream, `\n_...and ${completedTasks.length - 5} more completed tasks._`);
      }
    }

    await streamMarkdown(stream, `
I'm your huckleberry. These are your tasks, darlin'.

You can:
- Mark tasks complete with: \`@Huckleberry Mark task TASK-XXX as complete\`
- Change priority with: \`@Huckleberry Mark task TASK-XXX as high priority\`
- Scan for new TODOs with: \`@Huckleberry Scan for TODOs in the codebase\`
    `);

  } catch (error) {
    console.error('Failed to read tasks:', error);
    await streamMarkdown(stream, `❌ Failed to read tasks: ${error instanceof Error ? error.message : String(error)}`);
  }
}