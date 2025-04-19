# Huckleberry - VS Code Task Manager Extension

<div align="center">
  <img src="./assets/images/huckleberry-logo-with-name.svg" alt="Huckleberry Logo" width="300">
  
  <p><em>AI-powered task management inside Visual Studio Code</em></p>

  <p>
    <a href="#features">Features</a> •
    <a href="#installation">Installation</a> •
    <a href="#usage">Usage</a> •
    <a href="#development">Development</a> •
    <a href="#roadmap">Roadmap</a> •
    <a href="#license">License</a>
  </p>
</div>

> **⚠️ ALPHA STATUS**: This project is in early development. Features are incomplete, APIs may change, and parts may be non-functional. Contributions and feedback welcome! Huckleberry is not yet available on the VS Code Marketplace.

## Overview

Huckleberry is a VS Code extension that brings AI-powered task management directly into your coding workflow. Using the VS Code Chat interface, you can have natural conversations with a dedicated Task Manager agent that helps you track, manage, and organize project tasks.

Powered by the VS Code Language Model API and Copilot Chat integration, Huckleberry creates a conversational interface for automated task management without leaving your development environment.

## Features

- 🗣️ Natural language task creation and management through chat
- 📋 Parse PRD documents to automatically generate structured tasks
- ✅ Mark tasks complete, update priorities, and manage dependencies
- 🔄 Break down tasks into subtasks for complex projects
- 📊 Get suggestions for the next tasks to tackle
- 💾 Persistent task state stored in your project files
- 🤖 Language Model Tools integration for seamless AI-assisted task management

## Why a VS Code Extension (Not Just an MCP Tool)?

While GitHub Copilot can use Model Context Protocol (MCP) tools, Huckleberry is implemented as a full VS Code extension for several key reasons:

1. **Deep VS Code Integration**: As a VS Code extension, Huckleberry can directly access the VS Code Chat API and Language Model API, allowing it to:
   - Register as a first-class chat participant with `@Huckleberry` mention support
   - Maintain conversation context across chat sessions
   - Access the same language models used by GitHub Copilot
   - Register Language Model Tools for direct AI use without manual commands

2. **Enhanced Capabilities**: Rather than being just a tool that Copilot can call, Huckleberry:
   - Can direct and guide the Copilot agent proactively
   - Has full access to VS Code's extension APIs for UI integration
   - Can maintain persistent state and configuration
   - Can provide custom commands and UI elements

3. **Security & Performance**: Running as a VS Code extension means:
   - All task data stays local to your workspace
   - No need for external MCP server setup or maintenance
   - Direct access to workspace files without network overhead

This architecture allows Huckleberry to provide a richer, more integrated task management experience while leveraging the power of GitHub Copilot's AI capabilities.

## Installation

> **Note**: Huckleberry is not yet available on the VS Code Marketplace.

Once released, installation will be as simple as:

```
ext install huckleberry.taskmanager
```

### Prerequisites

- VS Code version 1.93 or later
- GitHub Copilot subscription

## Usage

After installation:

1. Open the Copilot Chat panel in VS Code
2. Start a conversation with the Task Manager by typing `@Huckleberry`
3. Try commands like:

```
# Project setup
@Huckleberry Initialize task tracking for this project

# Creating tasks
@Huckleberry Create a task to implement user authentication
@Huckleberry Create a high priority task to fix security vulnerability

# Finding TODOs in code
@Huckleberry Scan for TODOs in the codebase
@Huckleberry Scan for TODOs in **/*.ts

# Task management
@Huckleberry What tasks are high priority?
@Huckleberry List all tasks
@Huckleberry Mark task TASK-001 as complete
@Huckleberry Mark task TASK-002 as high priority

# Requirements processing
@Huckleberry Parse requirements.md and create tasks
```

You can also access Huckleberry from the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`) by typing "Huckleberry: Manage Tasks".

### Language Model Tools

Huckleberry now integrates with the VS Code Language Model Tools API, allowing the AI to directly interact with task management features without requiring explicit `@Huckleberry` mentions. The following tools are available:

| Tool | Description |
|------|-------------|
| `huckleberry.createTask` | Creates a new task with optional priority |
| `huckleberry.initializeTaskTracking` | Sets up task tracking for the workspace |
| `huckleberry.scanTodos` | Scans the codebase for TODOs and creates tasks |
| `huckleberry.listTasks` | Lists all tasks with optional filtering by priority or status |
| `huckleberry.markTaskDone` | Marks a specified task as complete |
| `huckleberry.changeTaskPriority` | Changes a task's priority |

This integration provides a more seamless experience as the language model can directly perform task operations when appropriate during conversations.

## How It Works

Huckleberry leverages VS Code's Chat API and Language Model API to create a custom chat participant that manages tasks through natural language. It stores task information in:

- **`tasks.json`** - A JSON database of task objects with IDs, titles, descriptions, and status
- **Task files** - Individual files for each task with detailed descriptions and notes

All task data is persisted in your workspace files for transparency and portability.

## Development

This project is built with an Nx monorepo containing both the VS Code extension and a demo site.

### Getting Started

```bash
# Clone the repository
git clone https://github.com/yourusername/vscode-huckleberry.git
cd vscode-huckleberry

# Install dependencies
npm install

# Build the extension
nx build huckleberry-extension

# Package the extension
nx package huckleberry-extension
```

For detailed setup instructions, see [workspace setup documentation](./docs/workspace-setup.md).

### Project Structure

```
vscode-huckleberry/
├─ apps/
│  ├─ huckleberry-extension/  # VS Code extension (TypeScript)
│  └─ huckleberry-docs/       # Documentation site (Docusaurus)
├─ assets/
│  └─ images/                 # Project logos and assets
└─ docs/
   ├─ implementation-guide.md # Technical implementation details
   ├─ task-master.md          # Task Manager documentation
   ├─ tasks.md                # Project task tracking
   ├─ workspace-setup.md      # Setup instructions
   └─ debug-setup.md          # Debugging configuration
```

The project is organized as an Nx monorepo with the following components:

- **huckleberry-extension**: The core VS Code extension implementing the Task Manager chat participant and AI integration
- **huckleberry-docs**: Documentation site built with Docusaurus
- **assets**: Shared images and design resources used across the project
- **docs**: Project-level documentation and guides

## Roadmap

### Phase 1 (Current) - IN PROGRESS

- Core task management functionality
- File-based task persistence
- PRD parsing capabilities

### Phase 2 (Planned)

- Research-backed task expansion using web APIs
- Complexity analysis and estimation
- Integration with VS Code Tasks
- Custom tree view for task management

## Contributing

Contributions are welcome! This project is in early development, so please file issues for bugs or feature requests.

## License

MIT

---

<div align="center">
  <p>Built with <a href="https://nx.dev">Nx</a> • Powered by VS Code's Language Model API</p>
  <p>© 2025 Huckleberry Project Contributors</p>
</div>
