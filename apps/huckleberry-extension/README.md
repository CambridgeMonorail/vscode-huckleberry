# Huckleberry Task Manager

<div align="center">
  <img src="https://raw.githubusercontent.com/CambridgeMonorail/vscode-huckleberry/main/assets/images/huckleberry-logo.png" alt="Huckleberry Logo" width="128">
  
  <p><em>AI-powered task management inside Visual Studio Code</em></p>
</div>

## Overview

Huckleberry Task Manager is a VS Code extension that brings AI-powered task management directly into your coding workflow. Using the VS Code Chat interface, you can have natural conversations with a dedicated Task Manager agent that helps you track, manage, and organize project tasks without ever leaving your development environment.

## Features

- 🗣️ **Natural Language Interface** - Create and manage tasks using conversational language
- 📋 **Smart PRD Parsing** - Extract tasks automatically from project requirement documents
- ✅ **Task Lifecycle Management** - Create, track, and complete tasks with simple chat commands
- 🔄 **Task Decomposition** - Break complex tasks into manageable subtasks
- 📊 **Priority Management** - Organize tasks by priority, due date, and dependencies
- 💾 **Workspace Integration** - Tasks are stored in your project files for version control and team sharing

## Getting Started

### Prerequisites

- Visual Studio Code version 1.93 or later
- GitHub Copilot subscription (for enhanced AI capabilities)

### Basic Usage

After installation:

1. Open the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`)
2. Type "Huckleberry: Manage Tasks" to open the task management interface
3. Alternatively, open VS Code's chat panel and start a conversation with `@Huckleberry`

### Example Commands

Try these commands in the VS Code chat panel:

```
@Huckleberry Initialize task tracking for this project
@Huckleberry Create a task to implement user authentication
@Huckleberry What tasks are high priority?
@Huckleberry Mark task TASK-123 as complete
@Huckleberry Parse requirements.md and create tasks
```

## Settings

Customize Huckleberry through VS Code settings:

| Setting | Description | Default |
|---------|-------------|---------|
| `huckleberry.taskmanager.defaultTasksLocation` | Location for task files | `"tasks"` |
| `huckleberry.taskmanager.taskFileTemplate` | Format for task files | `"markdown"` |
| `huckleberry.taskmanager.defaultTaskPriority` | Default priority level | `"medium"` |
| `huckleberry.taskmanager.defaultDueDate` | Default due date setting | `"none"` |

## Task Storage

Huckleberry stores tasks in two formats:

1. **tasks.json** - A master index of all tasks with metadata
2. **Individual markdown files** - One file per task with detailed information

All tasks are stored as plain files in your workspace, making them easy to version control and share with your team.

## Commands

Huckleberry provides both chat commands and traditional VS Code commands:

### VS Code Commands (Command Palette)

| Command | Description |
|---------|-------------|
| `Huckleberry: Manage Tasks` | Open the task management interface |

### Chat Commands

Interact with Huckleberry through the VS Code chat interface by addressing `@Huckleberry` followed by natural language commands:

| Example | Description |
|---------|-------------|
| `@Huckleberry Initialize task tracking for this project` | Set up task tracking in the current workspace |
| `@Huckleberry Create a task to implement user authentication` | Create a new task with the specified description |
| `@Huckleberry What tasks are high priority?` | List all tasks with high priority |
| `@Huckleberry Mark task TASK-123 as complete` | Mark the specified task as completed |
| `@Huckleberry Parse requirements.md and create tasks` | Extract tasks from a requirements document |

You can also start a conversation with Huckleberry by selecting it from the chat participants in the VS Code chat panel.

## Privacy and Security

All task management operations are performed locally within VS Code. When you interact with Huckleberry through chat:

1. Your messages are processed by the GitHub Copilot service (similar to regular Copilot usage)
2. File operations and task management are performed locally by the extension
3. No task data is sent to external servers

## Keyboard Shortcuts

No default keyboard shortcuts are assigned, but you can add your own through VS Code's keyboard shortcuts settings.

## Extension Development

This extension is part of the Huckleberry project, a monorepo built with Nx. For development setup:

```bash
# Clone the repo
git clone https://github.com/CambridgeMonorail/vscode-huckleberry.git

# Install dependencies
pnpm install

# Build the extension
pnpm run build:extension

# Package the extension
pnpm run package:extension
```

For more information about development, please see the [project repository](https://github.com/CambridgeMonorail/vscode-huckleberry).

## Privacy Notice

Huckleberry Task Manager stores all task data locally in your workspace and does not send task information to external servers.

## Known Issues

- This extension is currently in early development (alpha status)
- Some features remain under active development

## License

MIT License - See the LICENSE file for details.

---

<div align="center">
  <p>© 2025 CambridgeMonorail - Huckleberry Project</p>
</div>
