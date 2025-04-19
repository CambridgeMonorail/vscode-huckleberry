---
sidebar_position: 1
slug: /
---

# Introduction

<div align="center">
  <img src="/img/huckleberry-logo-with-name.svg" alt="Huckleberry Logo" width="300" />
  
  <p><em>AI-powered task management inside Visual Studio Code</em></p>
</div>

## Welcome to Huckleberry

Huckleberry is a VS Code extension that brings AI-powered task management directly into your coding workflow. Using the VS Code Chat interface, you can have natural conversations with a dedicated Task Manager agent that helps you track, manage, and organize project tasks.

:::caution Alpha Status
This project is in early development. Features are incomplete, APIs may change, and parts may be non-functional. Contributions and feedback welcome! Huckleberry is not yet available on the VS Code Marketplace.
:::

## Why Huckleberry?

Huckleberry integrates seamlessly with your development workflow by leveraging VS Code's Language Model API and Copilot Chat integration. This creates a conversational interface for automated task management without ever leaving your development environment.

### Key Benefits

- **Stay in the flow** - Manage tasks without switching contexts
- **Natural language interface** - No complex syntax or commands to remember
- **AI-powered assistance** - Get smart suggestions and automated organization
- **Local storage** - All task data stays in your workspace under version control

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

## Next Steps

- [Installation](./installation.md) - Get up and running with Huckleberry
- [Quick Start](./quick-start.md) - Learn the basics in 5 minutes
- [Features](./features.md) - Explore what Huckleberry can do
- [Usage](./usage.md) - See detailed usage examples
