# Huckleberry Task Manager

<div align="center">
  <img src="https://raw.githubusercontent.com/CambridgeMonorail/vscode-huckleberry/main/assets/images/huckleberry-logo.png" alt="Huckleberry Logo" width="128">
  
  <p><em>AI-powered task management inside Visual Studio Code</em></p>
</div>

## Overview

Huckleberry Task Manager is a VS Code extension that brings AI-powered task management directly into your coding workflow. Using the VS Code Chat interface, you can have natural conversations with a dedicated Task Manager agent that helps you track, manage, and organize project tasks without ever leaving your development environment.

For comprehensive documentation, visit [https://cambridgemonorail.github.io/vscode-huckleberry/](https://cambridgemonorail.github.io/vscode-huckleberry/).

## Features

- 🗣️ **Natural Language Interface** - Create and manage tasks using conversational language
- 📋 **Smart PRD Parsing** - Extract tasks automatically from project requirement documents
- ✅ **Task Lifecycle Management** - Create, track, and complete tasks with simple chat commands
- 🔄 **Task Decomposition** - Break complex tasks into manageable subtasks
- 📊 **Priority Management** - Organize tasks by priority, due date, and dependencies
- 💾 **Workspace Integration** - Tasks are stored in your project files for version control and team sharing
- 🤖 **Language Model Integration** - Tasks can be created and managed directly by VS Code's language model

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
@Huckleberry Create a high priority task to fix security vulnerability
@Huckleberry Scan for TODOs in the codebase
@Huckleberry Scan for TODOs in **/*.ts
@Huckleberry What tasks are high priority?
@Huckleberry List all tasks
@Huckleberry Mark task TASK-123 as complete
@Huckleberry Mark task TASK-123 as high priority
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
| `@Huckleberry Create a high priority task to fix security vulnerability` | Create a new high priority task |
| `@Huckleberry Scan for TODOs in the codebase` | Scan the codebase for TODO comments |
| `@Huckleberry Scan for TODOs in **/*.ts` | Scan TypeScript files for TODO comments |
| `@Huckleberry What tasks are high priority?` | List all tasks with high priority |
| `@Huckleberry List all tasks` | List all tasks in the workspace |
| `@Huckleberry Mark task TASK-123 as complete` | Mark the specified task as completed |
| `@Huckleberry Mark task TASK-123 as high priority` | Mark the specified task as high priority |
| `@Huckleberry Parse requirements.md and create tasks` | Extract tasks from a requirements document |

You can also start a conversation with Huckleberry by selecting it from the chat participants in the VS Code chat panel.

### Agent Mode Language Model Tool Integration

Huckleberry integrates with the VS Code Language Model Tools API (also known as "Copilot agent mode"), allowing the AI to directly interact with task management features without requiring explicit `@Huckleberry` mentions. The following tools are available to Copilot when in agent mode:

| Tool | Description |
|------|-------------|
| `create_task` | Creates a new task with optional priority |
| `initialize_tracking` | Sets up task tracking for a project workspace |
| `scan_todos` | Scans the codebase for TODO comments and converts them to tasks |
| `list_tasks` | Lists tasks from the task manager with optional filtering by priority or status |
| `mark_task_done` | Marks a task as complete by providing the task ID |
| `update_task_priority` | Changes the priority of a task by providing the task ID and new priority |

With this integration, VS Code's language models (like GitHub Copilot) can perform task management operations without requiring explicit `@Huckleberry` mentions, creating a more seamless experience.

## Privacy and Security

All task management operations are performed locally within VS Code. When you interact with Huckleberry through chat:

1. Your messages are processed by the GitHub Copilot service (similar to regular Copilot usage)
2. File operations and task management are performed locally by the extension
3. No task data is sent to external servers

## Keyboard Shortcuts

No default keyboard shortcuts are assigned, but you can add your own through VS Code's keyboard shortcuts settings.

## Privacy Notice

Huckleberry Task Manager stores all task data locally in your workspace and does not send task information to external servers.

## Known Limitations

- **VS Code Limitation:** If you open a folder after starting VS Code (i.e., you start with no folder/workspace and then open one), you must reload the window (`Developer: Reload Window` or use the reload prompt) for Huckleberry chat features to work. This is due to a limitation in the VS Code extension host: chat participants are only registered at activation time. Reloading the window ensures the extension is properly activated in the new workspace context.

- This extension is currently in early development (alpha status)
- Some features remain under active development

## License

MIT License - See the LICENSE file for details.

---

<div align="center">
  <p>© 2025 CambridgeMonorail - Huckleberry Project</p>
</div>
