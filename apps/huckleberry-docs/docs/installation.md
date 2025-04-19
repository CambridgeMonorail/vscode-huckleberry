---
sidebar_position: 2
---

# Installation

This guide will walk you through the process of installing the Huckleberry Task Manager extension in Visual Studio Code.

## Prerequisites

Before you install Huckleberry, make sure you have:

- **Visual Studio Code**: Version 1.93 or later
- **GitHub Copilot**: An active GitHub Copilot subscription
- **A workspace**: Huckleberry works best when you have a workspace folder opened

## Installation Methods

:::note
Huckleberry is not yet available on the VS Code Marketplace. This documentation describes how installation will work once it's released.
:::

### Pre-release Installation

**Pre-release Installation**: Until the official marketplace release, you can download the latest installable VSIX file from our [GitHub Releases page](https://github.com/CambridgeMonorail/vscode-huckleberry/releases). Install it in VS Code by:

1. Opening VS Code
2. Going to the Extensions view (Ctrl+Shift+X / Cmd+Shift+X)
3. Clicking on the "..." at the top of the Extensions view
4. Selecting "Install from VSIX..." and choosing the downloaded file

### From VS Code Marketplace (coming soon)

Once released, you can install Huckleberry directly from the VS Code Marketplace:

1. Open VS Code
2. Click the Extensions icon in the Activity Bar (or press `Ctrl+Shift+X` / `Cmd+Shift+X`)
3. Search for "Huckleberry Task Manager"
4. Click "Install"

Alternatively, you can run the following command in the VS Code command palette (`Ctrl+P` / `Cmd+P`):

```
ext install huckleberry.taskmanager
```

### Manual Installation (VSIX)

If you have a `.vsix` file (perhaps as a pre-release version or a development build):

1. Open VS Code
2. Open the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`)
3. Type "Extensions: Install from VSIX" and select it
4. Navigate to your `.vsix` file and select it
5. Restart VS Code when prompted

## Verifying Installation

To verify that Huckleberry is installed correctly:

1. Open the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`)
2. Type "Huckleberry" - you should see commands like "Huckleberry: Manage Tasks"
3. Open VS Code's chat panel (click on the chat icon in the Activity Bar) and look for Huckleberry in the list of chat participants

## Known Installation Issues

### VS Code Version Compatibility

If you're using VS Code version earlier than 1.93, you'll need to update your VS Code installation first. Huckleberry relies on the Language Model API which was introduced in VS Code 1.93.

### Chat Integration Post-Installation

**VS Code Limitation:** If you open a folder after starting VS Code (i.e., you start with no folder/workspace and then open one), you must reload the window (`Developer: Reload Window` or use the reload prompt) for Huckleberry chat features to work. This is due to a limitation in the VS Code extension host: chat participants are only registered at activation time.

## Next Steps

Once you've successfully installed Huckleberry:

- Continue to the [Quick Start](./quick-start.md) guide to set up your first project
- Learn about [Huckleberry's features](./features.md)
- See [usage examples](./usage.md) to get the most out of the extension