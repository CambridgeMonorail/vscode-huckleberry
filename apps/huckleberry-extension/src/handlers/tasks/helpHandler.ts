/**
 * Handler for help and feature explanation
 */
import * as vscode from 'vscode';
import { ToolManager } from '../../services/toolManager';
import { streamMarkdown, showProgress } from '../../utils/uiHelpers';
import { recommendAgentModeInChat } from './taskUtils';
import { logWithChannel, LogLevel } from '../../utils/debugUtils';

/**
 * Handles requests for help and feature explanations
 * @param prompt The user's prompt text
 * @param stream The chat response stream
 * @param toolManager The tool manager instance
 */
export async function handleHelpRequest(
  prompt: string,
  stream: vscode.ChatResponseStream,
  _toolManager: ToolManager,
): Promise<void> {
  console.log('❓ Processing help request:', prompt);
  await showProgress(stream);

  // Log the help request
  logWithChannel(LogLevel.INFO, 'Help request received', {
    prompt,
  });

  // Extract any specific feature inquiries from the prompt
  const lowerPrompt = prompt.toLowerCase();
  const isSpecificFeatureRequest = checkForSpecificFeatureRequest(lowerPrompt);

  // Response with feature explanation based on the prompt
  if (isSpecificFeatureRequest.isSpecific) {
    await respondWithSpecificFeatureHelp(stream, isSpecificFeatureRequest.feature);
  } else {
    await respondWithGeneralHelp(stream);
  }

  // Recommend agent mode if applicable
  await recommendAgentModeInChat(stream);
}

/**
 * Checks if the prompt is asking about a specific feature
 * @param prompt The lowercase prompt to check
 * @returns Object indicating if a specific feature was requested and which one
 */
function checkForSpecificFeatureRequest(prompt: string): {
  isSpecific: boolean;
  feature: string | null;
} {
  // Define feature keywords to look for
  const featureKeywords: Record<string, string[]> = {
    'task-creation': ['create task', 'add task', 'new task', 'task creation'],
    'task-listing': ['list task', 'show task', 'view task', 'list all task', 'task list'],
    'task-completion': ['complete task', 'mark done', 'finish task', 'mark as complete', 'mark completed'],
    'task-priority': ['priority', 'high priority', 'low priority', 'medium priority', 'change priority'],
    'todo-scanning': ['scan todo', 'find todo', 'scan for todo', 'todo scanning', 'convert todo'],
    'requirements-parsing': ['parse requirement', 'requirement document', 'parse doc', 'extract task'],
    'task-decomposition': ['subtask', 'break down', 'decompose task', 'split task'],
    'next-task': ['next task', 'what to work on', 'suggest task', 'recommend task'],
    'task-initialization': ['initialize', 'initialise', 'setup', 'set up', 'start tracking'],
  };

  // Check if the prompt matches any feature keywords
  for (const [feature, keywords] of Object.entries(featureKeywords)) {
    if (keywords.some(keyword => prompt.includes(keyword))) {
      return { isSpecific: true, feature };
    }
  }

  return { isSpecific: false, feature: null };
}

/**
 * Responds with help for a specific feature
 * @param stream The chat response stream
 * @param feature The specific feature to explain
 */
