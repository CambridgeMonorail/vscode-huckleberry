# Huckleberry Task Manager

![Huckleberry Logo](https://raw.githubusercontent.com/CambridgeMonorail/vscode-huckleberry/main/assets/images/huckleberry-logo.png)

AI-powered task management inside Visual Studio Code

[![Release](https://img.shields.io/github/v/release/CambridgeMonorail/vscode-huckleberry?include_prereleases&style=flat-square)](https://github.com/CambridgeMonorail/vscode-huckleberry/releases)
[![License](https://img.shields.io/github/license/CambridgeMonorail/vscode-huckleberry?style=flat-square)](./LICENSE)
[![VS Code Version](https://img.shields.io/badge/VS%20Code-%5E1.93.0-blue?style=flat-square)](https://code.visualstudio.com/updates/v1_93)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](https://github.com/CambridgeMonorail/vscode-huckleberry/blob/main/CONTRIBUTING.md)
[![Contributors](https://img.shields.io/github/contributors/CambridgeMonorail/vscode-huckleberry?style=flat-square)](https://github.com/CambridgeMonorail/vscode-huckleberry/graphs/contributors)

> **⚠️ ALPHA STATUS**: This extension is in early development (version 0.1.24). Features are incomplete, APIs may change, and parts may be non-functional. We welcome your feedback and contributions as we work towards a stable release!

## Features • [Installation](#installation) • [Getting Started](#getting-started) • [Commands](#commands) • [Settings](#settings) • [FAQ](#faq) • [Support](#support)

## Overview

Huckleberry is an AI-powered task manager that brings natural language task management directly into your VS Code workflow. Using VS Code's chat interface, you can have natural conversations with a dedicated Task Manager agent that helps you track, manage, and organise project tasks without leaving your development environment.

> **AI Transparency**: This extension uses VS Code's Language Model API. While these models are powerful tools for understanding natural language requests, they may sometimes produce responses that are incorrect or incomplete. We recommend verifying important decisions, especially for critical project components.

For comprehensive documentation, visit our [documentation site](https://cambridgemonorail.github.io/vscode-huckleberry/).

## Features

- 🗣️ **Natural Language Interface** - Create and manage tasks using conversational language
- 📋 **Smart PRD Parsing** - Extract tasks automatically from project requirement documents
- ✅ **Task Lifecycle Management** - Create, track, and complete tasks with simple chat commands
- 🔄 **Task Decomposition** - Break complex tasks into manageable subtasks
- 📊 **Priority Management** - Organize tasks by priority, due date, and dependencies
- 💾 **Workspace Integration** - Tasks are stored in your project files for version control and team sharing
- 🤖 **Language Model Integration** - Tasks can be created and managed directly by VS Code's language model

## Installation

1. Install from the [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=CambridgeMonorail.vscode-huckleberry)
2. Reload VS Code when prompted

Or install from VSIX:

1. Download from [GitHub releases](https://github.com/CambridgeMonorail/vscode-huckleberry/releases)
2. In VS Code, run "Install from VSIX" and select the downloaded file
3. Reload VS Code when prompted

### System Requirements

- Visual Studio Code version 1.93 or later
- GitHub Copilot subscription (for AI features)
- Internet connection (for AI access)
- 4GB RAM minimum (8GB recommended)

## Getting Started

After installation:

1. Open VS Code's Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`)
2. Run "Huckleberry: Initialize Task Tracking"
3. Open VS Code's chat panel and type `@Huckleberry help`

Try these example commands:

```
@Huckleberry Create a task to implement user authentication
@Huckleberry Scan for TODOs in the codebase
@Huckleberry What tasks are high priority?
@Huckleberry Mark task TASK-123 as done
@Huckleberry Break task TASK-123 into subtasks
```

## Command Reference

### Quick Start Commands

The fastest way to get started is through VS Code's Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`):

- **Huckleberry: Manage Tasks** - Open the task management interface
- **Huckleberry: Initialize Task Tracking** - Set up task tracking for your workspace
- **Huckleberry: Create Task** - Create a new task quickly
- **Huckleberry: Open Task Explorer** - View all tasks in a dedicated panel

### Natural Language Commands

In the VS Code chat panel, mention `@Huckleberry` followed by what you want to do:

Task Creation:
```text
@Huckleberry Create a task to implement user authentication
@Huckleberry Create a high priority task to fix security vulnerability
@Huckleberry Break task TASK-123 into subtasks
```

Task Management:
```text
@Huckleberry List all tasks
@Huckleberry What tasks are high priority?
@Huckleberry Mark task TASK-123 as complete
@Huckleberry Prioritise tasks by deadline
```

Scanning and Analysis:
```text
@Huckleberry Scan for TODOs in the codebase
@Huckleberry Scan for TODOs in **/*.ts
@Huckleberry Parse requirements.md and create tasks
@Huckleberry What task should I work on next?
```

### VS Code Command Palette Reference

Full list of available commands in the Command Palette:

| Command | Description |
|---------|-------------|
| `Huckleberry: Manage Tasks` | Open the task management interface |
| `Huckleberry: Initialize Task Tracking` | Set up task tracking for the current workspace |
| `Huckleberry: Create Task` | Create a new task in the workspace |
| `Huckleberry: List Tasks` | List all tasks in the workspace |
| `Huckleberry: Mark Task Complete` | Mark a task as completed |
| `Huckleberry: Change Task Priority` | Change the priority of a task |
| `Huckleberry: Scan TODOs` | Scan workspace files for TODO comments |
| `Huckleberry: Prioritize Tasks` | Sort tasks by status and priority |
| `Huckleberry: Get Next Task` | Suggest the next task to work on |
| `Huckleberry: Get Help` | Show help and command reference |
| `Huckleberry: Parse Requirements Document` | Extract tasks from a PRD |
| `Huckleberry: Open Task Explorer` | Open the task visualization view |
| `Huckleberry: Create Subtasks` | Break down a task into subtasks |
| `Huckleberry: Export Tasks` | Export tasks (markdown, CSV, JSON) |

## Settings

| Setting | Description | Default |
|---------|-------------|---------|
| `huckleberry.taskmanager.defaultTasksLocation` | Location for task files | `"tasks"` |
| `huckleberry.taskmanager.taskFileTemplate` | Format for task files | `"markdown"` |
| `huckleberry.taskmanager.defaultTaskPriority` | Default priority level | `"medium"` |
| `huckleberry.taskmanager.defaultDueDate` | Default due date setting | `"none"` |

## FAQ

**Do I need GitHub Copilot?**
While basic task management works without Copilot, the AI-powered features require a GitHub Copilot subscription.

**Where are tasks stored?**
All tasks are stored locally in your workspace under the tasks directory (configurable). Tasks are saved as plain text files that can be version controlled.

**Can I use it offline?**
Basic task management works offline, but AI features require an internet connection.

**How do I migrate tasks?**
Simply copy the tasks directory between workspaces. All task data is stored in plain text files.

**Which languages are supported?**
Huckleberry works with any programming language. The TODO scanning feature supports all languages recognized by VS Code.

## Troubleshooting

### Chat Features Not Working

1. Ensure VS Code 1.93+ is installed
2. Verify GitHub Copilot is installed and signed in
3. If you opened a folder after VS Code started, reload the window
4. Check Output panel for "Huckleberry" logs

### Task Files Not Showing

1. Verify tasks directory exists
2. Run "Initialize Task Tracking" command
3. Check workspace write permissions

### AI Features Not Working

1. Verify active Copilot subscription
2. Check internet connection
3. Try switching language model
4. Reload workspace

For more help, see our [troubleshooting guide](https://github.com/CambridgeMonorail/vscode-huckleberry/wiki/Troubleshooting).

## Privacy and Data Handling

Your privacy is important to us. Huckleberry:

- Uses VS Code's Language Model API for natural language processing
- Stores task data locally in your workspace
- Does not collect telemetry or personal data
- Does not send workspace data to external services except for AI processing via VS Code's API
- Requires GitHub Copilot access for AI features

## Known Limitations

- **Alpha Status**: This extension is in early development (0.1.24). Features may be incomplete or change.
- **AI Dependencies**:  
  - Requires active internet connection
  - Requires GitHub Copilot subscription
  - AI suggestions may contain errors and should be reviewed
  - AI features may not work in restricted or airgapped environments
- **Performance**:  
  - Initial task parsing of large documents may take a few seconds
  - Recommended RAM: 8GB for optimal performance
- **Language Support**: While the extension works with any programming language, it has been primarily tested with:  
  - TypeScript/JavaScript
  - Python
  - C#
  - Java

## Contributing

We welcome contributions! Here's how you can help:

- 🐛 [Report bugs](https://github.com/CambridgeMonorail/vscode-huckleberry/issues/new?labels=bug&template=bug_report.md)
- 💡 [Suggest features](https://github.com/CambridgeMonorail/vscode-huckleberry/issues/new?labels=enhancement&template=feature_request.md)
- 🔀 [Submit PRs](https://github.com/CambridgeMonorail/vscode-huckleberry/pulls)

See our [Contributing Guide](CONTRIBUTING.md) for detailed guidelines.

## Support

Need help?

1. Check the [FAQ](#faq) and [Troubleshooting](#troubleshooting) sections
2. Search [GitHub issues](https://github.com/CambridgeMonorail/vscode-huckleberry/issues)
3. Create a new issue
4. Join [discussions](https://github.com/CambridgeMonorail/vscode-huckleberry/discussions)

## License

[MIT License](./LICENSE)

---

Made with ❤️ by [CambridgeMonorail](https://github.com/CambridgeMonorail)

## Features in Action

### Natural Language Task Creation

Create and manage tasks using natural language in VS Code's chat interface. Simply open the chat panel, mention @Huckleberry, and describe your task - it's that easy!

![Task creation in VS Code chat](https://raw.githubusercontent.com/CambridgeMonorail/vscode-huckleberry/main/media/screenshots/task-creation.gif)

> More feature demonstrations coming soon! Check our [documentation site](https://cambridgemonorail.github.io/vscode-huckleberry/) for updates.

## AI Ethics and Guidelines

Huckleberry follows strict ethical AI principles:

### Content Safety

- Uses VS Code's Language Model API's built-in content filtering
- Refuses to generate harmful, offensive, or inappropriate content
- Will not engage with prompts attempting to bypass content restrictions

### Fairness and Inclusivity

- Works consistently across all programming languages and projects
- Uses inclusive language in all interactions
- Provides clear error messages and guidance in all scenarios

### Transparency

- Clearly indicates when AI is being used
- Distinguishes between AI-generated suggestions and deterministic features
- Provides explanations for AI-based decisions when relevant

### User Control and Privacy

- All task data stays in your workspace
- No data collection beyond what's needed for AI features
- You control when and how AI features are used
- Non-AI features work without Copilot subscription

### Feedback and Reporting

If you encounter any issues with AI-generated content or behavior:

1. Use the "Report Issue" command in VS Code
2. Open an issue on our [GitHub repository](https://github.com/CambridgeMonorail/vscode-huckleberry/issues/new)
3. Join our [discussions](https://github.com/CambridgeMonorail/vscode-huckleberry/discussions) for feature requests

We actively monitor and address all AI-related feedback to ensure responsible AI usage.
