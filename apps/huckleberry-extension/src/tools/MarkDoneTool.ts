import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { BaseTool, BaseToolParams } from './BaseTool';

/**
 * Represents a task item in JSON format
 */
interface TaskItem {
  id?: string | number;
  title?: string;
  description?: string;
  completed?: boolean;
  [key: string]: unknown;
}

/**
 * Parameters for the MarkDoneTool
 */
export interface MarkDoneToolParams extends BaseToolParams {
  /**
   * The file path of the task file (relative to the workspace or absolute)
   */
  filePath: string;
  
  /**
   * The task identifier or text to mark as done
   */
  taskIdentifier: string;

  /**
   * Whether the task should be marked as done (true) or undone (false)
   */
  isDone: boolean;
}

/**
 * Tool for marking tasks as done/undone in markdown files
 */
export class MarkDoneTool extends BaseTool<MarkDoneToolParams> {
  public override readonly id = 'markDone';
  public readonly name = 'Mark Task Done';
  public readonly description = 'Marks a task as done or undone in a task file';

  constructor() {
    super('markDone');
  }

  /**
   * Executes the mark task done/undone operation
   * @param params The parameters for the operation
   * @returns An object indicating success and details about the operation
   */
  public async execute(params: MarkDoneToolParams): Promise<{ 
    success: boolean; 
    filePath: string;
    taskIdentifier: string;
    isDone: boolean;
  }> {
    this.debug('Executing mark task operation', { 
      filePath: params.filePath,
      taskIdentifier: params.taskIdentifier,
      isDone: params.isDone,
    });

    try {
      const { filePath, taskIdentifier, isDone } = params;
      this.log(`Marking task ${isDone ? 'done' : 'undone'}: ${taskIdentifier} in file: ${filePath}`);

      // Resolve the file path (handle both absolute and relative paths)
      const resolvedPath = this.resolvePath(filePath);
      
      // Check if the file exists
      if (!fs.existsSync(resolvedPath)) {
        throw new Error(`File not found: ${filePath}`);
      }
      
      // Read the file content
      const content = await fs.promises.readFile(resolvedPath, 'utf-8');
      
      this.debug('Read file content', {
        filePath: resolvedPath,
        contentLength: content.length,
      });

      // Determine file type based on extension
      const extension = path.extname(filePath).toLowerCase();
      
      // Process the content based on the file type
      let updatedContent: string;
      
      if (extension === '.md') {
        updatedContent = this.processMarkdownFile(content, taskIdentifier, isDone);
      } else if (extension === '.json') {
        updatedContent = this.processJsonFile(content, taskIdentifier, isDone);
      } else {
        throw new Error(`Unsupported file type: ${extension}`);
      }
      
      // Check if any changes were made
      if (content === updatedContent) {
        this.showInfo(`No matching task found: ${taskIdentifier}`);
        return { 
          success: false, 
          filePath, 
          taskIdentifier, 
          isDone, 
        };
      }
      
      // Confirm the update with the user
      const actionText = isDone ? 'mark as done' : 'mark as undone';
      const confirmed = await this.confirm(`Do you want to ${actionText} the task: ${taskIdentifier}?`);
      
      if (!confirmed) {
        return { 
          success: false, 
          filePath, 
          taskIdentifier, 
          isDone, 
        };
      }
      
      // Write the updated content back to the file
      await fs.promises.writeFile(resolvedPath, updatedContent, 'utf-8');

      // Also update tasks.json status if this is a markdown file in the tasks folder
      if (extension === '.md') {
        await this.updateTasksJsonStatus(taskIdentifier, isDone);
      }

      this.debug('Task marked successfully', {
        filePath: resolvedPath,
        taskIdentifier,
        isDone,
      });

      this.showInfo(`Successfully ${isDone ? 'marked task as done' : 'marked task as undone'}: ${taskIdentifier}`);
      return { 
        success: true, 
        filePath, 
        taskIdentifier, 
        isDone, 
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logError(error, `Failed to mark task: ${message}`);
      this.showError(`Failed to mark task: ${message}`);
      throw error;
    }
  }

  /**
   * Process a markdown file to mark tasks as done/undone
   * @param content The content of the markdown file
   * @param taskIdentifier The task identifier to mark
   * @param isDone Whether to mark the task as done or undone
   * @returns The updated content
   */
  private processMarkdownFile(content: string, taskIdentifier: string, isDone: boolean): string {
    this.debug('Processing markdown file', { taskIdentifier, isDone });

    // Create regex patterns for both unchecked and checked task items
    const uncheckedPattern = new RegExp(`(- \\[ \\]\\s+)(.*${this.escapeRegExp(taskIdentifier)}.*)`, 'gim');
    const checkedPattern = new RegExp(`(- \\[x\\]\\s+)(.*${this.escapeRegExp(taskIdentifier)}.*)`, 'gim');
    
    // Replace based on the desired state
    if (isDone) {
      // Mark as done: replace "- [ ]" with "- [x]" for matching tasks
      return content.replace(uncheckedPattern, '- [x] $2');
    } else {
      // Mark as undone: replace "- [x]" with "- [ ]" for matching tasks
      return content.replace(checkedPattern, '- [ ] $2');
    }
  }

  /**
   * Process a JSON file to mark tasks as done/undone
   * @param content The content of the JSON file
   * @param taskIdentifier The task identifier to mark
   * @param isDone Whether to mark the task as done or undone
   * @returns The updated content
   */
  private processJsonFile(content: string, taskIdentifier: string, isDone: boolean): string {
    this.debug('Processing JSON file', { taskIdentifier, isDone });

    try {
      // Parse the JSON content
      const tasksData = JSON.parse(content);
      
      // Check if it's an array of tasks
      if (Array.isArray(tasksData)) {
        // Process each task in the array
        let found = false;
        const updatedTasks = tasksData.map((task: TaskItem) => {
          // Look for the task with matching identifier (could be in title, description, or id)
          const matchesId = task.id && task.id.toString().includes(taskIdentifier);
          const matchesTitle = task.title && task.title.includes(taskIdentifier);
          const matchesDescription = task.description && task.description.includes(taskIdentifier);
          
          if (matchesId || matchesTitle || matchesDescription) {
            found = true;
            return { ...task, completed: isDone };
          }
          return task;
        });
        
        if (!found) {
          // No changes made
          return content;
        }
        
        // Return the updated JSON
        return JSON.stringify(updatedTasks, null, 2);
      } else if (tasksData && typeof tasksData === 'object') {
        // Handle object with tasks property
        if (Array.isArray(tasksData.tasks)) {
          let found = false;
          const updatedTasks = tasksData.tasks.map((task: TaskItem) => {
            const matchesId = task.id && task.id.toString().includes(taskIdentifier);
            const matchesTitle = task.title && task.title.includes(taskIdentifier);
            const matchesDescription = task.description && task.description.includes(taskIdentifier);
            
            if (matchesId || matchesTitle || matchesDescription) {
              found = true;
              return { ...task, completed: isDone };
            }
            return task;
          });
          
          if (!found) {
            // No changes made
            return content;
          }
          
          // Return the updated JSON
          const updatedData = { ...tasksData, tasks: updatedTasks };
          return JSON.stringify(updatedData, null, 2);
        }
      }
      
      // No changes made
      return content;
    } catch (error) {
      this.logError(error, 'Error processing JSON file');
      // Return the original content if there was an error
      return content;
    }
  }

  /**
   * Updates the status of a task in tasks/tasks.json when marked done/undone
   * @param taskIdentifier The task identifier (id or title)
   * @param isDone Whether the task is done
   */
  private async updateTasksJsonStatus(taskIdentifier: string, isDone: boolean): Promise<void> {
    try {
      // Find the workspace root
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders || workspaceFolders.length === 0) return;
      const workspacePath = workspaceFolders[0].uri.fsPath;
      const tasksJsonPath = path.join(workspacePath, 'tasks', 'tasks.json');
      if (!fs.existsSync(tasksJsonPath)) return;
      const jsonRaw = await fs.promises.readFile(tasksJsonPath, 'utf-8');
      const json = JSON.parse(jsonRaw);
      if (!Array.isArray(json.tasks)) return;
      let updated = false;
      for (const task of json.tasks) {
        const matchesId = task.id && task.id.toString().includes(taskIdentifier);
        const matchesTitle = task.title && task.title.includes(taskIdentifier);
        if (matchesId || matchesTitle) {
          task.completed = isDone;
          task.status = isDone ? 'done' : 'todo';
          updated = true;
        }
      }
      if (updated) {
        await fs.promises.writeFile(tasksJsonPath, JSON.stringify(json, null, 2), 'utf-8');
      }
    } catch (err) {
      this.logError(err, 'Failed to update tasks.json status');
    }
  }

  /**
   * Escapes special characters in a string for use in a regular expression
   * @param string The string to escape
   * @returns The escaped string
   */
  private escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
  }

  /**
   * Resolves a file path (handles both absolute and relative paths)
   * @param filePath The file path to resolve
   * @returns The resolved absolute path
   */
  private resolvePath(filePath: string): string {
    this.debug('Resolving file path', { filePath });

    // If it's already an absolute path, return it
    if (path.isAbsolute(filePath)) {
      return filePath;
    }

    // Get the workspace folders
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      throw new Error('No workspace folder is open');
    }

    // Use the first workspace folder as the base
    const workspacePath = workspaceFolders[0].uri.fsPath;
    return path.join(workspacePath, filePath);
  }
}