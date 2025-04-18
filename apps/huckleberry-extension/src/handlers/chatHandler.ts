/**
 * Chat request handler for Huckleberry
 */
import * as vscode from 'vscode';
import { SYSTEM_PROMPT } from '../config';
import { ToolManager } from '../services/toolManager';
import { logWithChannel, LogLevel } from '../utils/debugUtils';

// Import all task handlers
import {
  handleInitializeTaskTracking,
  handleCreateTaskRequest,
  handlePriorityTaskQuery,
  handleMarkTaskDoneRequest,
  handleParseRequirementsRequest,
  handleReadTasksRequest,
  handleChangeTaskPriorityRequest,
  handleScanTodosRequest
} from './taskHandlers';

/**
 * Checks if a workspace is currently available
 * @returns boolean indicating if a workspace is available
 */
export function isWorkspaceAvailable(): boolean {
  const hasWorkspaceFolders = vscode.workspace.workspaceFolders !== undefined && 
                              vscode.workspace.workspaceFolders.length > 0;
                              
  logWithChannel(LogLevel.DEBUG, `Workspace availability check: ${hasWorkspaceFolders ? 'Available' : 'Not available'}`, {
    workspaceFolders: vscode.workspace.workspaceFolders?.length || 0
  });
  
  return hasWorkspaceFolders;
}

/**
 * Notifies the user when no workspace is available
 */
export function notifyNoWorkspace(): void {
  logWithChannel(LogLevel.WARN, 'No workspace is currently open');
  vscode.window.showInformationMessage(
    'Huckleberry Task Manager requires an open workspace. Please open a folder or workspace to use all features.',
    'Open Folder'
  ).then(selection => {
    if (selection === 'Open Folder') {
      vscode.commands.executeCommand('workbench.action.files.openFolder');
    }
  });
}

/**
 * Interface for our extended chat request with command support
 */
export interface Command {
  name: string;
  args?: Record<string, any>;
}

/**
 * Handle chat requests for Huckleberry
 * @param request The chat request
 * @param context The chat context
 * @param stream The chat response stream
 * @param token The cancellation token
 * @param toolManager The tool manager
 */
