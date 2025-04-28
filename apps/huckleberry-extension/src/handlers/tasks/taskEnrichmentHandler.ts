/**
 * Handler for enriching tasks with additional context
 */
import * as vscode from 'vscode';
import * as path from 'path';
import { Task } from '../../types';
import { ToolManager } from '../../services/toolManager';
import { streamMarkdown, showProgress } from '../../utils/uiHelpers';
import { getConfiguration } from '../../config/index';
import {
  getWorkspacePaths,
  readTasksJson,
  writeTasksJson,
  getTaskById,
} from './taskUtils';

/**
 * Extracts task ID from the user's prompt
 * @param prompt The user's prompt text
 * @returns The extracted task ID or null if not found
 */
function extractTaskId(prompt: string): string | null {
  const taskIdMatch = prompt.match(/(?:task|id)\s+([A-Z]+-\d+)/i);
  return taskIdMatch ? taskIdMatch[1].toUpperCase() : null;
}

/**
 * Enriches a task created from a TODO comment with code context
 * @param task The task to enrich
 * @param toolManager The tool manager instance
 * @returns The enriched task content
 */
async function enrichTodoTask(
  task: Task,
  toolManager: ToolManager,
): Promise<Task> {
  if (!task.source?.file || !task.source?.line) {
    throw new Error('Task does not have valid source information');
  }

  // Use semantic search to find context around the TODO
  const codeContext = await toolManager.executeTool('semantic_search', {
    query: `Find code context around line ${task.source.line} in ${task.source.file} including function/class definitions and related comments`,
  });

  // Generate enhanced description using the language model
  const enhancedDescription = await toolManager.executeTool('get_vscode_api', {
    query: `Generate a comprehensive description of the TODO task "${task.title}" in the context of ${codeContext}`,
  });

  // Update task with enriched content
  task.enrichedContent = {
    enhancedDescription: enhancedDescription as string,
    contextualContent: codeContext as string,
    enrichedAt: new Date().toISOString(),
    enrichmentType: 'code-context',
  };

  return task;
}

/**
 * Enriches a task created from requirements with document context
 * @param task The task to enrich
 * @param toolManager The tool manager instance
 * @returns The enriched task content
 */
async function enrichRequirementTask(
  task: Task,
  toolManager: ToolManager,
): Promise<Task> {
  if (!task.source?.uri) {
    throw new Error('Task does not have valid source URI');
  }

  // Use semantic search to find related requirements context
  const requirementsContext = await toolManager.executeTool('semantic_search', {
    query: `Find requirements context around "${task.title}" in ${task.source.uri} including related requirements and section context`,
  });

  // Generate enhanced description using the language model
  const enhancedDescription = await toolManager.executeTool('get_vscode_api', {
    query: `Generate a comprehensive description of the requirement "${task.title}" in the context of ${requirementsContext}`,
  });

  // Update task with enriched content
  task.enrichedContent = {
    enhancedDescription: enhancedDescription as string,
    contextualContent: requirementsContext as string,
    enrichedAt: new Date().toISOString(),
    enrichmentType: 'requirements-context',
  };

  return task;
}

/**
 * Updates the markdown file for an enriched task
 * @param task The enriched task
 * @param workspaceFolder The workspace folder path
 * @param toolManager The tool manager instance
 */
async function updateTaskMarkdown(
  task: Task,
  workspaceFolder: string,
  toolManager: ToolManager,
): Promise<void> {
  const config = getConfiguration();
  if (config.taskFileTemplate !== 'markdown') {
    return;
  }

  const writeFileTool = toolManager.getTool('writeFile');
  if (!writeFileTool) {
    throw new Error('WriteFileTool not found');
  }

  const taskFilePath = path.join(
    workspaceFolder,
    config.defaultTasksLocation,
    `${task.id}.md`,
  );

  // Add enriched content section to markdown
  const enrichedContent = `
## Enriched Context
*Last updated: ${new Date(
    task.enrichedContent?.enrichedAt || '',
  ).toLocaleDateString()}*

### Enhanced Description
${task.enrichedContent?.enhancedDescription || ''}

### Source Context
\`\`\`
${task.enrichedContent?.contextualContent || ''}
\`\`\`
`;

  // Read existing content
  const readFileTool = toolManager.getTool('readFile');
  if (!readFileTool) {
    throw new Error('ReadFileTool not found');
  }

  let taskContent = (await readFileTool.execute({
    path: taskFilePath,
  })) as string;

  // Remove any existing enriched content section
  taskContent = taskContent.replace(/\n## Enriched Context[\s\S]*$/, '');

  // Add new enriched content
  taskContent += enrichedContent;

  // Write updated content
  await writeFileTool.execute({
    path: taskFilePath,
    content: taskContent,
  });
}

/**
 * Handles requests to enrich a task with additional context
 * @param prompt The user's prompt text
 * @param stream The chat response stream
 * @param toolManager The tool manager instance
 */
export async function handleEnrichTaskRequest(
  prompt: string,
  stream: vscode.ChatResponseStream,
  toolManager: ToolManager,
): Promise<void> {
  console.log('🔍 Processing enrich task request:', prompt);
  await showProgress(stream);

  const taskId = extractTaskId(prompt);
  if (!taskId) {
    await streamMarkdown(
      stream,
      `❌ Please specify a task ID (e.g., TASK-123) to enrich.`,
    );
    return;
  }

  console.log('🎯 Target task ID:', taskId);
  await streamMarkdown(
    stream,
    `🔍 **Enriching task ${taskId} with additional context**`,
  );

  try {
    const { workspaceFolder, tasksJsonPath } = await getWorkspacePaths();
    const tasksData = await readTasksJson(toolManager, tasksJsonPath);

    // Find the task
    const task = getTaskById(tasksData, taskId);
    if (!task) {
      await streamMarkdown(
        stream,
        `❌ Task ${taskId} not found in your task collection.`,
      );
      return;
    }

    // Enrich based on task source type
    if (task.source?.context === 'requirements') {
      await enrichRequirementTask(task, toolManager);
    } else {
      await enrichTodoTask(task, toolManager);
    }

    // Update markdown file if using markdown template
    await updateTaskMarkdown(task, workspaceFolder, toolManager);

    // Write back to tasks.json
    await writeTasksJson(toolManager, tasksJsonPath, tasksData);

    // Send success message
    await streamMarkdown(
      stream,
      `
✨ Task ${taskId} has been enriched with additional context.

${task.enrichedContent?.enhancedDescription
    ? `
### Enhanced Description
${task.enrichedContent.enhancedDescription}
`
    : ''
}

You can view the full enriched content in the task's markdown file.
    `,
    );
  } catch (error) {
    console.error('Failed to enrich task:', error);
    await streamMarkdown(
      stream,
      `❌ Failed to enrich task: ${error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}
