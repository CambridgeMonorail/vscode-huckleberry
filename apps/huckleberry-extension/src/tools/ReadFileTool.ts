import * as vscode from 'vscode';
import { BaseTool } from './BaseTool';

interface ReadFileParams {
  path: string;
  encoding?: string;
}

export class ReadFileTool extends BaseTool<ReadFileParams> {
  public readonly name = 'Read File';
  public readonly description = 'Reads the contents of a file';

  constructor() {
    super('readFile');
  }

  public async execute(params: ReadFileParams): Promise<string> {
    this.debug('Reading file', { path: params.path, encoding: params.encoding });
    
    try {
      const uri = vscode.Uri.file(params.path);
      const content = await vscode.workspace.fs.readFile(uri);
      const decoder = new TextDecoder(params.encoding || 'utf-8');
      const text = decoder.decode(content);
      
      this.debug('File read successfully', { 
        path: params.path,
        sizeBytes: content.byteLength,
        lines: text.split('\n').length,
      });
      
      return text;
    } catch (error) {
      this.logError(error, `Failed to read file: ${params.path}`);
      throw error;
    }
  }
}