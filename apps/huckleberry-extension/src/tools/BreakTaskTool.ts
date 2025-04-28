/**
 * Tool implementation for breaking tasks into subtasks
 */
import * as vscode from 'vscode';
import { BaseTool, BaseToolParams } from './BaseTool';
import { handleBreakTaskRequest } from '../handlers/tasks/taskDecompositionHandler';
import { logWithChannel, LogLevel } from '../utils/debugUtils';
import { ToolManager } from '../services/toolManager';

/**
 * Interface for input to the break task tool
 */
interface BreakTaskInput extends BaseToolParams {
  taskId: string;
}

/**
 * Tool for breaking tasks into subtasks using the language model
 */
export class BreakTaskTool extends BaseTool<BreakTaskInput> {
  /**
   * Constructor for BreakTaskTool
   */
  constructor() {
    super('break_task_into_subtasks');
  }

  /**
   * Unique name for the tool
   */
  readonly name = 'break_task_into_subtasks';

  /**
   * Description of what the tool does
   */
  readonly description = 'Breaks a task into multiple subtasks using AI to analyze task complexity';

  /**
   * Tool manager instance for accessing other tools
   */
  private _toolManager?: ToolManager;

  /**
   * Sets the tool manager instance
   */
  public set toolManager(manager: ToolManager) {
    this._toolManager = manager;
  }

  /**
   * Gets the tool manager instance
   */
  public get toolManager(): ToolManager {
    if (!this._toolManager) {
      throw new Error('Tool manager not set');
    }
    return this._toolManager;
  }

  /**
   * Executes the break task tool functionality
   * @param params The parameters for the tool
   * @returns A promise that resolves with the tool's result
   */
  async execute(params: BreakTaskInput): Promise<string> {
    logWithChannel(LogLevel.INFO, `🔨 Running ${this.name} tool with input:`, params);
    
    try {
      // Create a fake prompt based on the input parameters
      const prompt = `break ${params.taskId} into subtasks`;
      
      // Create a fake stream for capturing the output
      const messages: string[] = [];
      const fakeStream: vscode.ChatResponseStream = {
        markdown: async (content: string) => {
          messages.push(content);
          return Promise.resolve();
        },
        progress: async () => Promise.resolve(),
        anchor: (value: vscode.Uri | vscode.Location, title?: string) => {
          // Just capture the reference in our messages for completeness
          const location = value instanceof vscode.Uri ? 
            value.toString() : 
            `${value.uri.toString()}:${value.range.start.line + 1}:${value.range.start.character + 1}`;
          messages.push(`[Reference${title ? `: ${title}` : ''}](${location})`);
        },
        button: (command: vscode.Command) => {
          // Just log button info in messages
          messages.push(`[Button: ${command.title}]`);
        },
        reference: (value: vscode.Uri | vscode.Location, _iconPath?: vscode.IconPath) => {
          // Just capture the reference in our messages
          const location = value instanceof vscode.Uri ? 
            value.toString() : 
            `${value.uri.toString()}:${value.range.start.line + 1}:${value.range.start.character + 1}`;
          messages.push(`[Code reference: ${location}]`);
        },
        filetree: (value: vscode.ChatResponseFileTree[], baseUri: vscode.Uri) => {
          // Just capture file list in our messages
          messages.push(`[File tree with ${value.length} items, base: ${baseUri.toString()}]`);
        },
        push: (part: vscode.ChatResponsePart) => {
          // Capture the generic part in our messages
          messages.push(`[Response part: ${part.constructor.name}]`);
        },
      };
      
      // Run the handler with our fake prompt and stream
      await handleBreakTaskRequest(prompt, fakeStream, this.toolManager);
      
      // Return the combined messages
      return messages.join('\n\n');
    } catch (error) {
      const errorMessage = `Failed to break task into subtasks: ${error instanceof Error ? error.message : String(error)}`;
      logWithChannel(LogLevel.ERROR, errorMessage);
      return errorMessage;
    }
  }

  /**
   * Handles the break task request from a language model
   * @param options The invocation options containing input parameters
   * @param _token Cancellation token
   */
  async invoke(
    options: vscode.LanguageModelToolInvocationOptions<BreakTaskInput>,
    _token: vscode.CancellationToken,
  ): Promise<string> {
    const input = options.input;
    
    logWithChannel(LogLevel.INFO, `🔨 Running ${this.name} tool with input:`, input);
    
    try {
      // Create a fake prompt based on the input parameters
      const prompt = `break ${input.taskId} into subtasks`;
      
      // Create a fake stream for capturing the output
      const messages: string[] = [];
      const fakeStream: vscode.ChatResponseStream = {
        markdown: async (content: string) => {
          messages.push(content);
          return Promise.resolve();
        },
        progress: async () => Promise.resolve(),
        anchor: (value: vscode.Uri | vscode.Location, title?: string) => {
          // Just capture the reference in our messages for completeness
          const location = value instanceof vscode.Uri ? 
            value.toString() : 
            `${value.uri.toString()}:${value.range.start.line + 1}:${value.range.start.character + 1}`;
          messages.push(`[Reference${title ? `: ${title}` : ''}](${location})`);
        },
        button: (command: vscode.Command) => {
          // Just log button info in messages
          messages.push(`[Button: ${command.title}]`);
        },
        reference: (value: vscode.Uri | vscode.Location, _iconPath?: vscode.IconPath) => {
          // Just capture the reference in our messages
          const location = value instanceof vscode.Uri ? 
            value.toString() : 
            `${value.uri.toString()}:${value.range.start.line + 1}:${value.range.start.character + 1}`;
          messages.push(`[Code reference: ${location}]`);
        },
        filetree: (value: vscode.ChatResponseFileTree[], baseUri: vscode.Uri) => {
          // Just capture file list in our messages
          messages.push(`[File tree with ${value.length} items, base: ${baseUri.toString()}]`);
        },
        push: (part: vscode.ChatResponsePart) => {
          // Capture the generic part in our messages
          messages.push(`[Response part: ${part.constructor.name}]`);
        },
      };
      
      // Run the handler with our fake prompt and stream
      await handleBreakTaskRequest(prompt, fakeStream, this.toolManager);
      
      // Return the combined messages
      return messages.join('\n\n');
    } catch (error) {
      const errorMessage = `Failed to break task into subtasks: ${error instanceof Error ? error.message : String(error)}`;
      logWithChannel(LogLevel.ERROR, errorMessage);
      return errorMessage;
    }
  }
}