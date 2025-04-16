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

- [ ] Create extension directory structure:
  - [ ] Create directory (`mkdir -p apps/huckleberry-extension`)
  - [ ] Navigate to directory (`cd apps/huckleberry-extension`)
- [ ] Initialize package.json (`pnpm init`)
- [ ] Install VS Code extension dependencies (`pnpm add -D vscode @types/vscode`)
- [ ] Create source directory structure:
  - [ ] Create src directory (`mkdir src`)
  - [ ] Create extension entry file (`touch src/extension.ts`)
  - [ ] Create tools directory (`mkdir src/tools`)
- [ ] Add basic extension code to extension.ts:

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

- [ ] Create and configure tsconfig.json
- [ ] Configure extension package.json with proper:
  - [ ] Name, displayName, and description
  - [ ] Version and VS Code engine compatibility (specify "engines": {"vscode": "^1.93.0", "node": "^22.0.0"})
  - [ ] Activation events (e.g., "onStartupFinished" or "onChatParticipant:yourpublisher.taskmaster")
  - [ ] Commands contribution
  - [ ] Build/test/package scripts
  - [ ] Required devDependencies
  - [ ] Add @vscode/chat-extension-utils dependency
- [ ] Install vsce globally (`pnpm add -g @vscode/vsce`)
- [ ] Create and configure project.json for Nx integration
- [ ] Create .vscodeignore file to exclude unnecessary files from the extension package

## Step 4: Build and Package the Extension

- [ ] Build the VS Code extension (`pnpm exec nx build huckleberry-extension`)
- [ ] Package the extension as VSIX (`pnpm exec nx package huckleberry-extension`)
- [ ] Verify huckleberry.vsix file was created in the apps/huckleberry-extension directory
- [ ] Test installing the VSIX manually in VS Code to verify packaging

## Step 5: Configure Workspace Settings

- [ ] Add or update nx.json with proper task runner options and target defaults:
  - [ ] Configure cacheableOperations
  - [ ] Set up proper dependencies between targets
  - [ ] Define outputs for build, test, lint, and package operations
- [ ] Configure workspace-level TypeScript settings
- [ ] Add .eslintrc.json for consistent code style

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
