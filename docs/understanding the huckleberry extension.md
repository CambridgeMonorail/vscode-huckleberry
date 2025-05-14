# Understanding the Huckleberry Extension

This document provides an overview of the Huckleberry extension's architecture and explains the purpose of each component. It serves as a guide for developers who want to understand the codebase and contribute to the project.

## Directory Structure Overview

The Huckleberry extension's source code is organized into the following main directories:

```txt
apps/huckleberry-extension/src/
├─ config/           # Configuration settings and constants
├─ handlers/         # Command and chat message handlers
│  ├─ commandHandlers/   # VS Code command implementations
│  └─ tasks/            # Task-specific handlers
├─ lib/              # Pure logic functions (no VS Code dependencies)
│  ├─ tasks/            # Task manipulation pure functions
│  └─ utils/            # General utility pure functions
├─ services/         # Core services used by the extension
├─ tools/            # Language Model Tools implementation
├─ utils/            # Utility functions with VS Code dependencies
├─ config.ts         # Configuration management
├─ extension.ts      # Extension activation and setup
└─ types.ts          # TypeScript type definitions
```

## Component Descriptions

### `extension.ts`

The main entry point for the extension. This file contains:

- Extension activation logic
- Registration of VS Code commands
- Setup of the chat participant
- Initialization of services and tools
- Subscription to events

### `config.ts` and `config/`

Handles configuration management for the extension, including:

- Default settings
- User preferences
- Workspace-specific configurations
- Configuration change events

### `types.ts`

Contains TypeScript type definitions and interfaces used throughout the extension, particularly:

- Task interfaces
- Command parameter types
- Service interfaces
- Configuration types

### `handlers/`

Processes commands and chat messages, routing them to the appropriate functionality:

#### `chatHandler.ts`

Manages interactions with VS Code's Chat API, parsing user requests and directing them to the appropriate handlers.

#### `commandHandlers/`

Contains implementations for all VS Code commands registered by the extension:

- Task creation and management commands
- Configuration commands
- Initialization commands

#### `tasks/`

Task-specific logic for processing user requests:

- `taskUtils.ts`: VS Code-dependent task utility functions
- `createTaskHandler.ts`: Handles task creation requests
- `todoScanHandler.ts`: Scans code for TODO comments
- Other specialized task handlers

### `lib/`

Contains pure logic functions that don't depend on VS Code APIs, making them easily testable:

#### `tasks/`

- `taskUtils.lib.ts`: Pure functions for task manipulation (ID generation, finding tasks, etc.)

#### `utils/`

Directory for general utility pure functions (planned for future expansion)

### `services/`

Core services that power the extension's functionality:

#### `chatService.ts`

Manages the chat participant implementation and interaction with VS Code's chat API.

#### `extensionStateService.ts`

Manages the extension's state, including:

- Current workspace information
- Task collection state
- Configuration state

#### `toolManager.ts`

Manages the registration and execution of Language Model Tools.

#### `languageModelToolsProvider.ts`

Implements the Language Model Tools API for Copilot integration.

### `tools/`

Implementation of Language Model Tools that can be called by the AI:

#### `BaseTool.ts`

Abstract base class defining the tool interface.

#### Specific tools

- `BreakTaskTool.ts`: Tool for breaking tasks into subtasks
- `MarkDoneTool.ts`: Tool for marking tasks as complete
- `ReadFileTool.ts`: Tool for reading files
- `WriteFileTool.ts`: Tool for writing files

### `utils/`

Utility functions that have VS Code dependencies:

#### `debugUtils.ts`

Handles logging and debugging functionality.

#### `parameterUtils.ts`

Functions for handling user input and parameters.

#### `copilotHelper.ts`

Utilities for interacting with GitHub Copilot.

#### `uiHelpers.ts`

Helper functions for UI interactions.

## Test Structure

```
apps/huckleberry-extension/tests/
├─ unit/                  # Unit tests with Vitest
│  ├─ lib/                # Tests for pure functions
│  │  └─ tasks/           # Tests for task-related pure functions
│  └─ utils/              # Tests for utility functions
├─ integration-edh/       # Extension Development Host tests
├─ stubs/                 # Mock implementations
└─ __mocks__/             # Module mocks (including VS Code API)
```

## Architectural Patterns

### Dependency Injection

The extension uses a simple form of dependency injection where services are initialized during activation and passed to handlers.

### Command Pattern

Commands are implemented as separate handler functions, each responsible for a specific action.

### Factory Pattern

Tools are registered with a central tool manager that acts as a factory, providing instances based on their names.

### Pure Functions

Business logic is separated from VS Code dependencies where possible using pure functions in the `lib/` directory.

## Data Flow

1. User interacts with VS Code (command or chat)
2. The request is routed to the appropriate handler
3. Handler uses services and pure functions to process the request
4. Results are displayed or stored as appropriate

## Task Management

Tasks are stored in:

- `tasks.json`: A JSON database of task objects with IDs, titles, descriptions, and status
- Task files: Individual Markdown files with detailed descriptions and notes

All task data is persisted in the workspace for transparency and portability.

## Testing Strategy

The extension follows a multi-layered testing approach:

1. **Unit Testing**: For pure functions in the `lib/` directory using Vitest
2. **Integration Testing**: For VS Code API interactions using the Extension Development Host
3. **Manual Testing**: For complex UI interactions and full user flows

## Contributing

When contributing to the codebase:

1. Place pure logic in the `lib/` directory with the `.lib.ts` suffix
2. Keep VS Code dependencies in the appropriate handler or service
3. Write tests for all new functionality
4. Follow the established naming conventions and patterns

## Further Resources

- [Testing Strategy](../testing-strategy.md)
- [Improving Quality](../improving-quality.md)
- [VS Code Extension API](https://code.visualstudio.com/api)
- [GitHub Copilot](https://github.com/features/copilot)
