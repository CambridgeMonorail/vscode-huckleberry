# Huckleberry Task Manager

## Overview

The Huckleberry Task Manager is a VS Code extension that helps developers manage tasks and project requirements efficiently within their VS Code environment. It focuses on providing assistance with task tracking, organization, and status updates.

## Capabilities

The Task Manager can help with:

- Reading, creating, and updating task files (markdown and JSON format)
- Marking tasks as complete or incomplete
- Generating reports on project progress
- Organizing tasks by priority, status, or category
- Creating new task lists from project requirements
- Providing summaries of completed and pending tasks

## Task File Formats

The Task Manager supports two primary task file formats:

### Markdown Tasks

```markdown
# Project Tasks

## Development Tasks
- [x] Create project structure
- [ ] Implement feature A
- [ ] Implement feature B

## Documentation Tasks
- [ ] Write API documentation
- [ ] Create user guide
```

### JSON Tasks

```json
{
  "tasks": [
    {
      "id": "task-1",
      "title": "Create project structure",
      "description": "Set up the initial project directory structure",
      "priority": "high",
      "status": "completed",
      "completed": true
    },
    {
      "id": "task-2",
      "title": "Implement feature A",
      "description": "Develop the core functionality for feature A",
      "priority": "high",
      "status": "in-progress",
      "completed": false
    }
  ]
}
```

## Using Task Manager

### Installation

1. Download the VSIX file from the releases page
2. Open VS Code
3. Go to Extensions view (Ctrl+Shift+X)
4. Click on "..." at the top of the Extensions view
5. Select "Install from VSIX..."
6. Browse to and select the downloaded VSIX file

### Initial Setup

After installation, you can configure Task Manager in your VS Code settings:

1. Open Settings (Ctrl+,)
2. Search for "Huckleberry"
3. Configure the following options:
   - Default task location
   - Task file template (Markdown or JSON)
   - Default task priority

### Chat Commands

The Task Manager is available as a chat participant in VS Code. You can interact with it by:

1. Opening the Chat view in VS Code
2. Starting a new conversation with "Task Manager"
3. Using one of the following commands:
   - `@Task Manager list tasks`: List all tasks in the default location
   - `@Task Manager create task`: Start the task creation process
   - `@Task Manager mark task done`: Mark a task as completed
   - `@Task Manager generate report`: Generate a report of task status

### Command Palette

You can also access Task Manager functionality through the Command Palette (Ctrl+Shift+P):

- `Huckleberry: Manage Tasks`: Opens the task management interface

## Task Properties

When working with tasks, the Task Manager recognizes and handles the following properties:

- **Title**: A concise description of the task
- **Description**: A detailed explanation of what the task involves
- **Priority**: How important the task is (e.g., high, medium, low)
- **Status**: Current state of the task (e.g., backlog, in-progress, completed)
- **Due Date**: When the task is expected to be completed
- **Assignee**: Who is responsible for completing the task
- **Tags/Labels**: Categories or descriptors for organizing tasks

## Common Workflows

### Creating a New Task

1. Start a chat with Task Manager: `@Task Manager create task`
2. Follow the prompts to provide task details:
   - Title (required)
   - Description (optional)
   - Priority (optional)
   - Due date (optional)
3. Task Manager will create the task in your default tasks location

### Updating Task Status

1. Start a chat with Task Manager: `@Task Manager mark task done`
2. Provide the task identifier or description
3. Task Manager will locate and update the task status

### Generating Reports

1. Start a chat with Task Manager: `@Task Manager generate report`
2. Task Manager will read your task files and generate a summary
3. The report will include completion statistics and upcoming deadlines

## Extension Settings

This extension contributes the following settings:

- `huckleberry.taskmanager.defaultTasksLocation`: Default location for task files (relative to workspace root)
- `huckleberry.taskmanager.taskFileTemplate`: Template format to use when creating new task files (markdown or json)
- `huckleberry.taskmanager.defaultTaskPriority`: Default priority for new tasks when unspecified
- `huckleberry.taskmanager.defaultDueDate`: Default due date setting for new tasks
- `huckleberry.taskmanager.customDueDateDays`: Number of days for custom due date setting

## Future Enhancements

The following features are planned for future releases:

- Integration with GitHub Issues
- Task visualizations and burndown charts
- Task dependencies and relationships
- Team collaboration features
- Customizable task templates