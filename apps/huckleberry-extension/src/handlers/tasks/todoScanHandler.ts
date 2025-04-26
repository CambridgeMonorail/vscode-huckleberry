/**
 * Handler for scanning TODOs in codebase
 */
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { Task, TaskPriority, TaskStatus } from '../../types';
import { ToolManager } from '../../services/toolManager';
import { streamMarkdown, showProgress } from '../../utils/uiHelpers';
import { getConfiguration } from '../../config/index';
import {
  getWorkspacePaths,
  readTasksJson,
  writeTasksJson,
  generateTaskId,
  priorityEmoji
} from './taskUtils';

/**
 * Interface for representing a TODO comment found in code
 */
interface TodoComment {
  /**
   * Full file path
   */
  file: string;
  
  /**
   * Workspace-relative file path
   */
  relativePath: string;
  
  /**
   * Line number (1-based)
   */
  lineNumber: number;
  
  /**
   * The TODO comment text
   */
  comment: string;
  
  /**
   * Optional priority specified in the TODO
   */
  priority?: string;
}

/**
 * Reads and parses .gitignore file if it exists in the workspace
 * @param workspacePath The path to the workspace root
 * @returns An array of glob patterns to exclude, or empty array if no .gitignore exists
 */
async function getGitIgnoreExclusions(workspacePath: string): Promise<string[]> {
  try {
    const gitignorePath = path.join(workspacePath, '.gitignore');
    
    // Check if .gitignore exists
    const gitignoreUri = vscode.Uri.file(gitignorePath);
    try {
      await vscode.workspace.fs.stat(gitignoreUri);
    } catch (err) {
      // No .gitignore file found
      return [];
    }
    
    // Read .gitignore content
    const rawContent = await vscode.workspace.fs.readFile(gitignoreUri);
    const content = new TextDecoder().decode(rawContent);
    
    // Parse .gitignore patterns
    return parseGitignore(content);
  } catch (error) {
    console.warn('Error reading .gitignore:', error);
    return [];
  }
}

/**
 * Parse gitignore content into glob patterns
 * @param content The content of .gitignore file
 * @returns Array of glob patterns for exclusion
 */
function parseGitignore(content: string): string[] {
  const lines = content.split(/\r?\n/);
  
  return lines
    .map(line => line.trim())
    // Remove comments and empty lines
    .filter(line => line && !line.startsWith('#'))
    // Convert gitignore patterns to glob patterns
    .map(pattern => {
      // Remove leading slash if present
      if (pattern.startsWith('/')) {
        pattern = pattern.substring(1);
      }
      
      // Handle negation (!) patterns - we'll skip these for simplicity
      if (pattern.startsWith('!')) {
        return null;
      }
      
      // Convert directory indicators (trailing /) to glob
      if (pattern.endsWith('/')) {
        pattern = pattern.slice(0, -1) + '/**';
      }
      
      // Ensure all patterns are treated as globs
      return `**/${pattern}`;
    })
    .filter((pattern): pattern is string => pattern !== null);
}

/**
 * Extracts file pattern from user prompt or returns default
 * @param prompt The user's prompt text
 * @returns The file pattern to scan
 */
function extractFilePattern(prompt: string): string {
  // Try to match specific pattern format first
  const specificPatternMatch = prompt.match(/scan\s+(?:for\s+)?todos\s+in\s+(?:files\s+matching\s+)?['"]?([^'"]+?)['"]?(?:\s|$)/i);
  
  // Skip common articles and phrases that aren't actually file patterns
  const commonArticles = ['the', 'a', 'an', 'this', 'our', 'my'];
  const commonPhrases = ['codebase', 'project', 'workspace', 'repository', 'repo', 'code'];
  
  if (specificPatternMatch) {
    const pattern = specificPatternMatch[1].trim();
    
    // Skip if the pattern is just a common article or phrase
    if (commonArticles.includes(pattern.toLowerCase()) || 
        commonPhrases.includes(pattern.toLowerCase())) {
      // Fall through to other pattern matching approaches
    } else {
      return pattern;
    }
  }
  
  // Check if the user specified a file extension or common pattern
  const extensionMatch = prompt.match(/\.(js|jsx|ts|tsx|java|c|cpp|cs|py|go|rb|php|md|html|css|scss)/i);
  if (extensionMatch) {
    return `**/*${extensionMatch[0]}`;
  }
  
  // Check for specific folder mentions
  const folderMatch = prompt.match(/\b(src|lib|app|test|docs|components)\b/i);
  if (folderMatch) {
    return `${folderMatch[0]}/**/*`;
  }
  
  // Default to all common code files
  return '**/*.{js,jsx,ts,tsx,java,c,cpp,cs,py,go,rb,php}';
}

