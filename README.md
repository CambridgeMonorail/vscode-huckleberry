# Huckleberry - VS Code Task Master Extension

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

> **⚠️ ALPHA STATUS**: This project is in early development. Features are incomplete, APIs may change, and parts may be non-functional. Contributions and feedback welcome!

## Overview

Huckleberry is a VS Code extension that brings AI-powered task management directly into your coding workflow. Using the VS Code Chat interface, you can have natural conversations with a dedicated Task Master agent that helps you track, manage, and organize project tasks.

Powered by the VS Code Language Model API and Copilot Chat integration, Huckleberry creates a conversational interface for automated task management without leaving your development environment.

## Features

- 🗣️ Natural language task creation and management through chat
- 📋 Parse PRD documents to automatically generate structured tasks
- ✅ Mark tasks complete, update priorities, and manage dependencies
- 🔄 Break down tasks into subtasks for complex projects
- 📊 Get suggestions for the next tasks to tackle
- 💾 Persistent task state stored in your project files

## Installation

> **Note**: Huckleberry is not yet available on the VS Code Marketplace.

Once released, installation will be as simple as:

```
ext install huckleberry.taskmaster
```

### Prerequisites

- VS Code version 1.93 or later
- GitHub Copilot subscription

## Usage

After installation:

1. Open the Copilot Chat panel in VS Code
2. Start a conversation with the Task Master by typing `@taskmaster`
3. Try commands like:
   - `@taskmaster Initialize task management for this project`
   - `@taskmaster Parse PRD.md and generate tasks`
   - `@taskmaster What's my next task?`
   - `@taskmaster Mark TASK-001 as complete`

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
│  ├─ huckleberry-extension/  # VS Code extension
│  └─ demo-site/              # React demo site
├─ docs/
│  ├─ implementation-guide.md # Technical implementation guide
│  └─ workspace-setup.md      # Workspace setup instructions
└─ assets/
   └─ images/                 # Project logos and images
```

## Roadmap

### Phase 1 (Current)
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
