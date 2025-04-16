import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { BaseTool, BaseToolParams } from './BaseTool';

/**
 * Parameters for the ReadFileTool
 */
export interface ReadFileToolParams extends BaseToolParams {
  /**
   * The file path to read (relative to the workspace or absolute)
   */
  filePath: string;
}

/**
 * Tool for reading task files
 */
export class ReadFileTool extends BaseTool<ReadFileToolParams> {
  public readonly id = 'readFile';
  public readonly name = 'Read File';
  public readonly description = 'Reads the content of a task file';

  /**
   * Executes the read file operation
   * @param params The parameters for the operation
   * @returns The content of the file
   */
  public async execute(params: ReadFileToolParams): Promise<string> {
    try {
      const { filePath } = params;
      this.log(`Reading file: ${filePath}`);

      // Resolve the file path (handle both absolute and relative paths)
      const resolvedPath = this.resolvePath(filePath);
      
      // Check if the file exists
      if (!fs.existsSync(resolvedPath)) {
        throw new Error(`File not found: ${filePath}`);
      }

      // Read the file content
      const content = await fs.promises.readFile(resolvedPath, 'utf-8');
      return content;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.showError(`Failed to read file: ${message}`);
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