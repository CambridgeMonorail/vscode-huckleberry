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
  handleReadTasksRequest,
  handleChangeTaskPriorityRequest
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

    // Debug: Log context.history before mapping
    console.log('[DEBUG] context.history length:', context?.history?.length);
    
    // Early pattern detection to avoid unnecessary model calls
    const lowerPrompt = request.prompt.toLowerCase();
    
    // More comprehensive pattern detection for task creation with priority modifiers
    const highPriorityTaskPattern = /(create|add) (a )?(high|critical) (priority )?task to (.+)/i;
    const mediumPriorityTaskPattern = /(create|add) (a )?(medium) (priority )?task to (.+)/i;
    const lowPriorityTaskPattern = /(create|add) (a )?(low) (priority )?task to (.+)/i;
    const genericTaskPattern = /(create|add) (a )?task to (.+)/i;
    
    let taskPriority: string | null = null;
    let descriptionMatch: RegExpMatchArray | null = null;
    
    // Try to match all patterns in order of specificity
    if (highPriorityTaskPattern.test(request.prompt)) {
      const matches = request.prompt.match(highPriorityTaskPattern);
      if (matches && matches.length >= 6) {
        taskPriority = matches[3] === 'critical' ? 'critical' : 'high';
        descriptionMatch = matches;
        console.log(`[DEBUG] Detected ${taskPriority} priority task creation request`);
        await handleCreateTaskRequest(request.prompt, stream, toolManager, taskPriority);
        return;
      }
    } else if (mediumPriorityTaskPattern.test(request.prompt)) {
      const matches = request.prompt.match(mediumPriorityTaskPattern);
      if (matches && matches.length >= 6) {
        taskPriority = 'medium';
        descriptionMatch = matches;
        console.log(`[DEBUG] Detected ${taskPriority} priority task creation request`);
        await handleCreateTaskRequest(request.prompt, stream, toolManager, taskPriority);
        return;
      }
    } else if (lowPriorityTaskPattern.test(request.prompt)) {
      const matches = request.prompt.match(lowPriorityTaskPattern);
      if (matches && matches.length >= 6) {
        taskPriority = 'low';
        descriptionMatch = matches;
        console.log(`[DEBUG] Detected ${taskPriority} priority task creation request`);
        await handleCreateTaskRequest(request.prompt, stream, toolManager, taskPriority);
        return;
      }
    } else if (genericTaskPattern.test(request.prompt)) {
      const matches = request.prompt.match(genericTaskPattern);
      if (matches && matches.length >= 4) {
        // Use default priority
        console.log('[DEBUG] Detected generic task creation request');
        await handleCreateTaskRequest(request.prompt, stream, toolManager, null);
        return;
      }
    }
    
    // Handle other request patterns directly without using the language model
    if (lowerPrompt.includes('initialize task tracking')) {
      await handleInitializeTaskTracking(stream, toolManager);
      return;
    } else if (lowerPrompt.match(/what tasks are (\w+) priority/)) {
      await handlePriorityTaskQuery(request.prompt, stream, toolManager);
      return;
    } else if (lowerPrompt.match(/mark task .+ as complete/)) {
      await handleMarkTaskDoneRequest(request.prompt, stream, toolManager);
      return;
    } else if (lowerPrompt.match(/mark task .+ as (high|medium|low|critical) priority/) || 
        lowerPrompt.match(/change .+ priority .+ to (high|medium|low|critical)/)) {
      await handleChangeTaskPriorityRequest(request.prompt, stream, toolManager);
      return;
    } else if (lowerPrompt.match(/parse .+ and create tasks/)) {
      await handleParseRequirementsRequest(request.prompt, stream, toolManager);
      return;
    } else if (lowerPrompt.includes('read') || lowerPrompt.includes('show') || 
        lowerPrompt.includes('list') || lowerPrompt.includes('get')) {
      await handleReadTasksRequest(request.prompt, stream, toolManager);
      return;
    }
    
    // Only prepare history and call the language model for unknown request patterns
    try {
      // Safely initialize history array with proper type checking
      const historyTurns = Array.isArray(context?.history) ? context.history : [];
      console.log(`[DEBUG] Processing ${historyTurns.length} history turns`);
      
      // Process history turns with proper type checking for each property
      const history = historyTurns
        .filter((turn): turn is vscode.ChatResponseTurn => {
          // Only include turns that have a valid response array
          const hasResponse = turn && 
            typeof turn === 'object' && 
            'response' in turn && 
            Array.isArray(turn.response);
            
          if (!hasResponse && turn && 'participant' in turn) {
            // Log turns that were filtered out but are recognized as chat turns
            console.log(`[DEBUG] Skipping turn with participant '${turn.participant}' - missing valid response array`);
          }
          
          return hasResponse;
        })
        .map(turn => {
          // Safe extraction of response text with proper error handling
          const text = turn.response
            .map(part => typeof part.toString === 'function' ? part.toString() : String(part))
            .join("");
            
          return new vscode.LanguageModelChatMessage(
            turn.participant === 'user' ? vscode.LanguageModelChatMessageRole.User : vscode.LanguageModelChatMessageRole.Assistant,
            text
          );
        });
      
      console.log(`[DEBUG] Processed ${history.length} valid history turns`);

      // Create message sequence - inject system prompt as first assistant message
      const userMessage = new vscode.LanguageModelChatMessage(vscode.LanguageModelChatMessageRole.User, request.prompt);
      const systemContextMessage = new vscode.LanguageModelChatMessage(vscode.LanguageModelChatMessageRole.Assistant, SYSTEM_PROMPT);
      
      // Only include a reasonable number of history messages to avoid model context limitations
      const limitedHistory = history.slice(-5); // Only use the most recent 5 exchanges
      const messages = [systemContextMessage, ...limitedHistory, userMessage];

      try {
        // Get response from language model with simple options object
        const response = await request.model.sendRequest(messages, {}, token);

        // Stream the model's response for general queries
        for await (const chunk of response.text) {
          await stream.markdown(chunk);
        }
      } catch (modelError) {
        console.error('Error using language model:', modelError);
        
        // Provide helpful response even when model fails, with Doc Holliday flair
        await stream.markdown(`
I'm your huckleberry. Seems my memory's a bit foggy. Let's get back to business.

Why don't you try one of these commands:

- Initialize task tracking for this project
- Create a task to [description]
- Create a high priority task to [description]
- What tasks are high priority?
- Mark task TASK-123 as complete
- Mark task TASK-123 as high priority
- Parse requirements.md and create tasks

In vino veritas. In tasks, productivity.
        `);
      }
    } catch (historyError) {
      console.error('Error processing chat history:', historyError);
      
      // Fall back to direct handling without history context
      await handleFallbackResponse(stream);
    }
  } catch (error) {
    console.error('Huckleberry error:', error);
    await stream.markdown(`
**Well now, I seem to be having a bad day.**

${error instanceof Error ? error.message : String(error)}

I'm not quite as steady as I used to be. Try again, darlin'.
    `);
  }
}

/**
 * Provides a fallback response when other mechanisms fail
 * @param stream The chat response stream
 */
async function handleFallbackResponse(stream: vscode.ChatResponseStream): Promise<void> {
  await stream.markdown(`
I'm your huckleberry. Let me help you manage those tasks of yours.

Try askin' me for:

- Initialize task tracking for this project
- Create a task to [description]
- Create a high priority task to [description]
- What tasks are high priority?
- Mark task TASK-123 as complete
- Mark task TASK-123 as high priority
- Parse requirements.md and create tasks

I've got two guns, one for each of your task categories.
  `);
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
