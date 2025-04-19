---
sidebar_position: 8
---

# Usage

This guide provides detailed examples and scenarios for using Huckleberry Task Manager in your daily workflow.

## Basic Workflow

A typical workflow with Huckleberry consists of:

1. **Initialize** task tracking in your workspace
2. **Create** tasks through chat or by scanning TODOs
3. **Manage** task status, priority, and details
4. **Track** progress and complete tasks as you work
5. **Review** tasks to plan work and ensure completion

## Common Scenarios

### Getting Started with a New Project

When beginning a new project:

1. Open the chat panel with `Ctrl+Alt+Space` (Windows/Linux) or `Cmd+Shift+Space` (Mac)
2. Type: `@Huckleberry Initialize task tracking for this project`
3. Huckleberry will set up the necessary files and confirm when ready

### Planning Your Work

To create tasks for upcoming work:

```
@Huckleberry Create a task to implement user authentication
@Huckleberry Create a high priority task to fix security vulnerability
@Huckleberry Create a task to update documentation
```

### Importing Existing TODOs

To find TODOs in your codebase:

```
@Huckleberry Scan for TODOs in the codebase
```

For a specific file type:

```
@Huckleberry Scan for TODOs in **/*.ts
```

### Daily Task Review

At the start of your day:

```
@Huckleberry What tasks are high priority?
@Huckleberry List incomplete tasks
```

### Completing Tasks

When you finish work:

```
@Huckleberry Mark task TASK-002 as complete
```

## Advanced Usage

### Extracting Tasks from Requirements

If you have a project requirements document:

```
@Huckleberry Parse requirements.md and create tasks
```

Huckleberry will analyze the document and extract actionable tasks.

### Task Decomposition

Breaking down a complex task:

```
@Huckleberry Break down task TASK-003 into subtasks
```

### Focusing Your Work

To help decide what to work on:

```
@Huckleberry What should I work on next?
```

Huckleberry will suggest tasks based on priority and dependencies.

## Team Workflow

### Sharing Tasks

Since tasks are stored in your workspace files, you can share them with your team through version control:

1. Initialize task tracking in the shared workspace
2. Create and update tasks as needed
3. Commit the tasks directory and tasks.json to your repository
4. Team members can pull changes to see updated task information

### Collaborative Task Management

Team members can:

- Create tasks for features they're responsible for
- Mark tasks as complete when work is done
- Update task priorities based on project needs

## Integration with Development Workflow

### Creating Tasks While Coding

When you encounter an issue while coding:

```
@Huckleberry Create a task to fix the validation logic in user registration
```

### Working with TODOs

You can add TODOs in your code that Huckleberry can later scan:

```typescript
// TODO: Add error handling for API failures
function fetchUserData() {
  // implementation
}
```

Then scan for these TODOs:

```
@Huckleberry Scan for TODOs in src/api/
```

### Using the Command Palette

You can also access Huckleberry through the VS Code Command Palette:

1. Press `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (Mac)
2. Type "Huckleberry: " to see available commands
3. Select "Huckleberry: Manage Tasks" to open the task management interface

## Examples with Context

### Multi-step Task Creation and Management

Here's a more complex example showing a conversation with Huckleberry:

**User**: `@Huckleberry Create a high priority task to implement OAuth authentication`

**Huckleberry**: 
```
✅ Created task TASK-007: Implement OAuth authentication

Priority: High
Status: Todo
Created: 2025-04-19
```

**User**: `@Huckleberry Can you break this down into subtasks?`

**Huckleberry**:
```
I've broken down TASK-007 into the following subtasks:

1. Created TASK-008: Research OAuth providers
2. Created TASK-009: Set up OAuth client registration
3. Created TASK-010: Implement OAuth login flow
4. Created TASK-011: Add token refresh handling
5. Created TASK-012: Create user profile mapping

All subtasks are linked to parent task TASK-007. Would you like me to set any specific priorities for these subtasks?
```

## Best Practices

### Task Creation

- Use clear, actionable descriptions for tasks
- Include relevant context in task details
- Set appropriate priorities to focus work

### Task Organization

- Use consistent naming for similar tasks
- Keep tasks focused on a single responsibility
- Link related tasks as subtasks or dependencies

### Task Tracking

- Regularly update task status as you work
- Mark tasks complete when finished
- Review task list regularly to ensure nothing is missed

## Troubleshooting

### Task Not Found

If you get a "Task not found" error:

1. Check that you're using the correct task ID
2. Ensure task tracking is initialized in your workspace
3. Verify your workspace has the expected tasks.json file

### Chat Integration Issues

If Huckleberry isn't responding in chat:

1. Ensure you're using the correct mention format: `@Huckleberry`
2. Check that VS Code is up to date (version 1.93 or later)
3. Try reloading the window with the Command Palette: `Developer: Reload Window`