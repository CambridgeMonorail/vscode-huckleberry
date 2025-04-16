# VS Code Extension Debugging Guide

This document explains how to debug the Huckleberry VS Code extension and React application in the Nx monorepo workspace.

## Prerequisites

- Ensure you have installed all required dependencies with `pnpm install`
- Make sure you've completed the basic workspace setup outlined in `workspace-setup.md`

## Available Debug Configurations

The workspace includes several debug configurations in the `.vscode/launch.json` file:

1. **Debug Extension**: Launches a new VS Code Extension Development Host with the Huckleberry extension loaded
2. **Debug React App**: Opens Chrome with the demo site React application
3. **Debug Extension & React App**: A compound configuration that launches both the extension and React app simultaneously

## Debug Tasks

The following tasks are available in `.vscode/tasks.json`:

- **build-extension**: Builds the huckleberry-extension using Nx build system
- **watch-extension**: Continuously watches for changes in the extension code and rebuilds when changes are detected
- **serve-react-app**: Starts the demo-site React development server

## Debugging the VS Code Extension

To debug the VS Code extension:

1. Press **F5** or select **Debug Extension** from the Run and Debug panel
2. A new VS Code window will open with the extension loaded
3. You can set breakpoints in the extension code
4. The extension activation will trigger when VS Code starts
5. Test the "Hello World" command by opening the Command Palette (`Ctrl+Shift+P`) and typing "Hello World from Huckleberry"

### Hot Reload Workflow

For a better development experience with hot reloading:

1. Run the **watch-extension** task by:
   - Opening the Command Palette (`Ctrl+Shift+P`)
   - Selecting "Tasks: Run Task"
   - Choosing "watch-extension"
2. Start debugging with the **Debug Extension** configuration
3. Make changes to the extension code
4. Press **Ctrl+R** in the Extension Development Host to reload the extension

## Debugging the React Application

To debug the React demo site:

1. Select **Debug React App** from the Run and Debug panel
2. Chrome will launch with the React app loaded and DevTools open
3. You can set breakpoints in your React component code
4. Changes to React code will be hot-reloaded thanks to Vite's development server

## Debugging Both Together

When you need to debug interactions between the extension and React application:

1. Select **Debug Extension & React App** from the Run and Debug panel
2. Both the Extension Development Host and Chrome will launch
3. You can set breakpoints in both the extension code and React application code

## Troubleshooting

### Extension Not Loading
- Ensure the build task completed successfully
- Check the Developer Tools console in the Extension Development Host for errors
- Verify the activationEvents in the extension's package.json

### React App Not Starting
- Check if port 4200 is already in use
- Verify that the Vite development server is running
- Look for errors in the terminal running the serve-react-app task

### Breakpoints Not Hitting
- For the extension, make sure source maps are enabled in tsconfig.json
- For the React app, verify that the webRoot path in launch.json is correct
- Try using the "debugger;" statement directly in your code

## Adding New Debug Configurations

If you need to add additional debug configurations:

1. Open `.vscode/launch.json`
2. Add your new configuration to the "configurations" array
3. If needed, add supporting tasks to `.vscode/tasks.json`