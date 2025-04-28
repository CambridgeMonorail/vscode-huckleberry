/**
 * Handler for parsing requirements and creating tasks
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
} from './taskUtils';

/**
 * Extracts file path from user prompt
 * @param prompt The user's prompt text
 * @returns The file path to parse, or null if not found
 */
function extractFilePath(prompt: string): string | null {
  // Try to match file path format
  const filePathMatch = prompt.match(/parse\s+['"]?([^'"]+?)['"]?\s+and\s+create\s+tasks/i);

  if (filePathMatch && filePathMatch[1]) {
    return filePathMatch[1].trim();
  }

  return null;
}

/**
 * Parses a requirements document and extracts potential tasks
 * @param content The document content to parse
 * @returns Array of extracted tasks with descriptions and priorities
 */
function parseRequirements(content: string): Array<{ description: string; priority: TaskPriority }> {
  const tasks: Array<{ description: string; priority: TaskPriority }> = [];
  const lines = content.split('\n');

  // Pattern matching for common requirement formats
  const requirementPatterns = [
    { regex: /^[\s-*]*\[\s?\]\s+(.+)/i, priority: 'medium' as TaskPriority },
    { regex: /^REQ-\d+:\s*(.+)/i, priority: 'high' as TaskPriority },
    { regex: /^MUST:\s*(.+)/i, priority: 'critical' as TaskPriority },
    { regex: /^SHOULD:\s*(.+)/i, priority: 'medium' as TaskPriority },
    { regex: /^MAY:\s*(.+)/i, priority: 'low' as TaskPriority },
    { regex: /^[\s]*[\d.•*-]+\s+(.*\b(should|must|will|shall)\b.*)/i, priority: 'medium' as TaskPriority },
    { regex: /^#+\s+(.*\b(implement|create|add|build)\b.*)/i, priority: 'medium' as TaskPriority },
    { regex: /^\[\s*high\s*\]\s*(.+)/i, priority: 'high' as TaskPriority },
    { regex: /^\[\s*medium\s*\]\s*(.+)/i, priority: 'medium' as TaskPriority },
    { regex: /^\[\s*low\s*\]\s*(.+)/i, priority: 'low' as TaskPriority },
    { regex: /^\[\s*critical\s*\]\s*(.+)/i, priority: 'critical' as TaskPriority },
  ];

  // Process each line for potential requirements
  for (const line of lines) {
    for (const pattern of requirementPatterns) {
      const match = line.match(pattern.regex);
      if (match && match[1]) {
        const description = match[1].trim();
        // Skip empty descriptions or very short ones
        if (description && description.length > 5) {
          tasks.push({
            description,
            priority: pattern.priority,
          });
        }
        break; // Stop after first match for this line
      }
    }
  }

  return tasks;
}

/**
 * Interface for requirement parsed from the language model
 */
interface _ParsedRequirement {
  description: string;
  priority?: string;
  [key: string]: unknown;
}

/**
 * Uses VS Code Language Model API to extract requirements from document content 
 * when deterministic parsing doesn't find any requirements
 * @param content The document content to parse
 * @param _toolManager The tool manager to potentially access tools
 * @returns Promise resolving to array of extracted requirements with descriptions and priorities
 */
async function parseRequirementsWithLanguageModel(
  content: string,
  _toolManager?: ToolManager,
): Promise<Array<{ description: string; priority: TaskPriority }>> {
  try {
    // Check if VS Code Language Model API is available
    if (!vscode.lm) {
      console.log('Language Model API not available, skipping LLM-based parsing');
      return [];
    }

    console.log('Using Language Model API to extract requirements');

    // Define the system prompt for requirement extraction
    const systemPrompt = `
Extract requirements from the provided document. 
For each requirement, identify:
1. The requirement text
2. Its priority (critical, high, medium, or low)

Return the results as a JSON array with objects containing:
{
  "description": "The requirement text",
  "priority": "high" | "medium" | "low" | "critical"
}

Guidelines for determining priority:
- critical: Security issues, blocking features, essential functionality
- high: Important features, significant improvements
- medium: Standard features, enhancements
- low: Nice-to-have features, minor improvements

If priority isn't explicitly mentioned, infer it from the language and context.
`;

    try {
      // Select a language model - using the correct selector structure
      const [model] = await vscode.lm.selectChatModels();

      if (!model) {
        console.log('No language model available');
        return [];
      }

      // Create chat messages using the static methods instead of constructor with string roles
      const messages = [
        vscode.LanguageModelChatMessage.Assistant(systemPrompt),
        vscode.LanguageModelChatMessage.User(content),
      ];

      // Send request to the language model with justification in the correct place
      const result = await model.sendRequest(
        messages,
        {
          justification: 'Huckleberry needs to analyze requirements document to extract actionable tasks',
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
      const parsedRequirements = JSON.parse(jsonContent);

      // Validate and normalize the results
      return parsedRequirements
        .filter((req: Record<string, unknown>): boolean => {
          return !!req && !!req['description'] && typeof req['description'] === 'string';
        })
        .map((req: Record<string, unknown>): { description: string; priority: TaskPriority } => {
          const description = req['description'] as string;
          const priority = req['priority'] as string | undefined;

          return {
            description: description.trim(),
            priority: (priority && typeof priority === 'string' && ['critical', 'high', 'medium', 'low'].includes(priority))
              ? priority as TaskPriority
              : 'medium' as TaskPriority,
          };
        })
        .filter((req: { description: string; priority: TaskPriority }): boolean => {
          return req.description.length > 5;
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
    console.error('Error in parseRequirementsWithLanguageModel:', error);
    return [];
  }
}

/**
 * Handles parsing a requirements document and creating tasks from it
 * @param prompt The user's prompt text
 * @param stream The chat response stream
 * @param toolManager The tool manager instance
 */
export async function handleParseRequirementsRequest(
  prompt: string,
  stream: vscode.ChatResponseStream,
  toolManager: ToolManager,
): Promise<void> {
  console.log('📝 Parsing requirements document...');
  await showProgress(stream);
  await streamMarkdown(stream, `I'm your huckleberry. I'll parse those requirements faster than Doc can count cards.`);

  try {
    const { workspaceFolder, tasksJsonPath } = await getWorkspacePaths();
    const _config = getConfiguration();

    // Get the tools we need
    const readFileTool = toolManager.getTool('readFile');
    if (!readFileTool) {
      throw new Error('Required tools not found');
    }

    // Extract file path from prompt
    const filePath = extractFilePath(prompt);
    if (!filePath) {
      await streamMarkdown(stream, `
I need to know which file to parse, darlin'. Try asking like this:
      
\`@Huckleberry Parse requirements.md and create tasks\`
      `);
      return;
    }

    // Resolve file path (absolute or workspace-relative)
    const absoluteFilePath = filePath.startsWith('/') || filePath.includes(':')
      ? filePath
      : vscode.Uri.joinPath(vscode.Uri.file(workspaceFolder), filePath).fsPath;

    await streamMarkdown(stream, `Parsing requirements from: \`${filePath}\``);

    // Read file content
    let fileContent: string;
    try {
      // Check if file exists first
      await vscode.workspace.fs.stat(vscode.Uri.file(absoluteFilePath));

      // Read file using vscode API
      const content = await vscode.workspace.fs.readFile(vscode.Uri.file(absoluteFilePath));
      fileContent = new TextDecoder().decode(content);
    } catch {
      await streamMarkdown(stream, `
I couldn't find or read the file \`${filePath}\`. Make sure the file exists and try again.
      
You might want to check the path and file format. I work well with markdown, text, and most document formats.
      `);
      return;
    }

    // Parse requirements from content using deterministic approach
    let extractedRequirements = parseRequirements(fileContent);

    // If deterministic parsing didn't find anything, try the language model approach
    if (extractedRequirements.length === 0) {
      await streamMarkdown(stream, `
Regular parsing didn't find standard requirement formats. Trying AI-powered extraction...
      `);

      extractedRequirements = await parseRequirementsWithLanguageModel(fileContent, toolManager);
    }

    if (extractedRequirements.length === 0) {
      await streamMarkdown(stream, `
I've read through \`${filePath}\`, but I couldn't identify any requirements to convert to tasks.
      
The file may not contain content in a recognizable requirements format. I look for:
- Checkbox items like "- [ ] Implement feature X"
- REQ-XXX style requirements
- MUST/SHOULD/MAY statements
- Numbered or bulleted items with requirement-like language
      
You might need to format your requirements more explicitly or create tasks manually.
      `);
      return;
    }

    await streamMarkdown(stream, `
Found ${extractedRequirements.length} potential requirements. Creating tasks for each one...
    `);

    // Read existing tasks.json or create new one
    const tasksData = await readTasksJson(toolManager, tasksJsonPath);

    // Map extracted requirements to tasks
    const createdTasks: Task[] = [];

    for (const req of extractedRequirements) {
      // Generate task ID sequentially from existing tasks
      const taskId = generateTaskId(tasksData);

      // Create new task - using the correct function signature
      const newTask = createTaskObject(
        taskId,
        req.description,
        req.priority,
        {
          description: `Task created from requirements in ${filePath}`,
          source: {
            file: filePath,
            line: 1, // Default to line 1 since we don't track specific line numbers during parsing
          },
          tags: ['requirement'],
        },
      );

      // Add to tasks collection
      tasksData.tasks.push(newTask);
      createdTasks.push(newTask);
    }

    // Write back to tasks.json
    await writeTasksJson(toolManager, tasksJsonPath, tasksData);

    // Group tasks by priority for reporting
    const tasksByPriority: Record<string, Task[]> = {
      critical: [],
      high: [],
      medium: [],
      low: [],
    };

    createdTasks.forEach(task => {
      if (task.priority) {
        tasksByPriority[task.priority].push(task);
      }
    });

    // Send success message with Doc Holliday flair
    await streamMarkdown(stream, `
I'm your huckleberry. I've found ${extractedRequirements.length} requirements and created tasks for each one.

${tasksByPriority['critical'].length > 0 ? `
### ${priorityEmoji.critical} Critical Priority
${tasksByPriority['critical'].map(t => `- **${t.id}**: ${t.title}`).join('\n')}
` : ''}

${tasksByPriority['high'].length > 0 ? `
### ${priorityEmoji.high} High Priority
${tasksByPriority['high'].map(t => `- **${t.id}**: ${t.title}`).join('\n')}
` : ''}

${tasksByPriority['medium'].length > 0 ? `
### ${priorityEmoji.medium} Medium Priority
${tasksByPriority['medium'].map(t => `- **${t.id}**: ${t.title}`).join('\n')}
` : ''}

${tasksByPriority['low'].length > 0 ? `
### ${priorityEmoji.low} Low Priority
${tasksByPriority['low'].map(t => `- **${t.id}**: ${t.title}`).join('\n')}
` : ''}

It appears your requirements are well documented. Let's turn those words into action.

All tasks have been saved to your task collection. You can mark any as complete with: \`@Huckleberry Mark task TASK-XXX as complete\`
    `);
  } catch (error) {
    console.error('Failed to parse requirements:', error);
    await streamMarkdown(stream, `
**Well now, I seem to be having a bad day.**

Failed to parse requirements: ${error instanceof Error ? error.message : String(error)}

I'm not quite as steady as I used to be. Try again, darlin'.
    `);
  }
}