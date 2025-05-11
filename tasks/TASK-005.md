# TASK-005: Identify and extract pure logic functions for improved testability

## Details
- **Priority**: medium
- **Status**: Done
- **Created**: 5/10/2025
- **Est. Effort**: 3 hours
- **Completed**: 5/11/2025

## Description
Identify pure logic functions throughout the codebase and extract them into a dedicated `src/lib` folder. This improves testability by isolating business logic from VS Code API dependencies, making it easier to write unit tests and ensure code quality.

## Acceptance Criteria
- [x] Create a `src/lib` directory structure for pure logic functions
- [x] Identify pure functions in the codebase that don't depend on VS Code APIs
- [x] Extract these functions to appropriate files in the lib directory
- [x] Update original files to import and use the extracted functions
- [x] Add appropriate exports to maintain backward compatibility
- [x] Create unit tests for extracted functions
- [x] Ensure tests run successfully with no regressions

## Implementation Details
1. Created directory structure:
   ```
   apps/huckleberry-extension/src/lib/
     tasks/
       taskUtils.lib.ts  # For pure task manipulation functions
   ```

2. Functions extracted from `taskUtils.ts` into `taskUtils.lib.ts`:
   - `extractTaskNumber()`: Parse a task ID into a number
   - `findHighestTaskNumber()`: Find the highest task number in a collection
   - `generateTaskId()`: Create sequential task IDs
   - `createTaskObject()`: Create task objects with defaults
   - `getTaskById()`: Find tasks in a collection by ID
   - `priorityEmoji`: Constants for priority visualization

3. Updated original files to import from the lib modules:
   ```typescript
   import { 
     priorityEmoji, 
     extractTaskNumber, 
     findHighestTaskNumber, 
     generateTaskId, 
     createTaskObject, 
     getTaskById,
   } from '../../lib/tasks/taskUtils.lib';
   ```

4. Created comprehensive unit tests for the extracted functions in:
   `tests/unit/lib/tasks/taskUtils.lib.test.ts`

## Related Tasks
- TASK-001: Set up Vitest configuration for the Huckleberry extension
- TASK-002: Create VS Code API mock shim for testing
- TASK-003: Set up initial test folder structure
- TASK-006: Create a src/lib folder for pure, easily testable code
- TASK-009: Add tests for task manipulation functions

## References
- [Testing Strategy](c:\Projects\vscode-huckleberry\docs\testing-strategy.md) - Phase 2: Pure Utility Testing section
- [Improving Quality](c:\Projects\vscode-huckleberry\docs\improving-quality.md)

## Notes
- This implementation is part of Phase 2 of the testing strategy
- Focus was on task utilities first as they contain core business logic
- More functions can be extracted in future updates
- Created via Huckleberry Task Manager
