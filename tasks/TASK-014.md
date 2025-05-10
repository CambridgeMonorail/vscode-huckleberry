# TASK-014: Implement comprehensive testing for taskUtils.ts

## Details
- **Priority**: high
- **Status**: To Do
- **Created**: 5/10/2025
- **Est. Effort**: 6 hours

## Description
Implement a comprehensive suite of unit tests for the taskUtils.ts module, which contains core functionality for the task management system including reading/writing task data, generating task IDs, and manipulating task objects.

## Acceptance Criteria
- [ ] Create a test file `tests/unit/handlers/tasks/taskUtils.test.ts`
- [ ] Implement test coverage for all exported functions in taskUtils.ts:
  - [ ] `getWorkspacePaths()`
  - [ ] `readTasksJson()`
  - [ ] `writeTasksJson()`
  - [ ] `generateTaskId()`
  - [ ] `createTaskObject()`
  - [ ] `getTaskById()`
  - [ ] `priorityEmoji` mapping
  - [ ] `recommendAgentModeInChat()`
- [ ] Mock VS Code API dependencies (workspace, fs)
- [ ] Mock the ToolManager service and its tools
- [ ] Handle and test error cases for file operations
- [ ] Achieve >85% code coverage for taskUtils.ts
- [ ] All tests should pass successfully when run with `vitest run`

## Implementation Details
1. Create the test directory structure:
   ```powershell
   mkdir -p c:\Projects\vscode-huckleberry\apps\huckleberry-extension\tests\unit\handlers\tasks
   ```

2. Create mocks for the dependencies:
   ```typescript
   // tests/unit/handlers/tasks/__mocks__/toolManager.mock.ts
   import { vi } from 'vitest';
   
   export const mockReadFile = vi.fn();
   export const mockWriteFile = vi.fn();
   
   export const mockToolManager = {
     getTool: vi.fn().mockImplementation((toolName: string) => {
       if (toolName === 'readFile') {
         return { execute: mockReadFile };
       }
       if (toolName === 'writeFile') {
         return { execute: mockWriteFile };
       }
       return undefined;
     })
   };
   ```

3. Create the main test file:
   ```typescript
   // tests/unit/handlers/tasks/taskUtils.test.ts
   import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
   import * as path from 'path';
   import { 
     priorityEmoji, 
     getWorkspacePaths,
     readTasksJson,
     writeTasksJson,
     generateTaskId,
     createTaskObject,
     getTaskById,
     recommendAgentModeInChat
   } from '../../../../src/handlers/tasks/taskUtils';
   import { TaskPriority, TaskStatus } from '../../../../src/types';
   import * as vscode from 'vscode';
   import { mockToolManager, mockReadFile, mockWriteFile } from './__mocks__/toolManager.mock';
   
   // Mock implementation for the configuration
   vi.mock('../../../../src/config/index', () => ({
     getConfiguration: vi.fn().mockReturnValue({
       defaultTasksLocation: '.tasks'
     })
   }));
   
   // Here you'll implement tests for each function...
   ```

4. Test the priorityEmoji object:
   ```typescript
   describe('priorityEmoji', () => {
     it('should map priority levels to the correct emoji', () => {
       expect(priorityEmoji.high).toBe('🔴');
       expect(priorityEmoji.medium).toBe('🟠');
       expect(priorityEmoji.low).toBe('🟢');
       expect(priorityEmoji.critical).toBe('⚠️');
     });
   });
   ```

5. Test the getWorkspacePaths function:
   ```typescript
   describe('getWorkspacePaths', () => {
     beforeEach(() => {
       // Set up the mock workspace folders
       (vscode.workspace as any).workspaceFolders = [
         { uri: { fsPath: '/test/workspace' } }
       ];
     });
     
     afterEach(() => {
       vi.resetAllMocks();
     });
     
     it('should return the correct workspace paths', async () => {
       const result = await getWorkspacePaths();
       
       expect(result.workspaceFolder).toBe('/test/workspace');
       expect(result.tasksDir).toBe(path.join('/test/workspace', '.tasks'));
       expect(result.tasksJsonPath).toBe(path.join('/test/workspace', '.tasks', 'tasks.json'));
     });
     
     it('should throw an error when no workspace folder is open', async () => {
       // Remove the workspace folders
       (vscode.workspace as any).workspaceFolders = undefined;
       
       await expect(getWorkspacePaths()).rejects.toThrowError('No workspace folder is open');
     });
   });
   ```

## Related Tasks
- TASK-001: Set up Vitest configuration for the Huckleberry extension
- TASK-002: Create VS Code API mock shim for testing
- TASK-003: Set up initial test folder structure
- TASK-016: Create unit tests for task parsing functions in taskUtils.ts
- TASK-017: Create unit tests for task prioritization functions in taskUtils.ts

## References
- [taskUtils.ts implementation](c:\Projects\vscode-huckleberry\apps\huckleberry-extension\src\handlers\tasks\taskUtils.ts)
- [VS Code API Documentation](https://code.visualstudio.com/api/references/vscode-api)
- [Vitest Mocking](https://vitest.dev/guide/mocking.html)

## Notes
- This task is split into multiple sub-tasks for better manageable chunks
- TASK-016 and TASK-017 cover specific functions from taskUtils.ts to ensure focused testing
- This is part of Phase 2 (Unit Testing Core Utilities) of our testing strategy
- Created via Huckleberry Task Manager