/**
 * Maps TODO priority string to TaskPriority
 * @param todoPriority The priority string from TODO comment
 * @param defaultPriority The default priority to use if not mapped
 * @returns The corresponding TaskPriority
 */
function mapTodoPriorityToTaskPriority(
  todoPriority: string | undefined,
  defaultPriority: TaskPriority
): TaskPriority {
  if (!todoPriority) {
    return defaultPriority;
  }
  
  if (todoPriority === 'high' || todoPriority === 'h' || todoPriority === '1') {
    return 'high';
  } else if (todoPriority === 'medium' || todoPriority === 'm' || todoPriority === '2') {
    return 'medium';
  } else if (todoPriority === 'low' || todoPriority === 'l' || todoPriority === '3') {
    return 'low';
  } else if (todoPriority === 'critical' || todoPriority === 'c' || todoPriority === '0') {
    return 'critical';
  }
  
  return defaultPriority;
}

/**
 * Scans codebase for TODOs and creates tasks from them
 * @param prompt The user's prompt text
 * @param stream The chat response stream
 * @param toolManager The tool manager instance
 */
export async function handleScanTodosRequest(
  prompt: string, 
  stream: vscode.ChatResponseStream, 
  toolManager: ToolManager
): Promise<void> {
  console.log('🔍 Scanning codebase for TODOs...');
  await showProgress(stream);
  await streamMarkdown(stream, `I'm your huckleberry. I'll scan this codebase for TODOs faster than Doc can pull his gun.`);
  
  try {
    const { workspaceFolder, tasksJsonPath } = await getWorkspacePaths();
    const config = getConfiguration();

    // Get the tools we need
    const writeFileTool = toolManager.getTool('writeFile');
    if (!writeFileTool) {
      throw new Error('Required tools not found');
    }

    // Get file pattern from prompt or use default
    const filePattern = extractFilePattern(prompt);
    await streamMarkdown(stream, `Scanning for TODOs in files matching: \`${filePattern}\``);
    
    // Get exclusion patterns from .gitignore if it exists
    const gitIgnoreExclusions = await getGitIgnoreExclusions(workspaceFolder);
    let excludePattern = '**/node_modules/**';
    
    if (gitIgnoreExclusions.length > 0) {
      // Add .gitignore exclusions to the exclusion pattern
      excludePattern = `{**/node_modules/**,${gitIgnoreExclusions.join(',')}}`;
      await streamMarkdown(stream, `Respecting .gitignore patterns (${gitIgnoreExclusions.length} patterns found)`);
    }
    
    // Find all matching files in the workspace, excluding patterns from .gitignore
    const files = await vscode.workspace.findFiles(filePattern, excludePattern);
    
    if (files.length === 0) {
      await streamMarkdown(stream, `No files matching \`${filePattern}\` found in this workspace.`);
      return;
    }
    
    await streamMarkdown(stream, `Found ${files.length} files to scan. Looking for TODO comments...`);
    
    // Store found TODOs
    const todos: TodoComment[] = [];
    
    // Scan each file for TODOs
    let scannedCount = 0;
    const totalFiles = files.length;
    
    for (const file of files) {
      try {
        // Read file content
        const content = await vscode.workspace.fs.readFile(file);
        const text = new TextDecoder().decode(content);
        const lines = text.split('\n');
        
        // Track our scanning progress
        scannedCount++;
        if (scannedCount % 20 === 0) {
          await streamMarkdown(stream, `Scanning progress: ${scannedCount}/${totalFiles} files...`);
        }
        
        // Check each line for TODO comments
        lines.forEach((line, index) => {
          // Match different TODO comment formats including JSX/TSX comments
          // Fix: improve the regex to better capture the full comment text
          const todoMatch = line.match(/(?:\/\/|\/\*|#|<!--|{\s*\/\*)\s*TODO(?:\((\w+)\))?:?\s*(.*?)(?:\*\/\s*}|\*\/|-->|\s*$)/i);
          if (todoMatch) {
            const priority = todoMatch[1] ? todoMatch[1].toLowerCase() : undefined;
            const comment = todoMatch[2].trim();
            const relativePath = vscode.workspace.asRelativePath(file);
            
            // Only add comments that actually have content
            if (comment && comment.length > 0) {
              todos.push({
                file: file.fsPath,
                relativePath,
                lineNumber: index + 1,
                comment,
                priority
              });
            }
          }
        });
      } catch (error) {
        console.warn(`Error scanning file ${file.fsPath}: ${error}`);
        // Continue with other files
      }
    }
    
    // Report findings
    if (todos.length === 0) {
      await streamMarkdown(stream, `
I've scanned ${totalFiles} files, but didn't find any TODO comments. 
      
I'm afraid I appear to be empty, darlin'.
      `);
      return;
    }
    
    await streamMarkdown(stream, `
Found ${todos.length} TODO comments in ${totalFiles} files. Creating tasks for each TODO...
    `);
    
    // Read existing tasks.json or create new one
    const tasksData = await readTasksJson(toolManager, tasksJsonPath);
    
    // Map found TODOs to tasks
    const createdTasks: string[] = [];
    
    for (const todo of todos) {
      // Generate task ID sequentially from existing tasks
      const taskId = generateTaskId(tasksData);
      
      // Determine task priority based on TODO comment or default
      const taskPriority = mapTodoPriorityToTaskPriority(
        todo.priority, 
        config.defaultTaskPriority as TaskPriority
      );
      
      // Create new task
      const newTask: Task = {
        id: taskId,
        title: todo.comment,
        description: `TODO from ${todo.relativePath}:${todo.lineNumber}`,
        priority: taskPriority,
        status: 'todo' as TaskStatus,
        completed: false,
        createdAt: new Date().toISOString(),
        source: {
          file: todo.relativePath,
          line: todo.lineNumber
        },
        tags: ['code-todo']
      };
      
      // Add to tasks collection
      tasksData.tasks.push(newTask);
      createdTasks.push(taskId);
      
      // Create individual task file if using markdown template
      if (config.taskFileTemplate === 'markdown') {
        const taskFilePath = path.join(workspaceFolder, config.defaultTasksLocation, `${taskId}.md`);
        const taskContent = `# ${taskId}: ${todo.comment}

## Details
- **Priority**: ${taskPriority}
- **Status**: To Do
- **Created**: ${new Date().toLocaleDateString()}
- **Source**: [${todo.relativePath}:${todo.lineNumber}](file:///${todo.file}#L${todo.lineNumber})

## Description
${todo.comment}

## Source Context
\`\`\`
// From ${todo.relativePath}, line ${todo.lineNumber}
\`\`\`

## Notes
- Created via Huckleberry Task Manager's TODO scanner
- Found in codebase on ${new Date().toLocaleDateString()}
`;

        await writeFileTool.execute({
          path: taskFilePath,
          content: taskContent,
          createParentDirectories: true
        });
      }
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
    
    createdTasks.forEach(id => {
      const task = tasksData.tasks.find(t => t.id === id);
      if (task && task.priority) {
        tasksByPriority[task.priority].push(task);
      }
    });
    
    // Send success message with Doc Holliday flair
    await streamMarkdown(stream, `
I'm your huckleberry. I've found ${todos.length} TODO comments and created tasks for each one.

${tasksByPriority['critical'].length > 0 ? `
### ⚠️ Critical Priority
${tasksByPriority['critical'].map(t => `- **${t.id}**: ${t.title} _(${t.source?.file}:${t.source?.line})_`).join('\n')}
` : ''}

${tasksByPriority['high'].length > 0 ? `
### 🔴 High Priority
${tasksByPriority['high'].map(t => `- **${t.id}**: ${t.title} _(${t.source?.file}:${t.source?.line})_`).join('\n')}
` : ''}

${tasksByPriority['medium'].length > 0 ? `
### 🟠 Medium Priority
${tasksByPriority['medium'].map(t => `- **${t.id}**: ${t.title} _(${t.source?.file}:${t.source?.line})_`).join('\n')}
` : ''}

${tasksByPriority['low'].length > 0 ? `
### 🟢 Low Priority
${tasksByPriority['low'].map(t => `- **${t.id}**: ${t.title} _(${t.source?.file}:${t.source?.line})_`).join('\n')}
` : ''}

It appears your code's well educated with TODOs. Now I really hate 'em.

All tasks have been saved to your task collection. You can mark any as complete with: \`@Huckleberry Mark task TASK-XXX as complete\`
    `);
  } catch (error) {
    console.error('Failed to scan for TODOs:', error);
    await streamMarkdown(stream, `
**Well now, I seem to be having a bad day.**

Failed to scan for TODOs: ${error instanceof Error ? error.message : String(error)}

I'm not quite as steady as I used to be. Try again, darlin'.
    `);
  }
}