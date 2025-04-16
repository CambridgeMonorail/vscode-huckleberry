import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { BaseTool, BaseToolParams } from './BaseTool';

/**
 * Parameters for the WriteFileTool
 */
export interface WriteFileToolParams extends BaseToolParams {
  /**
   * The file path to write (relative to the workspace or absolute)
   */
  filePath: string;
  
  /**
   * The content to write to the file
   */
  content: string;
  
  /**
   * Whether to create the file if it doesn't exist (default: true)
   */
  create?: boolean;
  
  /**
   * Whether to overwrite the file if it exists (default: true)
   */
  overwrite?: boolean;
}

/**
 * Tool for writing to task files
 */
export class WriteFileTool extends BaseTool<WriteFileToolParams> {
  public readonly id = 'writeFile';
  public readonly name = 'Write File';
  public readonly description = 'Writes content to a task file';

  /**
   * Executes the write file operation
   * @param params The parameters for the operation
   * @returns An object indicating success and the file path that was written
   */
  public async execute(params: WriteFileToolParams): Promise<{ success: boolean; filePath: string }> {
    try {
      const { filePath, content, create = true, overwrite = true } = params;
      this.log(`Writing to file: ${filePath}`);

      // Resolve the file path (handle both absolute and relative paths)
      const resolvedPath = this.resolvePath(filePath);
      
      // Check if the file exists
      const fileExists = fs.existsSync(resolvedPath);
      
      // Handle file existence based on parameters
      if (fileExists && !overwrite) {
        throw new Error(`File already exists and overwrite is disabled: ${filePath}`);
      }
      
      if (!fileExists && !create) {
        throw new Error(`File does not exist and create is disabled: ${filePath}`);
      }
      
      // Confirm the write operation with the user if the file exists
      if (fileExists) {
        const confirmed = await this.confirm(`Do you want to overwrite the file: ${filePath}?`);
        if (!confirmed) {
          return { success: false, filePath };
        }
      }
      
      // Create directories if they don't exist
      const directory = path.dirname(resolvedPath);
      await fs.promises.mkdir(directory, { recursive: true });
      
      // Write the file content
      await fs.promises.writeFile(resolvedPath, content, 'utf-8');
      
      this.showInfo(`Successfully wrote to file: ${filePath}`);
      return { success: true, filePath };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.showError(`Failed to write file: ${message}`);
      throw error;
    }
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