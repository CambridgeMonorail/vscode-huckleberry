import * as vscode from 'vscode';
import { ReadFileTool } from './tools/ReadFileTool';
import { WriteFileTool } from './tools/WriteFileTool';
import { MarkDoneTool } from './tools/MarkDoneTool';
import { ToolManager } from './services/toolManager';
import { SYSTEM_PROMPT } from './config';
import { showInfo } from './utils/uiHelpers';
import {
  handleInitializeTaskTracking,
  handleCreateTaskRequest,
  handlePriorityTaskQuery,
  handleMarkTaskDoneRequest,
  handleParseRequirementsRequest,
  handleReadTasksRequest
} from './handlers/taskHandlers';

/**
 * Interface for our extended chat request with command support
 */
interface Command {
  name: string;
  args?: Record<string, any>;
}

/**
 * Handle chat requests for Huckleberry
 */
async function handleChatRequest(
  request: vscode.ChatRequest, 
  context: vscode.ChatContext, 
  stream: vscode.ChatResponseStream,
  token: vscode.CancellationToken,
  toolManager: ToolManager
): Promise<void> {
  try {
    console.log(`Huckleberry received request: ${request.prompt}`);

    // Process command if present
    const commandMatch = request.prompt.match(/\/(\w+)(?:\s+(.*))?$/);
    if (commandMatch) {
      const commandName = commandMatch[1];
      if (commandName === 'manageTasks') {
        await stream.markdown('Opening task management interface...');
        vscode.commands.executeCommand('huckleberry-extension.manageTasks');
        await stream.markdown('Task management interface opened.');
        return;
      }
    }

    // Process regular chat request
    const lowerPrompt = request.prompt.toLowerCase();
    
    // Handle different types of requests
    if (lowerPrompt.includes('initialize task tracking')) {
      await handleInitializeTaskTracking(stream, toolManager);
    } else if (lowerPrompt.includes('create a task')) {
      await handleCreateTaskRequest(request.prompt, stream, toolManager);
    } else if (lowerPrompt.match(/what tasks are (\w+) priority/)) {
      await handlePriorityTaskQuery(request.prompt, stream, toolManager);
    } else if (lowerPrompt.match(/mark task .+ as complete/)) {
      await handleMarkTaskDoneRequest(request.prompt, stream, toolManager);
    } else if (lowerPrompt.match(/parse .+ and create tasks/)) {
      await handleParseRequirementsRequest(request.prompt, stream, toolManager);
    } else if (lowerPrompt.includes('read') || lowerPrompt.includes('show') || 
               lowerPrompt.includes('list') || lowerPrompt.includes('get')) {
      await handleReadTasksRequest(request.prompt, stream, toolManager);
    } else {
      await stream.markdown('I can help you manage your tasks. Try commands like:');
      await stream.markdown('- Initialize task tracking for this project');
      await stream.markdown('- Create a task to [description]');
      await stream.markdown('- What tasks are high priority?');
      await stream.markdown('- Mark task TASK-123 as complete');
      await stream.markdown('- Parse requirements.md and create tasks');
    }
  } catch (error) {
    console.error('Huckleberry error:', error);
    await stream.markdown(`**Error**: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Command handler for the manageTasks command
 */
function manageTasks(): void {
  showInfo('Task management interface will be implemented soon!');
}

/**
 * Activates the extension
 */
export function activate(context: vscode.ExtensionContext): void {
  console.log('Huckleberry extension is now active!');

  // Create and register tools
  const toolManager = new ToolManager();
  const readFileTool = new ReadFileTool();
  const writeFileTool = new WriteFileTool();
  const markDoneTool = new MarkDoneTool();
  
  toolManager.registerTool(readFileTool);
  toolManager.registerTool(writeFileTool);
  toolManager.registerTool(markDoneTool);

  // Register commands
  const helloWorldDisposable = vscode.commands.registerCommand('huckleberry-extension.helloWorld', () => {
    showInfo('Hello from Huckleberry!');
  });

  const manageTasksDisposable = vscode.commands.registerCommand('huckleberry-extension.manageTasks', manageTasks);

  // Register chat participant
  console.log('Registering Huckleberry chat participant...');
  const taskmanagerDisposable = vscode.chat.createChatParticipant(
    'huckleberry-extension.taskmanager',
    async (request: vscode.ChatRequest, context: vscode.ChatContext, response: vscode.ChatResponseStream, token: vscode.CancellationToken) => {
      console.log('🔵 Chat request received:', {
        prompt: request.prompt,
        contextLength: context.history.length
      });

      try {
        await handleChatRequest(request, context, response, token, toolManager);
        console.log('✅ Chat request handled successfully');
      } catch (error) {
        console.error('❌ Error handling chat request:', error);
        throw error;
      }
    }
  );
  console.log('Chat participant registered successfully');

  // Add all disposables to the context subscriptions
  context.subscriptions.push(helloWorldDisposable);
  context.subscriptions.push(manageTasksDisposable);
  context.subscriptions.push(taskmanagerDisposable);
}

/**
 * Deactivates the extension
 */
export function deactivate(): void {
  // Clean up resources when the extension is deactivated
}