export async function handleChatRequest(
  request: vscode.ChatRequest, 
  context: vscode.ChatContext, 
  stream: vscode.ChatResponseStream,
  token: vscode.CancellationToken,
  toolManager: ToolManager
): Promise<void> {
  try {
    // Original prompt might contain @Huckleberry or have it stripped out
    // Log both the original and cleaned versions
    const originalPrompt = request.prompt;
    logWithChannel(LogLevel.INFO, `Received chat request with prompt: "${originalPrompt}"`);
    
    // Clean the prompt - remove any @Huckleberry prefix that might still be included
    // This makes pattern matching more consistent
    const cleanedPrompt = originalPrompt
      .replace(/^@huckleberry\s+/i, '')
      .trim();
    
    logWithChannel(LogLevel.DEBUG, `Cleaned prompt: "${cleanedPrompt}"`);
    
    // Verbose debugging for the current workspace state
    const workspaceState = {
      hasWorkspace: isWorkspaceAvailable(),
      folders: vscode.workspace.workspaceFolders?.map(f => ({
        name: f.name,
        path: f.uri.fsPath
      })) || [],
      name: vscode.workspace.name
    };
    
    logWithChannel(LogLevel.DEBUG, 'Current workspace state during chat request:', workspaceState);

    // Check if workspace is available before processing any workspace-dependent commands
    if (!isWorkspaceAvailable()) {
      logWithChannel(LogLevel.WARN, 'Chat request received but no workspace is open');
      await stream.markdown(`
**Huckleberry needs a workspace to manage tasks.**

I notice you don't have a workspace open. To use Huckleberry Task Manager features, please:

1. Open a folder or workspace first
2. Then try your command again

You can open a folder via File > Open Folder or use the 'Open Folder' button below.
      `);
      
      // Show notification with action button
      vscode.window.showInformationMessage(
        'Huckleberry Task Manager requires an open workspace to manage tasks.',
        'Open Folder'
      ).then(selection => {
        if (selection === 'Open Folder') {
          vscode.commands.executeCommand('workbench.action.files.openFolder');
        }
      });
      
      return;
    }

    // Debug: Log context.history before mapping
    logWithChannel(LogLevel.DEBUG, `Chat context history length: ${context?.history?.length || 0}`);
    
    // Early pattern detection to avoid unnecessary model calls
    const lowerPrompt = cleanedPrompt.toLowerCase();
    
    // More comprehensive pattern detection for task creation with priority modifiers
    const highPriorityTaskPattern = /(create|add) (a )?(high|critical) (priority )?task to (.+)/i;
    const mediumPriorityTaskPattern = /(create|add) (a )?(medium) (priority )?task to (.+)/i;
    const lowPriorityTaskPattern = /(create|add) (a )?(low) (priority )?task to (.+)/i;
    const genericTaskPattern = /(create|add) (a )?task to (.+)/i;
    const scanTodosPattern = /(scan|find|extract|create tasks from)(?:\s+for)?\s+todos(?:\s+in\s+(.+))?/i;
    
    // For initialize pattern, make it more flexible
    const initializePattern = /initialize\s+task\s+tracking(?:\s+for\s+this\s+project)?/i;
    
    let taskPriority: string | null = null;
    let descriptionMatch: RegExpMatchArray | null = null;
    
    // Check for initialize pattern first (most likely first command)
    if (initializePattern.test(lowerPrompt)) {
      logWithChannel(LogLevel.INFO, '🎯 Detected initialize task tracking command');
      await handleInitializeTaskTracking(stream, toolManager);
      return;
    }
    
    // Try to match all patterns in order of specificity
    if (highPriorityTaskPattern.test(cleanedPrompt)) {
      const matches = cleanedPrompt.match(highPriorityTaskPattern);
      if (matches && matches.length >= 6) {
        taskPriority = matches[3] === 'critical' ? 'critical' : 'high';
        descriptionMatch = matches;
        logWithChannel(LogLevel.INFO, `Detected ${taskPriority} priority task creation request`);
        await handleCreateTaskRequest(cleanedPrompt, stream, toolManager, taskPriority);
        return;
      }
    } else if (mediumPriorityTaskPattern.test(cleanedPrompt)) {
      const matches = cleanedPrompt.match(mediumPriorityTaskPattern);
      if (matches && matches.length >= 6) {
        taskPriority = 'medium';
        descriptionMatch = matches;
        logWithChannel(LogLevel.INFO, `Detected ${taskPriority} priority task creation request`);
        await handleCreateTaskRequest(cleanedPrompt, stream, toolManager, taskPriority);
        return;
      }
    } else if (lowPriorityTaskPattern.test(cleanedPrompt)) {
      const matches = cleanedPrompt.match(lowPriorityTaskPattern);
      if (matches && matches.length >= 6) {
        taskPriority = 'low';
        descriptionMatch = matches;
        logWithChannel(LogLevel.INFO, `Detected ${taskPriority} priority task creation request`);
        await handleCreateTaskRequest(cleanedPrompt, stream, toolManager, taskPriority);
        return;
      }
    } else if (genericTaskPattern.test(cleanedPrompt)) {
      const matches = cleanedPrompt.match(genericTaskPattern);
      if (matches && matches.length >= 4) {
        // Use default priority
        logWithChannel(LogLevel.INFO, 'Detected generic task creation request');
        await handleCreateTaskRequest(cleanedPrompt, stream, toolManager, null);
        return;
      }
    } else if (scanTodosPattern.test(cleanedPrompt)) {
      const matches = cleanedPrompt.match(scanTodosPattern);
      logWithChannel(LogLevel.INFO, 'Detected TODO scanning request');
      await handleScanTodosRequest(cleanedPrompt, stream, toolManager);
      return;
    }
    
    // Handle other request patterns directly without using the language model
    if (lowerPrompt.includes('initialize task tracking')) {
      await handleInitializeTaskTracking(stream, toolManager);
      return;
    } else if (lowerPrompt.match(/what tasks are (\w+) priority/)) {
      await handlePriorityTaskQuery(cleanedPrompt, stream, toolManager);
      return;
    } else if (lowerPrompt.match(/mark task .+ as complete/)) {
      await handleMarkTaskDoneRequest(cleanedPrompt, stream, toolManager);
      return;
    } else if (lowerPrompt.match(/mark task .+ as (high|medium|low|critical) priority/) || 
        lowerPrompt.match(/change .+ priority .+ to (high|medium|low|critical)/)) {
      await handleChangeTaskPriorityRequest(cleanedPrompt, stream, toolManager);
      return;
    } else if (lowerPrompt.match(/parse .+ and create tasks/)) {
      await handleParseRequirementsRequest(cleanedPrompt, stream, toolManager);
      return;
    } else if (lowerPrompt.includes('read') || lowerPrompt.includes('show') || 
        lowerPrompt.includes('list') || lowerPrompt.includes('get')) {
      await handleReadTasksRequest(cleanedPrompt, stream, toolManager);
      return;
    }
    
    // If we get here, no specific command pattern was matched
    logWithChannel(LogLevel.DEBUG, '❓ No specific command pattern matched, falling back to language model');
    
    // Only prepare history and call the language model for unknown request patterns
    try {
      // Safely initialize history array with proper type checking
      const historyTurns = Array.isArray(context?.history) ? context.history : [];
      logWithChannel(LogLevel.DEBUG, `Processing ${historyTurns.length} history turns`);
      
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
            logWithChannel(LogLevel.DEBUG, `Skipping turn with participant '${turn.participant}' - missing valid response array`);
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
      
      logWithChannel(LogLevel.DEBUG, `Processed ${history.length} valid history turns`);

      // Create message sequence - inject system prompt as first assistant message
      const userMessage = new vscode.LanguageModelChatMessage(vscode.LanguageModelChatMessageRole.User, cleanedPrompt);
      const systemContextMessage = new vscode.LanguageModelChatMessage(vscode.LanguageModelChatMessageRole.Assistant, SYSTEM_PROMPT);
      
      // Only include a reasonable number of history messages to avoid model context limitations
      const limitedHistory = history.slice(-5); // Only use the most recent 5 exchanges
      const messages = [systemContextMessage, ...limitedHistory, userMessage];

      try {
        // Get response from language model with simple options object
        logWithChannel(LogLevel.DEBUG, 'Sending request to language model');
        const response = await request.model.sendRequest(messages, {}, token);

        // Stream the model's response for general queries
        logWithChannel(LogLevel.DEBUG, 'Streaming model response');
        for await (const chunk of response.text) {
          await stream.markdown(chunk);
        }
        logWithChannel(LogLevel.INFO, 'Successfully streamed model response');
      } catch (modelError) {
        logWithChannel(LogLevel.ERROR, 'Error using language model:', modelError);
        
        // Provide helpful response even when model fails, with Doc Holliday flair
        await stream.markdown(`
I'm your huckleberry. Seems my memory's a bit foggy. Let's get back to business.

Why don't you try one of these commands:

- Initialize task tracking for this project
- Create a task to [description]
- Create a high priority task to [description]
- Scan for TODOs in the codebase
- What tasks are high priority?
- Mark task TASK-123 as complete
- Mark task TASK-123 as high priority
- Parse requirements.md and create tasks

In vino veritas. In tasks, productivity.
        `);
      }
    } catch (historyError) {
      logWithChannel(LogLevel.ERROR, 'Error processing chat history:', historyError);
      
      // Fall back to direct handling without history context
      await handleFallbackResponse(stream);
    }
  } catch (error) {
    logWithChannel(LogLevel.ERROR, 'Unhandled error in chat handler:', error);
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
export async function handleFallbackResponse(stream: vscode.ChatResponseStream): Promise<void> {
  await stream.markdown(`
I'm your huckleberry. Let me help you manage those tasks of yours.

Try askin' me for:

- Initialize task tracking for this project
- Create a task to [description]
- Create a high priority task to [description]
- Scan for TODOs in the codebase
- What tasks are high priority?
- Mark task TASK-123 as complete
- Mark task TASK-123 as high priority
- Parse requirements.md and create tasks

I've got two guns, one for each of your task categories.
  `);
}