import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { BaseTool, BaseToolParams } from './BaseTool';

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
  public readonly id = 'markDone';
  public readonly name = 'Mark Task Done';
  public readonly description = 'Marks a task as done or undone in a task file';

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
      let content = await fs.promises.readFile(resolvedPath, 'utf-8');
      
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
          isDone 
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
          isDone 
        };
      }
      
      // Write the updated content back to the file
      await fs.promises.writeFile(resolvedPath, updatedContent, 'utf-8');
      
      this.showInfo(`Successfully ${isDone ? 'marked task as done' : 'marked task as undone'}: ${taskIdentifier}`);
      return { 
        success: true, 
        filePath, 
        taskIdentifier, 
        isDone 
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
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
    try {
      // Parse the JSON content
      const tasksData = JSON.parse(content);
      
      // Check if it's an array of tasks
      if (Array.isArray(tasksData)) {
        // Process each task in the array
        let found = false;
        const updatedTasks = tasksData.map((task: Record<string, any>) => {
          // Look for the task with matching identifier (could be in title, description, or id)
          const matchesId = task['id'] && task['id'].toString().includes(taskIdentifier);
          const matchesTitle = task['title'] && task['title'].includes(taskIdentifier);
          const matchesDescription = task['description'] && task['description'].includes(taskIdentifier);
          
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
          const updatedTasks = tasksData.tasks.map((task: Record<string, any>) => {
            const matchesId = task['id'] && task['id'].toString().includes(taskIdentifier);
            const matchesTitle = task['title'] && task['title'].includes(taskIdentifier);
            const matchesDescription = task['description'] && task['description'].includes(taskIdentifier);
            
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
      this.log('Error processing JSON file', error);
      // Return the original content if there was an error
      return content;
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