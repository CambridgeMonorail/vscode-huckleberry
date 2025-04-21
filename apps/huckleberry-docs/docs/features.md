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

- **Agent Mode Integration**: Direct AI integration through VS Code's Language Model API

- **Workspace Storage**: All tasks stored locally in your workspace files

### Agent Mode Tools

Huckleberry integrates with VS Code's Language Model API (known as "Agent Mode"), allowing AI assistants like GitHub Copilot to directly interact with Huckleberry's task management features without requiring explicit `@Huckleberry` mentions.

Key agent mode capabilities include:

- Creating and updating tasks through natural conversation

- Initializing task tracking for new projects

- Scanning codebase for TODOs

- Listing and filtering tasks

- Updating task status and priority

For complete details on available tools and how they work, see the [Language Model Tools (Agent Mode)](./language-model-tools.md) documentation.

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
