/**
 * Handler for breaking tasks into subtasks
 */
import * as vscode from 'vscode';
import { Task, TaskPriority } from '../../types';
import { ToolManager } from '../../services/toolManager';
import { streamMarkdown, showProgress } from '../../utils/uiHelpers';
import { getConfiguration } from '../../config/index';
import {
  getWorkspacePaths,
  readTasksJson,
  writeTasksJson,
  generateTaskId,
  priorityEmoji,
  createTaskObject,
  getTaskById,
} from './taskUtils';

/**
 * Extracts task ID from user prompt
 * @param prompt The user's prompt text
 * @returns The task ID to decompose, or null if not found
 */
function extractTaskId(prompt: string): string | null {
  // Try to match task ID format
  const taskIdMatch = prompt.match(/break\s+(?:task\s+)?([A-Za-z]+-\d+)\s+into\s+subtasks/i);

  if (taskIdMatch && taskIdMatch[1]) {
    return taskIdMatch[1].trim().toUpperCase();
  }

  return null;
}

/**
 * Uses VS Code Language Model API to analyze task and suggest subtasks
 * @param task The task to decompose
 * @returns Promise resolving to array of suggested subtasks
 */
async function analyzeTaskForDecomposition(
  task: Task,
): Promise<Array<{ description: string; priority: TaskPriority }>> {
  try {
    // Check if VS Code Language Model API is available
    if (!vscode.lm) {
      console.log('Language Model API not available, cannot analyze task for decomposition');
      return [];
    }

    console.log('Using Language Model API to analyze task for decomposition');

    // Ensure task priority is valid and never undefined
    const taskPriority = task.priority || 'medium' as TaskPriority;

    // Define the system prompt for task decomposition
    const systemPrompt = `
Analyze the following task and determine if it can be broken down into subtasks. 
If it's a complex task that should be decomposed, suggest 3-7 logical subtasks that would help complete it.
Each subtask should be:
1. Specific and actionable
2. A logical step toward completing the parent task
3. Something that can be worked on independently

For each subtask, determine an appropriate priority relative to the parent task's priority of ${taskPriority}.

Return the results as a JSON array with objects containing:
{
  "description": "The subtask description",
  "priority": "high" | "medium" | "low" | "critical"
}

If the task is already atomic and shouldn't be broken down further, return an empty array.
`;

    try {
      // Select a language model
      const [model] = await vscode.lm.selectChatModels();

      if (!model) {
        console.log('No language model available');
        return [];
      }

      // Create the task description that includes all available details
      const taskDetails = `
Task ID: ${task.id}
Title: ${task.title}
Priority: ${taskPriority}
Status: ${task.status || 'open'}
${task.description ? `Description: ${task.description}` : ''}
${task.dueDate ? `Due date: ${task.dueDate}` : ''}
${task.tags && task.tags.length > 0 ? `Tags: ${task.tags.join(', ')}` : ''}
`;

      // Create chat messages
      const messages = [
        vscode.LanguageModelChatMessage.Assistant(systemPrompt),
        vscode.LanguageModelChatMessage.User(taskDetails),
      ];

      // Send request to the language model
      const result = await model.sendRequest(
        messages,
        {
          justification: 'Huckleberry needs to analyze tasks and suggest appropriate subtasks for better project management',
        },
        new vscode.CancellationTokenSource().token,
      );

      // Parse the response as JSON
      let resultText = '';
      for await (const chunk of result.text) {
        resultText += chunk;
      }

      // Extract JSON from the response (handling potential markdown code blocks)
      const jsonMatch = resultText.match(/```(?:json)?\s*([\s\S]+?)\s*```/) ||
        resultText.match(/\[\s*\{\s*"description"/);

      let jsonContent = jsonMatch ?
        (jsonMatch[1] || resultText) :
        resultText;

      // Clean up the JSON content
      if (!jsonContent.trim().startsWith('[')) {
        jsonContent = `[${jsonContent}]`;
      }

      // Parse the JSON
      const parsedSubtasks = JSON.parse(jsonContent);

      // Validate and normalize the results
      return parsedSubtasks
        .filter((subtask: Record<string, unknown>): boolean => {
          return !!subtask && !!subtask['description'] && typeof subtask['description'] === 'string';
        })
        .map((subtask: Record<string, unknown>): { description: string; priority: TaskPriority } => {
          // Ensure priority is never undefined by defaulting to the parent task's priority
          const subtaskPriority = (subtask['priority'] && ['critical', 'high', 'medium', 'low'].includes(subtask['priority'] as string))
            ? subtask['priority'] as TaskPriority
            : taskPriority; // Default to parent task's priority if invalid

          return {
            description: (subtask['description'] as string).trim(),
            priority: subtaskPriority,
          };
        })
        .filter((subtask: { description: string; priority: TaskPriority }): boolean => {
          return subtask.description.length > 5;
        });
    } catch (error) {
      if (error instanceof vscode.LanguageModelError) {
        console.error('Language Model Error:', error.message, error.code);
        if (error.cause) {
          console.error('Cause:', error.cause);
        }
      } else {
        console.error('Error using Language Model API:', error);
      }
      return [];
    }
  } catch (error) {
    console.error('Error in analyzeTaskForDecomposition:', error);
    return [];
  }
}

/**
 * Handles breaking a task into subtasks
 * @param prompt The user's prompt text
 * @param stream The chat response stream
 * @param toolManager The tool manager instance
 */
export async function handleBreakTaskRequest(
  prompt: string,
  stream: vscode.ChatResponseStream,
  toolManager: ToolManager,
): Promise<void> {
  console.log('📝 Breaking task into subtasks...');
  await showProgress(stream);
  await streamMarkdown(stream, `I'm your huckleberry. I'll break that task down faster than a gunslinger's draw.`);

  try {
    const { workspaceFolder: _workspaceFolder, tasksJsonPath } = await getWorkspacePaths();
    const _config = getConfiguration();

    // Extract task ID from prompt
    const taskId = extractTaskId(prompt);
    if (!taskId) {
      await streamMarkdown(stream, `
I need to know which task to break down, darlin'. Try asking like this:
      
\`@Huckleberry Break TASK-123 into subtasks\`
      `);
      return;
    }

    await streamMarkdown(stream, `Analyzing task ${taskId} for potential decomposition...`);

    // Read tasks.json
    const tasksData = await readTasksJson(toolManager, tasksJsonPath);

    // Find the specified task
    const parentTask = getTaskById(tasksData, taskId);
    if (!parentTask) {
      await streamMarkdown(stream, `
I couldn't find task \`${taskId}\`. Make sure you've got the right ID, partner.
      
You can list all tasks with \`@Huckleberry List all tasks\`
      `);
      return;
    }

    // Analyze the task using language model to determine appropriate subtasks
    const suggestedSubtasks = await analyzeTaskForDecomposition(parentTask);

    if (suggestedSubtasks.length === 0) {
      await streamMarkdown(stream, `
After analyzing task ${taskId}: "${parentTask.title}", I don't think it needs to be broken down further. It seems to be atomic enough as is.

If you'd still like to create subtasks, try providing more details about the task first, or manually create them with \`@Huckleberry Create a task to...\`
      `);
      return;
    }

    // Create subtasks based on suggestions
    const createdSubtasks: Task[] = [];

    // Initialize subtasks array for parent task if it doesn't exist
    if (!parentTask.subtasks) {
      parentTask.subtasks = [];
    }

    for (const subtask of suggestedSubtasks) {
      // Generate subtask ID based on existing tasks
      const subtaskId = generateTaskId(tasksData);

      // Create new subtask
      const newSubtask = createTaskObject(
        subtaskId,
        subtask.description,
        subtask.priority,
        {
          description: `Subtask of ${parentTask.id}: ${parentTask.title}`,
          parentTaskId: parentTask.id,
          tags: [...(parentTask.tags || []), 'subtask'],
        },
      );

      // Add to tasks collection
      tasksData.tasks.push(newSubtask);

      // Add subtask ID to parent task's subtasks array
      parentTask.subtasks.push(subtaskId);

      createdSubtasks.push(newSubtask);
    }

    // Write back to tasks.json
    await writeTasksJson(toolManager, tasksJsonPath, tasksData);

    // Group subtasks by priority for reporting
    const subtasksByPriority: Record<string, Task[]> = {
      critical: [],
      high: [],
      medium: [],
      low: [],
    };

    createdSubtasks.forEach(task => {
      if (task.priority) {
        subtasksByPriority[task.priority].push(task);
      }
    });

    // Send success message with Doc Holliday flair
    await streamMarkdown(stream, `
I've broken down task ${parentTask.id}: "${parentTask.title}" into ${createdSubtasks.length} subtasks:

${subtasksByPriority['critical'].length > 0 ? `
### ${priorityEmoji.critical} Critical Priority
${subtasksByPriority['critical'].map(t => `- **${t.id}**: ${t.title}`).join('\n')}
` : ''}

${subtasksByPriority['high'].length > 0 ? `
### ${priorityEmoji.high} High Priority
${subtasksByPriority['high'].map(t => `- **${t.id}**: ${t.title}`).join('\n')}
` : ''}

${subtasksByPriority['medium'].length > 0 ? `
### ${priorityEmoji.medium} Medium Priority
${subtasksByPriority['medium'].map(t => `- **${t.id}**: ${t.title}`).join('\n')}
` : ''}

${subtasksByPriority['low'].length > 0 ? `
### ${priorityEmoji.low} Low Priority
${subtasksByPriority['low'].map(t => `- **${t.id}**: ${t.title}`).join('\n')}
` : ''}

These subtasks have been linked to the parent task. You can mark any as complete with: \`@Huckleberry Mark task TASK-XXX as complete\`
    `);
  } catch (error) {
    console.error('Failed to break task into subtasks:', error);
    await streamMarkdown(stream, `
**Well now, I seem to be having a bad day.**

Failed to break task into subtasks: ${error instanceof Error ? error.message : String(error)}

I'm not quite as steady as I used to be. Try again, darlin'.
    `);
  }
}