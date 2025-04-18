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
  createTaskObject
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
    // "- [ ]" or "* [ ]" checkbox format
    { regex: /^[\s-*]*\[\s?\]\s+(.+)/i, priority: 'medium' as TaskPriority },
    
    // "REQ-XXX:" format
    { regex: /^REQ-\d+:\s*(.+)/i, priority: 'high' as TaskPriority },
    
    // "MUST:" or "SHOULD:" or "MAY:" format (RFC style)
    { regex: /^MUST:\s*(.+)/i, priority: 'critical' as TaskPriority },
    { regex: /^SHOULD:\s*(.+)/i, priority: 'medium' as TaskPriority },
    { regex: /^MAY:\s*(.+)/i, priority: 'low' as TaskPriority },
    
    // Numbered or bulleted list items that look like requirements
    { regex: /^[\s]*[\d.•*-]+\s+(.*\b(should|must|will|shall)\b.*)/i, priority: 'medium' as TaskPriority },
    
    // Headers with requirement-like language
    { regex: /^#+\s+(.*\b(implement|create|add|build)\b.*)/i, priority: 'medium' as TaskPriority }
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
            priority: pattern.priority
          });
        }
        break; // Stop after first match for this line
      }
    }
  }
  
  return tasks;
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
  toolManager: ToolManager
): Promise<void> {
  console.log('📝 Parsing requirements document...');
  await showProgress(stream);
  await streamMarkdown(stream, `I'm your huckleberry. I'll parse those requirements faster than Doc can count cards.`);
  
  try {
    const { workspaceFolder, tasksJsonPath } = await getWorkspacePaths();
    const config = getConfiguration();
    
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
    } catch (error) {
      await streamMarkdown(stream, `
I couldn't find or read the file \`${filePath}\`. Make sure the file exists and try again.
      
You might want to check the path and file format. I work well with markdown, text, and most document formats.
      `);
      return;
    }
    
    // Parse requirements from content
    const extractedRequirements = parseRequirements(fileContent);
    
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
      // Generate task ID
      const taskId = generateTaskId();
      
      // Create new task - using the correct function signature
      const newTask = createTaskObject(
        taskId, 
        req.description, 
        req.priority,
        {
          description: `Task created from requirements in ${filePath}`,
          source: {
            file: filePath,
            line: 1 // Default to line 1 since we don't track specific line numbers during parsing
          },
          tags: ['requirement']
        }
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
      low: []
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