---
sidebar_position: 6
---

# Chat Commands

Huckleberry integrates directly with VS Code's chat interface, allowing you to manage tasks through natural language commands. This page documents the available chat commands and provides examples of how to use them.

## Using the Chat Interface

To interact with Huckleberry through chat:

1. Open VS Code's chat panel by clicking on the chat icon in the Activity Bar or using the keyboard shortcut `Ctrl+Alt+Space` (Windows/Linux) or `Cmd+Shift+Space` (Mac)
2. Address Huckleberry by typing `@Huckleberry` followed by your command
3. The chat participant will process your request and provide feedback

## Available Commands

### Task Setup Commands

#### Initialize Task Tracking

```
@Huckleberry Initialize task tracking for this project
```

Sets up the task tracking structure in your workspace, creating necessary files and directories.

### Task Creation Commands

#### Create a Basic Task

```
@Huckleberry Create a task to implement user authentication
```

Creates a new task with default priority.

#### Create a Task with Priority

```
@Huckleberry Create a high priority task to fix security vulnerability
```

Creates a task with the specified priority (low, medium, or high).

### Task Viewing Commands

#### List All Tasks

```
@Huckleberry List all tasks
```

Shows all tasks in the workspace.

#### Filter Tasks by Priority

```
@Huckleberry What tasks are high priority?
```

Lists only tasks with high priority.

#### Filter Tasks by Status

```
@Huckleberry List completed tasks
```

Lists only tasks that have been marked as complete.

### Task Management Commands

#### Mark Task as Complete

```
@Huckleberry Mark task TASK-001 as complete
```

Changes the status of the specified task to "complete".

#### Change Task Priority

```
@Huckleberry Mark task TASK-002 as high priority
```

Updates the priority of the specified task.

### Task Discovery Commands

#### Scan for TODOs

```
@Huckleberry Scan for TODOs in the codebase
```

Scans all files in the workspace for TODO comments and creates tasks for them.

#### Scan with Pattern

```
@Huckleberry Scan for TODOs in **/*.ts
```

Scans only files matching the specified glob pattern.

#### Parse Requirements

```
@Huckleberry Parse requirements.md and create tasks
```

Analyzes a requirements document and automatically generates tasks from it.

## Command Format

While Huckleberry understands natural language, it's helpful to follow certain patterns for the best results:

- Start with `@Huckleberry` to address the chat participant
- Clearly state the action you want to perform (create, list, mark, scan)
- Provide necessary details like task descriptions, IDs, or priorities
- Use natural language - you don't need to remember exact command syntax

## Examples with Responses

Here are some examples of chat commands and what the responses might look like:

### Example: Creating a Task

**User**: `@Huckleberry Create a task to implement user login form`

**Huckleberry**:
```
✅ Created task TASK-003: Implement user login form

Priority: Medium
Status: Todo
Created: 2025-04-18
```

### Example: Scanning for TODOs

**User**: `@Huckleberry Scan for TODOs in src/**/*.ts`

**Huckleberry**:
```
📋 Found 3 TODOs in your code:

1. Created task TASK-004: Implement password validation (src/auth/validation.ts:24)
2. Created task TASK-005: Add error handling for failed login attempts (src/auth/login.ts:47)
3. Created task TASK-006: Create unit tests for authentication flow (src/auth/tests.ts:12)
```

### Example: Listing Tasks by Priority

**User**: `@Huckleberry What tasks are high priority?`

**Huckleberry**:
```
🔍 Found 2 high priority tasks:

TASK-002: Fix security vulnerability in authentication flow
- Status: In Progress
- Created: 2025-04-15

TASK-005: Add error handling for failed login attempts
- Status: Todo
- Created: 2025-04-18
```

## Error Handling

If Huckleberry doesn't understand a command or encounters an error, it will provide feedback:

**User**: `@Huckleberry Mark task XYZ-123 as complete`

**Huckleberry**:
```
❌ Error: Task with ID XYZ-123 not found.

Available task IDs are: TASK-001, TASK-002, TASK-003, TASK-004, TASK-005, TASK-006
```

## Using Chat Effectively

For the best experience with Huckleberry in chat:

- Be specific in your requests to avoid ambiguity
- Use task IDs when referring to specific tasks
- Remember that you can have a conversational flow with follow-up questions
- Take advantage of the AI-powered assistance to help manage your tasks

## Advanced Usage

You can combine commands in natural ways:

**User**: `@Huckleberry What are my high priority tasks and mark TASK-002 as complete when I finish it`

**Huckleberry** will list high priority tasks and provide instructions for marking TASK-002 as complete.