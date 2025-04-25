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
    <a href="https://cambridgemonorail.github.io/vscode-huckleberry/">Documentation</a> •
    <a href="#license">License</a>
  </p>
  
  <p>
    <strong>📝 Follow our <a href="https://cambridgemonorail.github.io/vscode-huckleberry/blog">development blog</a> for the latest project updates and insights!</strong>
  </p>
</div>

> **⚠️ ALPHA STATUS**: This project is in early development. Features are incomplete, APIs may change, and parts may be non-functional. Contributions and feedback welcome! Huckleberry is not yet available on the VS Code Marketplace.

[![Release](https://github.com/CambridgeMonorail/vscode-huckleberry/actions/workflows/release.yml/badge.svg)](https://github.com/CambridgeMonorail/vscode-huckleberry/actions/workflows/release.yml)
[![Deploy Docusaurus to Pages](https://github.com/CambridgeMonorail/vscode-huckleberry/actions/workflows/static.yml/badge.svg)](https://github.com/CambridgeMonorail/vscode-huckleberry/actions/workflows/static.yml)
<!-- ALL-CONTRIBUTORS-BADGE:START - Do not remove or modify this section -->
[![All Contributors](https://img.shields.io/badge/all_contributors-1-orange.svg?style=flat-square)](#contributors-)
<!-- ALL-CONTRIBUTORS-BADGE:END -->

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

**Pre-release Installation**: Until the official marketplace release, you can download the latest installable VSIX file from our [GitHub Releases page](https://github.com/CambridgeMonorail/vscode-huckleberry/releases). Install it in VS Code by:

1. Opening VS Code
2. Going to the Extensions view (Ctrl+Shift+X / Cmd+Shift+X)
3. Clicking on the "..." at the top of the Extensions view
4. Selecting "Install from VSIX..." and choosing the downloaded file

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

For comprehensive documentation and detailed usage examples, visit our [official documentation site](https://cambridgemonorail.github.io/vscode-huckleberry/).

### Agent Mode Language Model Tools

Huckleberry integrates with the VS Code Language Model Tools API (also known as "Copilot agent mode"), allowing the AI to directly interact with task management features without requiring explicit `@Huckleberry` mentions. The following tools are available to Copilot when in agent mode:

| Tool | Description |
|------|-------------|
| `create_task` | Creates a new task with optional priority |
| `initialize_tracking` | Sets up task tracking for a project workspace |
| `scan_todos` | Scans the codebase for TODO comments and converts them to tasks |
| `list_tasks` | Lists tasks with optional filtering by priority or status |
| `mark_task_done` | Marks a task as complete by providing the task ID |
| `update_task_priority` | Changes the priority of a task by providing the task ID and new priority |

> **💡 Pro tip:** For the best experience with Huckleberry's language model tools, we currently recommend using Claude models in Copilot agent mode. Enable agent mode by opening VS Code settings and setting `github.copilot.chat.localeOverride` to `"en-US"`, then selecting Claude as your model from the Copilot chat dropdown.

This integration provides a seamless experience as the language model can directly perform task operations when appropriate during conversations, without requiring you to explicitly mention Huckleberry.

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
git clone https://github.com/CambridgeMonorail/vscode-huckleberry.git
cd vscode-huckleberry

# Install dependencies
pnpm install

# Build the extension
pnpm exec nx build huckleberry-extension

# Run extension in development mode
pnpm exec nx watch huckleberry-extension

# Package the extension
pnpm exec nx package huckleberry-extension
```

For detailed setup instructions, see [workspace setup documentation](./docs/workspace-setup.md).

### Project Structure

```
vscode-huckleberry/
├─ apps/
│  ├─ huckleberry-extension/  # VS Code extension (TypeScript)
│  ├─ huckleberry-docs/       # Documentation site (Docusaurus)
│  └─ demo-site/              # React SPA for demonstration purposes
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
- **demo-site**: React SPA for demonstration and testing purposes
- **assets**: Shared images and design resources used across the project
- **docs**: Project-level documentation and guides

### Extension Development

#### Development Workflow

1. **Setup**: Use the instructions above to set up your development environment
2. **Development**:
   - Extension: Use `pnpm exec nx build huckleberry-extension --watch` for continuous builds during development
   - Demo site: Use `pnpm exec nx serve demo-site` to start the development server
3. **Testing**: Run `pnpm exec nx test huckleberry-extension` to execute tests
4. **Building**: Run `pnpm exec nx build huckleberry-extension` to build the extension
5. **Debugging**:
   - From VS Code: Use the "Run Extension" launch configuration
   - For detailed debug setup, see [debug setup documentation](./docs/debug-setup.md)

#### VS Code Extension Architecture

The extension is built around these core components:

1. **Chat Participant**: Registers as a named participant in VS Code's chat interface
2. **Command Handlers**: Process chat and palette commands for task management
3. **Task Service**: Core functionality for creating, updating, and managing tasks
4. **Storage Service**: Handles persistence of tasks to the file system
5. **Language Model Tools**: Integrates with VS Code's language model API

#### VS Code Extension Requirements

- VS Code version 1.93 or later (for Language Model API support)
- Node.js 18+ for development
- TypeScript 5.0+

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

## Contributors

Huckleberry ain't no one-horse outfit, partner. Whether you're a silver-tongued wordsmith spinnin' documentation that'd make a dictionary blush, a lawman of automated tests keepin' our code on the straight and narrow, the sheriff of CI workflows enforcin' order in these digital parts, a six-shooter coder with the fastest pull request in the West, or a greenhorn lookin' to earn your spurs in frontier UX design, there's a place for you 'round this campfire. In this posse, every rider's contribution counts, be it big as a mountain or small as a prairie dog. So saddle up and ride with us! Your name could be on this wall of fame faster than Doc Holliday can count cards.


<div align="center">
  <img src="./assets/huckleberry-has-a-posse.png" alt="Huckleberry Team" width="600" />
</div>

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tbody>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/CastleW"><img src="https://avatars.githubusercontent.com/u/22619438?v=4?s=100" width="100px;" alt="CastleW"/><br /><sub><b>CastleW</b></sub></a><br /><a href="https://github.com/CambridgeMonorail/vscode-huckleberry/issues?q=author%3ACastleW" title="Bug reports">🐛</a></td>
    </tr>
  </tbody>
  <tfoot>
    <tr>
      <td align="center" size="13px" colspan="7">
        <img src="https://raw.githubusercontent.com/all-contributors/all-contributors-cli/1b8533af435da9854653492b1327a23a4dbd0a10/assets/logo-small.svg">
          <a href="https://all-contributors.js.org/docs/en/bot/usage">Add your contributions</a>
        </img>
      </td>
    </tr>
  </tfoot>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->
---

<div align="center">
  <p>Built with <a href="https://nx.dev">Nx</a> • Powered by VS Code's Language Model API</p>
  <p>© 2025 CambridgeMonorail - Huckleberry Project</p>
</div>
