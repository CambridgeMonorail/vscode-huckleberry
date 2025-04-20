---
sidebar_position: 5
---

# Language Model Tools

Huckleberry integrates with the VS Code Language Model Tools API, allowing AI-powered assistants like GitHub Copilot to directly interact with Huckleberry's task management capabilities.

## What are Language Model Tools?

Language Model Tools is a VS Code API that allows extensions to register "tools" that can be used by language models like GitHub Copilot. When these tools are registered:

1. The language model can detect when a tool might be useful in a conversation
2. The model can call the tool directly to perform actions or retrieve information
3. The results are incorporated into the model's response

This creates a seamless experience where the AI can help manage tasks without requiring explicit `@Huckleberry` mentions.

## Available Tools

Huckleberry provides the following Language Model Tools:

### Task Creation

```typescript
vscode.lm.registerTool('huckleberry.createTask', {
  async invoke(options, token) {
    // Takes a description and optional priority
    // Creates a new task in the workspace
  }
})
```

**Example use case**: When discussing a feature implementation in chat, Copilot might automatically offer to create a task for it.

### Task Tracking Initialization

```typescript
vscode.lm.registerTool('huckleberry.initializeTaskTracking', {
  async invoke(options, token) {
    // Sets up the task tracking structure in the current workspace
  }
})
```

**Example use case**: When a user first mentions they want to track tasks, the AI can initialize the tracking system.

### TODO Scanning

```typescript
vscode.lm.registerTool('huckleberry.scanTodos', {
  async invoke(options, token) {
    // Scans the codebase for TODO comments and converts them to tasks
    // Optional pattern parameter to filter which files to scan
  }
})
```

**Example use case**: When discussing code quality or cleanup work, the AI might suggest scanning for TODOs.

### Task Listing

```typescript
vscode.lm.registerTool('huckleberry.listTasks', {
  async invoke(options, token) {
    // Lists tasks with optional filtering by priority or status
  }
})
```

**Example use case**: When planning work for the day, the AI can retrieve the current task list.

### Task Completion

```typescript
vscode.lm.registerTool('huckleberry.markTaskDone', {
  async invoke(options, token) {
    // Marks a specified task as complete
    // Requires a taskId parameter
  }
})
```

**Example use case**: After helping implement a feature, the AI could offer to mark the related task as complete.

### Task Priority Management

```typescript
vscode.lm.registerTool('huckleberry.changeTaskPriority', {
  async invoke(options, token) {
    // Changes a task's priority
    // Requires taskId and priority parameters
  }
})
```

**Example use case**: When discussing urgent issues, the AI might suggest increasing the priority of related tasks.

## How It Works

Behind the scenes, these tools connect to the same task management functionality that powers the `@Huckleberry` chat commands. The key difference is that these tools can be invoked automatically by the language model without requiring an explicit mention.

The implementation uses the [VS Code Language Model API](https://code.visualstudio.com/api/extension-guides/language-model) to register the tools and handle their invocation.

## Technical Implementation

Each tool:

1. Validates the input parameters
2. Checks for workspace availability
3. Processes the request through Huckleberry's task management system
4. Returns a formatted result to the language model

All tools use proper error handling and logging to ensure reliability and provide meaningful error messages.

## Example Workflow

Here's an example of how Language Model Tools might be used in a natural conversation:

**User**: "I need to implement user authentication for my app."

**GitHub Copilot**: "That's a good feature to implement. Would you like me to create a task for implementing user authentication?"

**User**: "Yes, please."

**GitHub Copilot**: "I've created task TASK-001: Implement user authentication. Is there anything else you'd like to add to this task?"

Behind the scenes, Copilot detected that task creation would be helpful and used the `huckleberry.createTask` tool to create the task.

## Benefits of Tool Integration

- **Seamless experience**: The AI can manage tasks without breaking the conversational flow
- **Contextual awareness**: Tools are invoked based on the conversation context
- **Reduced friction**: Users don't need to remember specific command syntax
- **Proactive assistance**: The AI can suggest task operations at appropriate moments

## Extending the Tools

The tool system is designed to be extensible. Future versions of Huckleberry may include additional tools for:

- Task dependency management
- Time tracking
- Task decomposition
- Integration with external systems