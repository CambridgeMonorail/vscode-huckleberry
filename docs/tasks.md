# Huckleberry Workspace Setup Tasks

This checklist tracks all tasks required to fully set up the VSCode-Huckleberry workspace, based on the [workspace-setup.md](./workspace-setup.md) guide.

## Prerequisites

- [x] Install Node.js v22.x (current LTS version)
- [x] Install pnpm v9.x or later (`npm install -g pnpm`)
- [x] Install VS Code 1.93 or later (required for Chat/Agent APIs)

## Step 1: Create the Nx Workspace

- [x] Install Nx globally (`pnpm add -g create-nx-workspace`)
- [x] Create the Nx workspace with pnpm support (`pnpm dlx create-nx-workspace vscode-huckleberry --preset=empty --package-manager=pnpm`)
- [x] Navigate to workspace directory (`cd vscode-huckleberry`)
- [x] Create a .nvmrc file to lock Node.js version (optional but recommended)

## Step 2: Set up the React SPA (demo-site)

- [x] Generate React application (`pnpm exec nx generate @nx/react:application demo-site`)
- [x] Test run the React application (`pnpm exec nx serve demo-site`)
- [x] Verify React app loads correctly in browser (localhost:4200)
- [x] Update demo-site's package.json with proper app name and version

## Step 3: Set up the VS Code Extension (huckleberry-extension)

- [x] Create extension directory structure:
  - [x] Create directory (`mkdir -p apps/huckleberry-extension`)
  - [x] Navigate to directory (`cd apps/huckleberry-extension`)
- [x] Initialize package.json (`pnpm init`)
- [x] Install VS Code extension dependencies (`pnpm add -D vscode @types/vscode`)
- [x] Create source directory structure:
  - [x] Create src directory (`mkdir src`)
  - [x] Create extension entry file (`touch src/extension.ts`)
  - [x] Create tools directory (`mkdir src/tools`)
- [x] Add basic extension code to extension.ts:

  ```typescript
  import * as vscode from 'vscode';
  
  export function activate(context: vscode.ExtensionContext) {
      console.log('Congratulations, your extension "huckleberry-extension" is now active!');
  
      let disposable = vscode.commands.registerCommand('huckleberry-extension.helloWorld', () => {
          vscode.window.showInformationMessage('Hello World from huckleberry-extension!');
      });
  
      context.subscriptions.push(disposable);
  }
  
  export function deactivate() {}
  ```

- [x] Create and configure tsconfig.json
- [x] Configure extension package.json with proper:
  - [x] Name, displayName, and description
  - [x] Version and VS Code engine compatibility (specify "engines": {"vscode": "^1.93.0", "node": "^22.0.0"})
  - [x] Activation events (e.g., "onStartupFinished" or "onChatParticipant:yourpublisher.taskmaster")
  - [x] Commands contribution
  - [x] Build/test/package scripts
  - [x] Required devDependencies
  - [x] Add @vscode/chat-extension-utils dependency
- [x] Install vsce globally (`pnpm add -g @vscode/vsce`)
- [x] Create and configure project.json for Nx integration
- [x] Create .vscodeignore file to exclude unnecessary files from the extension package

## Step 4: Build and Package the Extension

- [x] Build the VS Code extension (`pnpm exec nx build huckleberry-extension`)
- [x] Package the extension as VSIX (`pnpm exec nx package huckleberry-extension`)
- [x] Verify huckleberry.vsix file was created in the apps/huckleberry-extension directory
- [ ] Test installing the VSIX manually in VS Code to verify packaging

## Step 4a: Set Up Local Debugging for Extension Development

- [x] Create a .vscode folder in the extension directory (if not exists)
- [x] Create a launch.json file for debugging configuration
- [x] Add extension development configuration to launch.json
- [x] Add compound launch configuration for extension and web app
- [x] Test launching the extension in debug mode
- [x] Add tasks.json for automating build tasks during debug
- [x] Document the debug workflow for other developers (see `docs/debug-setup.md`)

## Step 5: Configure Workspace Settings

- [x] Add or update nx.json with proper task runner options and target defaults:
  - [x] Configure cacheableOperations
  - [x] Set up proper dependencies between targets
  - [x] Define outputs for build, test, lint, and package operations
- [x] Configure workspace-level TypeScript settings
- [x] Add .eslintrc.json for consistent code style

## Step 6: Setup Task Master Implementation

- [ ] Implement Chat Participant:
  - [ ] Add chatParticipants to package.json
  - [ ] Create chat participant handler in extension.ts
  - [ ] Define system prompt for the task master
  - [ ] Add proper error handling for Chat API
- [ ] Implement Language Model Tools:
  - [ ] Define tools in package.json (readFile, writeFile, markDone)
  - [ ] Implement tool classes (ReadFileTool.ts, WriteFileTool.ts, MarkDoneTool.ts)
  - [ ] Register tools in extension activation
  - [ ] Add proper error handling and user confirmation for tools
- [ ] Create persistent custom guidance file (.github/copilot-instructions.md)
- [ ] Define task data schema (fields for tasks.json and structure for task files)

## Step 7: Extension Settings and Configuration

- [ ] Add extension settings in package.json:
  - [ ] Task file location configuration
  - [ ] Task template options
  - [ ] Default task priorities
- [ ] Create settings interface in code
- [ ] Implement configuration loading in extension

## Step 8: Testing and Deployment Preparation

- [ ] Write tests for the VS Code extension
  - [ ] Unit tests for tools
  - [ ] Integration tests for chat participant
- [ ] Test extension locally with VS Code Extension Development Host
- [ ] Create sample tasks and PRD for demonstration
- [ ] Prepare deployment configuration for:
  - [ ] VS Code Extension (VS Code Marketplace)
  - [ ] React SPA (hosting platform)
- [ ] Create a release checklist

## Additional Tasks

- [ ] Add logo/icon files for the extension
  - [ ] Create a proper icon.png (at least 128x128px)
  - [ ] Add icon path to package.json
- [ ] Update README.md with proper usage instructions
- [ ] Document the task master commands and capabilities
- [ ] Create a CHANGELOG.md file
- [ ] Add license information
- [ ] Create extension gallery assets (banner, screenshots)
