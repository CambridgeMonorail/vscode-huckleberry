---
sidebar_position: 7
title: Language Model Tools
---

# Language Model Tools

Huckleberry provides a set of Language Model Tools that integrate with VS Code's AI features, allowing GitHub Copilot Chat to directly interact with your task management system through natural language.

## Available Tools

Huckleberry offers the following language model tools:

### Create Task

Creates a new task in your project's task management system.

**Tool Name**: `create_task`

**Parameters**:

- `description` (required): Description of the task to create
- `priority` (optional): Priority level of the task - can be "low", "medium", "high", or "critical"

**Example Usage**:

Ask GitHub Copilot:

```
Create a task to implement user authentication
```

Or with priority:

```
Create a high priority task to fix security vulnerability in login
```

### Initialize Task Tracking

Sets up task tracking for your project workspace.

**Tool Name**: `initialize_task_tracking`

**Example Usage**:

Ask GitHub Copilot:

```
Initialize task tracking for this project
```

### Scan TODOs

Scans your codebase for TODO comments and converts them to tracked tasks.

**Tool Name**: `scan_todos`

**Parameters**:

- `pattern` (optional): File pattern to scan for TODOs (e.g., "**/*.js")

**Example Usage**:

Ask GitHub Copilot:

```
Scan for TODOs in the codebase
```

Or with a specific pattern:

```
Scan for TODOs in JavaScript files
```

### List Tasks

Shows your current tasks with optional filtering.

**Tool Name**: `list_tasks`

**Parameters**:

- `priority` (optional): Filter by priority - can be "low", "medium", "high", "critical", or "all"
- `status` (optional): Filter by status - can be "open", "in_progress", "done", or "all"

**Example Usage**:

Ask GitHub Copilot:

```
Show me all my tasks
```

Or with filters:

```
What high priority tasks are still open?
```

### Mark Task Done

Marks a task as completed.

**Tool Name**: `mark_task_done`

**Parameters**:

- `taskId` (required): ID of the task to mark as done

**Example Usage**:

Ask GitHub Copilot:

```
Mark task HUCK-123 as complete
```

### Change Task Priority

Updates the priority of a task.

**Tool Name**: `change_task_priority`

**Parameters**:

- `taskId` (required): ID of the task to update
- `priority` (required): New priority for the task - can be "low", "medium", "high", or "critical"

**Example Usage**:

Ask GitHub Copilot:

```
Change task HUCK-123 to high priority
```

## Using with GitHub Copilot

To use Huckleberry's language model tools with GitHub Copilot Chat:

1. Make sure GitHub Copilot and GitHub Copilot Chat are installed and enabled in VS Code
2. The Huckleberry extension should also be installed and active
3. Open a workspace where you want to manage tasks
4. Start a conversation with GitHub Copilot Chat and ask about your tasks or request actions using natural language

For example, you might start with:

```
@copilot I need to start tracking tasks for this project
```

GitHub Copilot will use Huckleberry's language model tools to help you manage your tasks.

## How It Works

When you interact with GitHub Copilot Chat, GitHub Copilot can access the language model tools registered by the Huckleberry extension. This allows it to:

1. Parse your natural language requests
2. Map them to the appropriate tool
3. Provide the necessary parameters to execute the tool
4. Return the results in a conversational format

This integration creates a seamless experience where you can manage your tasks through natural language, without leaving your coding environment.

## Troubleshooting

If language model tools aren't working correctly:

1. Make sure you have a workspace open (tools only work within a workspace)
2. Check that GitHub Copilot and Huckleberry extensions are properly installed and activated
3. Try reloading VS Code
4. Enable Agent Mode in GitHub Copilot settings for best results
5. Check the Output panel (Huckleberry Debug channel) for any error messages
