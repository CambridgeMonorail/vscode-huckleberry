import * as vscode from 'vscode';
import * as path from 'path';
import { BaseTool } from './BaseTool';

interface WriteFileParams {
  path: string;
  content: string;
  createParentDirectories?: boolean;
}

export class WriteFileTool extends BaseTool<WriteFileParams> {
  public readonly name = 'Write File';
  public readonly description = 'Writes content to a file';

  constructor() {
    super('writeFile');
  }

  public async execute(params: WriteFileParams): Promise<void> {
    this.debug('Writing file', { 
      path: params.path,
      contentLength: params.content.length,
      createDirs: params.createParentDirectories
    });

    try {
      const uri = vscode.Uri.file(params.path);

      // Create parent directories if needed
      if (params.createParentDirectories) {
        const dirPath = path.dirname(params.path);
        this.debug('Creating parent directories', { dirPath });
        await vscode.workspace.fs.createDirectory(vscode.Uri.file(dirPath));
      }

      // Write the file
      const encoder = new TextEncoder();
      const data = encoder.encode(params.content);
      await vscode.workspace.fs.writeFile(uri, data);

      this.debug('File written successfully', {
        path: params.path,
        bytesWritten: data.byteLength
      });
    } catch (error) {
      this.logError(error, `Failed to write file: ${params.path}`);
      throw error;
    }
  }
}