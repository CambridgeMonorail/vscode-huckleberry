---
sidebar_position: 10
---

# Development

This guide is for developers who want to contribute to Huckleberry or modify it for their own purposes.

## Repository Structure

Huckleberry is built as an Nx monorepo with the following main components:

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

## Prerequisites

To develop Huckleberry, you'll need:

- **Node.js**: Version 18 or later
- **pnpm**: For package management
- **Visual Studio Code**: For testing and debugging
- **Git**: For version control

## Getting Started

### Clone the Repository

```bash
# Clone the repository
git clone https://github.com/CambridgeMonorail/vscode-huckleberry.git
cd vscode-huckleberry
```

### Install Dependencies

```bash
# Install all dependencies
pnpm install
```

### Build the Extension

```bash
# Build the extension
pnpm exec nx build huckleberry-extension
```

### Run the Extension

During development, you can run the extension in a new VS Code window:

1. Open the repository in VS Code
2. Press F5 to start debugging
3. A new VS Code window will open with the extension loaded

Alternatively, you can watch for changes and automatically rebuild:

```bash
pnpm exec nx build huckleberry-extension --watch
```

### Package the Extension

To create a `.vsix` file that can be installed:

```bash
pnpm exec nx package huckleberry-extension
```

## Project Structure

### Extension Architecture

The VS Code extension follows a modular architecture:

- **src/extension.ts**: Main entry point
- **src/services/**: Core services that handle the business logic
- **src/handlers/**: Command and event handlers
- **src/tools/**: Agent mode features implementation (VS Code Language Model Tools API)
- **src/utils/**: Utility functions and helpers
- **src/config/**: Configuration and settings

### Key Extension Files

- **extension.ts**: Extension activation and command registration
- **languageModelToolsProvider.ts**: Registration of LM tools
- **taskHandlers.ts**: Implementation of task-related commands
- **toolManager.ts**: Service for managing tool operations

## Coding Standards

Huckleberry follows strict TypeScript coding standards:

- Use TypeScript strict mode for all code
- Follow the principle of explicit typing whenever possible
- Use interfaces for object shapes and types for unions and primitives
- Prefer functional programming patterns where appropriate
- Use async/await over Promise chains
- Document all public functions, classes, interfaces with JSDoc comments

Example:

```typescript
/**
 * Processes task data and returns a formatted result
 * @param taskData The raw task data to process
 * @returns The processed task format
 */
function processTask<T extends Task>(taskData: T): ProcessedTask {
  // Implementation
}
```

## Testing

### Running Tests

```bash
# Run all tests
pnpm exec nx test huckleberry-extension

# Run tests with coverage
pnpm exec nx test huckleberry-extension --coverage
```

### Test Structure

Tests are organized to mirror the source code structure:

- **src/__tests__/**: Main test directory
- Unit tests are placed next to the files they test

## Git Workflow

### Branches

- **main**: Production-ready code
- **develop**: Integration branch for new features
- **feature/xxx**: Feature branches

### Commit Messages

All commit messages follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Commit Types

- `feat`: A new feature (minor version bump)
- `fix`: A bug fix (patch version bump)
- `docs`: Documentation only changes
- `style`: Changes that do not affect the meaning of the code
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `perf`: A code change that improves performance
- `test`: Adding missing tests or correcting existing tests
- `build`: Changes that affect the build system or external dependencies
- `ci`: Changes to CI configuration files and scripts
- `chore`: Other changes that don't modify src or test files

## Documentation

### Building the Documentation Site

```bash
# Build the docs site
pnpm exec nx build huckleberry-docs

# Serve the docs site locally
pnpm exec nx serve huckleberry-docs
```

### Documentation Structure

- Use Markdown for all documentation
- Keep code examples up-to-date
- Document complex logic and algorithms
- Add comments for non-obvious code

## Contributing

We welcome contributions to Huckleberry! To contribute:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests to ensure they pass
5. Commit your changes following the commit message guidelines
6. Push to your branch
7. Open a Pull Request

## Extension Development Resources

- [VS Code Extension API](https://code.visualstudio.com/api)
- [VS Code Chat API](https://code.visualstudio.com/api/extension-guides/chat)
- [VS Code Language Model API](https://code.visualstudio.com/api/extension-guides/language-model)
- [Nx Documentation](https://nx.dev/)