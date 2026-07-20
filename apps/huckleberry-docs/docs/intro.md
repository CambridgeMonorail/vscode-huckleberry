---
sidebar_position: 1
slug: /
---

# Introduction

<div align="center">
  <img src="/img/huckleberry-logo-with-name.svg" alt="Huckleberry Logo" width="300" />
  
   <p><em>Evidence-driven workflow orchestration inside Visual Studio Code</em></p>
</div>

## Welcome to Huckleberry

Huckleberry is a VS Code extension for defining, running, and reviewing engineering workflows directly inside your workspace. It combines workflow discovery, runner orchestration, approval gates, and evidence inspection so deterministic checks and bounded agent repair steps stay visible and auditable.

:::caution Alpha Status
This project is in early development. Features are incomplete, APIs may change, and parts may be non-functional. Contributions and feedback welcome! Huckleberry is not yet available on the VS Code Marketplace.
:::

## Why Huckleberry?

Huckleberry keeps workflow execution inside the editor where the code, diagnostics, and review context already live. It is designed for loops such as lint, typecheck, test, repair, approval, and evidence review.

### Key Benefits

- **Stay in the flow** - Review and run workflows without leaving the editor
- **Deterministic orchestration** - Run explicit command steps with replayable lifecycle events
- **Bounded agent repair** - Use constrained agent steps without surrendering execution control
- **Evidence first** - Review logs, summaries, diffs, and deep links from the `Runs` and `Evidence` views
- **Local storage** - Loop definitions and run artifacts stay in your workspace under version control

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

This architecture lets Huckleberry provide a richer workflow workbench while keeping the extension in charge of execution state, evidence capture, and approval boundaries.

## Next Steps

- [Installation](./installation.md) - Get up and running with Huckleberry
- [Quick Start](./quick-start.md) - Run your first command-only loop
- [Workflow Authoring Guide](./workflow-authoring-guide.md) - Learn the schema and execution model
- [Evidence Model Guide](./evidence-model-guide.md) - Understand artifacts, summaries, and claims
- [Runner Troubleshooting](./runner-troubleshooting.md) - Diagnose validation, execution, and approval failures
