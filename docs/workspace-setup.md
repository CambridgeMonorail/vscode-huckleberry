# Step-by-Step Guide: Setting up VSCode-Huckleberry Nx Workspace

This guide will walk you through setting up an Nx monorepo for your VS Code extension ("huckleberry-extension") and a React single-page application ("demo-site") using pnpm.

## Prerequisites

- **Node.js**: Ensure you have Node.js (version 14.0.0 or later) installed.
- **pnpm**: You'll need pnpm as your package manager. Install it via `npm install -g pnpm` if you don't have it already.

## Step 1: Create the Nx Workspace

Install Nx globally (if not already installed):

```bash
pnpm add -g create-nx-workspace
```

Create the Nx workspace:

```bash
pnpm dlx create-nx-workspace vscode-huckleberry --preset=empty --package-manager=pnpm
```

- **vscode-huckleberry**: This is the name of your workspace. You can change it if you like.
- **--preset=empty**: We start with an empty workspace to have full control over the setup.
- **--package-manager=pnpm**: Specifies pnpm as the package manager for the workspace.

Navigate to the workspace directory:

```bash
cd vscode-huckleberry
```

## Step 2: Set up the React SPA (demo-site)

Generate the React application:

```bash
pnpm exec nx generate @nx/react:application demo-site
```

- **demo-site**: The name of your React application.

Run the React application:

```bash
pnpm exec nx serve demo-site
```