async function respondWithSpecificFeatureHelp(
  stream: vscode.ChatResponseStream,
  feature: string | null,
): Promise<void> {
  if (feature === null) {
    // If feature is null, fall back to general help
    await respondWithGeneralHelp(stream);
    return;
  }

  switch (feature) {
    case 'task-creation':
      await streamMarkdown(stream, `
## Task Creation

I can help you create tasks with various priorities:

- **Basic task creation**: \`@Huckleberry Create a task to implement user authentication\`
- **With priority**: \`@Huckleberry Create a high priority task to fix the login page\`
- **Priority levels**: low, medium, high, critical

Tasks are stored in your workspace's \`tasks\` directory and tracked in \`tasks.json\`.

**Agent Mode Tool**: \`create_task\` - Create tasks directly via GitHub Copilot.
      `);
      break;

    case 'task-listing':
      await streamMarkdown(stream, `
## Task Listing

I can list your tasks in several ways:

- **List all tasks**: \`@Huckleberry List all tasks\`
- **Filter by priority**: \`@Huckleberry What tasks are high priority?\`
- **Filter by status**: \`@Huckleberry List completed tasks\`
- **Combined filters**: \`@Huckleberry List high priority completed tasks\`

Tasks will be displayed with their ID, description, priority, and status.

**Agent Mode Tool**: \`list_tasks\` - List tasks with optional priority and status filters.
      `);
      break;

    case 'task-completion':
      await streamMarkdown(stream, `
## Task Completion

I can mark tasks as completed:

- **Mark as done**: \`@Huckleberry Mark task TASK-123 as complete\`
- **Completion timestamp**: Tasks are marked with completion time
- **Status updates**: Task status is updated in both tasks.json and the individual task file

**Agent Mode Tool**: \`mark_task_done\` - Mark tasks as complete.
      `);
      break;

    case 'task-priority':
      await streamMarkdown(stream, `
## Task Priority Management

I can set and update task priorities:

- **Update priority**: \`@Huckleberry Mark task TASK-123 as high priority\`
- **Priority levels**: low, medium, high, critical
- **Default priority**: New tasks use the default priority from settings

**Agent Mode Tool**: \`update_task_priority\` - Update the priority of a task.
      `);
      break;

    case 'todo-scanning':
      await streamMarkdown(stream, `
## TODO Comment Scanning

I can scan your codebase for TODO comments and convert them to tasks:

- **Scan entire codebase**: \`@Huckleberry Scan for TODOs in the codebase\`
- **Scan specific files**: \`@Huckleberry Scan for TODOs in **/*.ts\`
- **Source tracking**: Tasks created from TODOs include the source file and line number
- **Formats**: Supports // TODO:, /* TODO: */, # TODO: and similar formats

**Agent Mode Tool**: \`scan_todos\` - Scan codebase for TODO comments.
      `);
      break;

    case 'requirements-parsing':
      await streamMarkdown(stream, `
## Requirements Document Parsing

I can parse requirements documents and create tasks:

- **Parse document**: \`@Huckleberry Parse requirements.md and create tasks\`
- **Structure preservation**: Maintains document hierarchy in task relationships
- **Priority extraction**: Automatically detects priority indicators in document
- **Task conversion**: Converts bullet points, numbered lists, and sections to tasks
      `);
      break;

    case 'task-decomposition':
      await streamMarkdown(stream, `
## Task Decomposition

I can break down complex tasks into smaller subtasks:

- **Create subtasks**: \`@Huckleberry Break TASK-123 into subtasks\`
- **Task relationships**: Subtasks are linked to parent task
- **Hierarchy**: Task hierarchy is reflected in tasks.json
      `);
      break;

    case 'next-task':
      await streamMarkdown(stream, `
## Next Task Recommendation

I can recommend the next task for you to work on:

- **Get recommendation**: \`@Huckleberry What task should I work on next?\`
- **Get recommendation**: \`@Huckleberry What's my next task?\`
- **Priority-based**: Recommendations are based on task priority and status
- **Task summary**: Includes a summary of all open tasks

**Agent Mode Tool**: \`next_task\` - Get a recommendation for which task to work on next.
      `);
      break;

    case 'task-initialization':
      await streamMarkdown(stream, `
## Task Tracking Initialization

I can set up task tracking in your workspace:

- **Initialize**: \`@Huckleberry Initialize task tracking for this project\`
- **File structure**: Creates tasks.json and tasks/ directory
- **Configuration**: Uses settings for default task location and format

**Agent Mode Tool**: \`initialize_tracking\` or \`initialise_tracking\` - Set up task tracking.
      `);
      break;

    default:
      // Fallback to general help
      await respondWithGeneralHelp(stream);
  }
}

/**
 * Responds with general help about all features
 * @param stream The chat response stream
 */
async function respondWithGeneralHelp(
  stream: vscode.ChatResponseStream,
): Promise<void> {
  await streamMarkdown(stream, `
# Huckleberry Task Manager Help

I'm your huckleberry. I'm here to help you manage tasks in your project. Here are the features I support:

## Core Features

### Task Management
- **Initialize tracking**: \`@Huckleberry Initialize task tracking for this project\`
- **Create tasks**: \`@Huckleberry Create a task to implement user authentication\`
- **Create priority tasks**: \`@Huckleberry Create a high priority task to fix security issue\`
- **List tasks**: \`@Huckleberry List all tasks\`
- **Filter tasks**: \`@Huckleberry What tasks are high priority?\`
- **Complete tasks**: \`@Huckleberry Mark task TASK-123 as complete\`
- **Update priority**: \`@Huckleberry Mark task TASK-123 as high priority\`

### Advanced Features
- **Scan TODOs**: \`@Huckleberry Scan for TODOs in the codebase\`
- **Parse requirements**: \`@Huckleberry Parse requirements.md and create tasks\`
- **Task decomposition**: \`@Huckleberry Break TASK-123 into subtasks\`
- **Next task**: \`@Huckleberry What task should I work on next?\`

## Task Storage
All tasks are stored in your workspace:
- **tasks.json**: Master index of all tasks
- **tasks/ directory**: Individual task files

## Ask Me About Specific Features
For more details about a specific feature, ask me something like:
- \`@Huckleberry How do I create tasks?\`
- \`@Huckleberry Help with scanning TODOs\`
- \`@Huckleberry How do I mark tasks complete?\`
  `);
}