---
sidebar_position: 4
---

# Features

Huckleberry Task Manager offers a rich set of features designed to make task management seamless within your development workflow.

## Core Features

### Natural Language Task Management

Manage tasks through simple, conversational language in VS Code's chat interface:

- Create tasks using natural language descriptions
- Update task status and priority with simple commands
- Query and filter tasks based on various attributes
- All without leaving your coding environment

### Task Creation and Organization

- **Task Creation**: Create tasks with descriptions, priorities, and due dates
- **Task Categories**: Organize tasks into categories or areas
- **Priority Levels**: Assign low, medium, or high priority to tasks
- **Task Status**: Track task completion status (todo, in-progress, done)

### Task Discovery

- **TODO Comment Scanning**: Automatically discover tasks from `TODO` comments in your code
- **Requirements Parsing**: Parse project requirement documents to generate tasks
- **Task Decomposition**: Break down complex tasks into manageable subtasks

## Integration Features

### VS Code Integration

- **Chat Participant**: Integration with VS Code's chat interface via `@Huckleberry` mentions
- **Command Palette**: Access commands through VS Code's command palette
- **Language Model Tools**: Direct AI integration through VS Code's Language Model API
- **Workspace Storage**: All tasks stored locally in your workspace files

### Language Model Tools

Huckleberry provides tools that VS Code's language model (like GitHub Copilot) can directly use:

| Tool | Description |
|------|-------------|
| `huckleberry.createTask` | Creates a new task with optional priority |
| `huckleberry.initializeTaskTracking` | Sets up task tracking for the workspace |
| `huckleberry.scanTodos` | Scans the codebase for TODOs and creates tasks |
| `huckleberry.listTasks` | Lists all tasks with optional filtering by priority or status |
| `huckleberry.markTaskDone` | Marks a specified task as complete |
| `huckleberry.changeTaskPriority` | Changes a task's priority |

This allows for a seamless experience where the language model can directly perform task operations when appropriate during conversations.

## Storage and Persistence

Huckleberry stores tasks locally in your workspace, making them:

- **Version controlled**: Track task changes with your code
- **Team accessible**: Share tasks with your team
- **Transparent**: All data stored as plain text files
- **Portable**: No dependency on external servers or services

## Upcoming Features

:::note
The following features are on our roadmap but may not be available in the current version.
:::

- **Tree View**: A dedicated tree view for task visualization and management
- **VS Code Tasks Integration**: Integration with VS Code's built-in task system
- **Task Dependencies**: Define and track dependencies between tasks
- **Time Tracking**: Track time spent on tasks
- **Reporting**: Generate reports of task progress and completion

## Feature Comparison

| Feature | Huckleberry | Traditional Task Tools | VS Code Built-in Tasks |
|---------|-------------|------------------------|------------------------|
| Natural Language Interface | ✅ | ❌ | ❌ |
| AI Integration | ✅ | ❌ | ❌ |
| In-Editor Access | ✅ | ❌ | ✅ |
| Version Control | ✅ | Varies | ✅ |
| TODO Scanning | ✅ | ❌ | ❌ |
| Requirements Parsing | ✅ | ❌ | ❌ |
| Customizable | ✅ | Varies | ✅ |