This will start the development server. Open your browser to view the default React app (usually at <http://localhost:4200>).

## Step 3: Set up the VS Code Extension (huckleberry-extension)

Create the extension directory:

```bash
mkdir -p apps/huckleberry-extension
cd apps/huckleberry-extension
```

Initialize a package.json file:

```bash
pnpm init
```

Install VS Code extension dependencies:

```bash
pnpm add -D vscode @types/vscode
```

Create a src directory and your main extension file (e.g., extension.ts):

```bash
mkdir src
touch src/extension.ts
```

- **src/extension.ts**: This is the entry point for your VS Code extension.

Add the basic extension code to src/extension.ts:

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

Create a tsconfig.json file:

```bash
touch tsconfig.json
```

Configure tsconfig.json:

```json
{
    "compilerOptions": {
        "module": "commonjs",
        "target": "es2020",
        "outDir": "out",
        "lib": ["es2020", "dom"],
        "sourceMap": true,
        "strict": true,
        "esModuleInterop": true,
        "resolveJsonModule": true,
        "moduleResolution": "node",
        "rootDir": "."
    },
    "include": ["src/**/*.ts"],
    "exclude": ["node_modules", ".vscode-test"]
}
```

Configure package.json for VS Code:

```json
{
    "name": "huckleberry-extension",
    "displayName": "Huckleberry Extension",
    "description": "My VS Code Extension",
    "version": "0.0.1",
    "engines": {
        "vscode": "^1.85.0"  // Or the minimum VS Code version you support
    },
    "activationEvents": [
        "onCommand:huckleberry-extension.helloWorld"
    ],
    "main": "./out/extension.js",
    "contributes": {
        "commands": [
            {
                "command": "huckleberry-extension.helloWorld",
                "title": "Hello World from Huckleberry"
            }
        ]
    },
    "scripts": {
        "vscode:prepublish": "pnpm run compile",
        "compile": "tsc -p tsconfig.json",
        "watch": "tsc -watch -p tsconfig.json",
        "pretest": "pnpm run compile && pnpm run lint",
        "test": "node ./out/test/runTest.js",
        "lint": "eslint src --ext ts",
        "package": "vsce package --out huckleberry.vsix" // Add this line
    },
    "devDependencies": {
        "@types/mocha": "^10.0.6",
        "@types/node": "*",
        "@types/vscode": "^1.85.0",
        "@typescript-eslint/eslint-plugin": "^7.0.1",
        "@typescript-eslint/parser": "^7.0.1",
        "eslint": "^8.56.0",
        "eslint-config-prettier": "^9.1.0",
        "eslint-plugin-prettier": "^5.1.3",
        "mocha": "^10.2.0",
        "prettier": "^3.2.5",
        "typescript": "^5.3.3",
        "vscode": "^1.85.0",
        "vscode-test": "^1.5.2"
    }
}
```

- **main**: Specifies the entry point of your extension.
- **engines.vscode**: The minimum VS Code version your extension requires.
- **activationEvents**: Events that trigger the activation of your extension.
- **contributes.commands**: Registers commands that your extension provides.
- **scripts**: Define build, test, and package scripts. Note that npm/yarn commands are replaced with pnpm.

Install vsce globally:

```bash
pnpm add -g @vscode/vsce
```

Set up the Nx project.json:

Create a new file at apps/huckleberry-extension/project.json

Add the following:

```json
{
  "name": "huckleberry-extension",
  "$schema": "../../node_modules/nx/schemas/project-schema.json",
  "projectType": "application",
  "root": "apps/huckleberry-extension",
  "sourceRoot": "apps/huckleberry-extension/src",
  "targets": {
    "build": {
      "executor": "nx:run-commands",
      "outputs": ["{projectRoot}/out"],
      "options": {
        "commands": ["pnpm run compile"],
        "cwd": "{projectRoot}"
      }
    },
    "lint": {
      "executor": "@nx/eslint:lint",
      "options": {
        "lintFilePatterns": ["{projectRoot}/src/**/*.ts"]
      }
    },
    "test": {
      "executor": "nx:run-commands",
      "options": {
        "commands": ["pnpm run test"],
        "cwd": "{projectRoot}"
      }
    },
    "package": { // Define a new target for packaging
        "executor": "nx:run-commands",
        "outputs": ["{projectRoot}/huckleberry.vsix"],
        "options": {
          "commands": ["pnpm run package"],  // Use the pnpm script defined in package.json
          "cwd": "{projectRoot}"
        },
        "dependsOn": ["build"] // Ensure the extension is built before packaging
    },
    "serve": { // Add a serve target if you want to run the extension
      "executor": "nx:run-commands",
      "options": {
        "commands": [
          "code --extensionPath={projectRoot}" // This will open VS Code with your extension loaded
        ],
        "cwd": "{projectRoot}"
      }
    }
  }
}
```

Build the VS Code extension:

```bash
pnpm exec nx build huckleberry-extension
```

Package the VS Code extension:

```bash
pnpm exec nx package huckleberry-extension
```

This will create a huckleberry.vsix file in the apps/huckleberry-extension directory.

## Step 4: Connect the Pieces

You now have a basic VS Code extension in apps/huckleberry-extension and a React SPA in apps/demo-site. You can:

- Develop the React SPA to provide documentation, a showcase, or any web-based companion functionality for your extension.
- Use the VS Code extension API to interact with VS Code and provide features to the user.

## Step 5: Set up workspace tasks

In the root nx.json add the following:

```json
{
  "tasksRunnerOptions": {
    "default": {
      "runner": "nx/tasks-runners/default",
      "options": {
        "cacheableOperations": ["build", "test", "lint", "package"],
        "dependsOn": ["^build"]
      }
    }
  },
  "targetDefaults": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["{projectRoot}/dist"]
    },
    "test": {
      "inputs": ["default", "^test", "{projectRoot}/test/**/*", "{projectRoot}/src/**/*"]
    },
    "lint": {
      "inputs": ["default", "{workspaceRoot}/.eslintrc.json", "{projectRoot}/**/*.{ts,js,tsx,jsx}"]
    },
    "package": {
      "dependsOn": ["build"],
      "outputs": ["{projectRoot}/*.vsix"]
    }
  }
}
```

## Step 6: Important Considerations

- **VS Code API**: Familiarize yourself with the VS Code API to implement the functionality you want in your extension (<https://code.visualstudio.com/api/>).
- **React Development**: Develop your demo-site as you would any other React application.
- **Extension Testing**: Write thorough tests for your VS Code extension to ensure its reliability.
- **Deployment**:
  - **VS Code Extension**: You'll package your extension using vsce and publish it to the VS Code Marketplace.
  - **React SPA**: You can deploy your demo-site to any hosting service that supports React (e.g., Netlify, Vercel, GitHub Pages).

## Benefits of Using pnpm

- **Disk space efficiency**: pnpm uses a content-addressable store to avoid duplicate packages.
- **Strict dependency resolution**: Prevents accessing packages that aren't explicitly declared as dependencies.
- **Faster installation**: pnpm is typically faster than npm and yarn for large monorepos.
- **Built-in support for monorepos**: Works well with the Nx workspace structure.

This setup provides a solid foundation for building your VS Code extension and its accompanying website within a single, organized repository.
