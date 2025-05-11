# Pure Logic Functions Library

This directory contains pure logic functions that don't depend on VS Code APIs or other external systems. The goal is to separate pure business logic from framework-specific code to improve testability, maintainability, and reusability.

## Directory Structure

- `tasks/`: Task-related pure functions for task creation, manipulation, and queries
- `utils/`: General utility pure functions

## Guidelines

### What belongs in this directory?

- Pure functions with no side effects
- Functions that don't depend on VS Code APIs
- Functions that don't depend on file system, network, or other external resources
- Business logic that can be tested in isolation

### What doesn't belong here?

- Functions that use VS Code APIs
- Functions with side effects (logging, file system, etc.)
- UI components or VS Code-specific extension logic

### Naming Conventions

- Files should be named with a `.lib.ts` suffix to indicate they contain pure logic
- Example: `taskUtils.lib.ts`

### Testing

All functions in this directory should have corresponding unit tests in:

```
tests/unit/lib/[subdir]/[filename].test.ts
```

For example, the tests for `src/lib/tasks/taskUtils.lib.ts` should be in `tests/unit/lib/tasks/taskUtils.lib.test.ts`.

## Usage Example

```typescript
// Import pure functions
import { generateTaskId } from '../../lib/tasks/taskUtils.lib';

// Use them in your VS Code-dependent code
function createNewTask() {
  const taskId = generateTaskId(taskCollection);
  // ...
}
```
