# TASK-016: Create unit tests for task parsing functions in taskUtils.ts

## Details
- **Priority**: high
- **Status**: To Do
- **Created**: 5/10/2025
- **Est. Effort**: 3 hours

## Description
Create focused unit tests for the task parsing and extraction functions in taskUtils.ts, specifically targeting the functions that handle task ID generation, extraction, and parsing: `extractTaskNumber`, `findHighestTaskNumber`, and `generateTaskId`.

## Acceptance Criteria
- [ ] Create comprehensive tests for `extractTaskNumber` function
  - [ ] Test with valid task IDs in various formats (TASK-001, TASK-1, task-42)
  - [ ] Test with invalid formats
  - [ ] Test error handling
- [ ] Create comprehensive tests for `findHighestTaskNumber` function
  - [ ] Test with empty array
  - [ ] Test with array containing mixed valid and invalid task IDs
  - [ ] Test with array containing sequential and non-sequential IDs
- [ ] Create comprehensive tests for `generateTaskId` function
  - [ ] Test with empty task collection
  - [ ] Test with existing task collection containing various IDs
  - [ ] Verify proper padding of task numbers
- [ ] Achieve >90% code coverage for these specific functions
- [ ] All tests pass successfully when run with `vitest run`

## Implementation Details
1. Ensure the test file is properly set up:
   ```typescript
   // tests/unit/handlers/tasks/taskUtils.test.ts
   import { describe, it, expect, vi } from 'vitest';
   import { 
     generateTaskId
     // You'll need to expose the other functions for testing
   } from '../../../../src/handlers/tasks/taskUtils';
   import { TaskCollection } from '../../../../src/types';
   ```

2. Since `extractTaskNumber` and `findHighestTaskNumber` are currently private functions, you'll need to handle this in one of two ways:
   - Option 1: Export these functions in taskUtils.ts for testability
   - Option 2: Test them indirectly through `generateTaskId`
   
   For Option 1, add export statements in taskUtils.ts:
   ```typescript
   // Add exports for testing purposes
   export function extractTaskNumber(taskId: string): number {
     // ...existing implementation...
   }
   
   export function findHighestTaskNumber(tasks: Task[]): number {
     // ...existing implementation...
   }
   ```

3. Create tests for `extractTaskNumber`:
   ```typescript
   describe('extractTaskNumber', () => {
     it('should extract number from standard task ID format', () => {
       expect(extractTaskNumber('TASK-001')).toBe(1);
       expect(extractTaskNumber('TASK-042')).toBe(42);
       expect(extractTaskNumber('TASK-100')).toBe(100);
     });
     
     it('should handle different casing', () => {
       expect(extractTaskNumber('task-001')).toBe(1);
       expect(extractTaskNumber('Task-042')).toBe(42);
     });
     
     it('should return 0 for invalid formats', () => {
       expect(extractTaskNumber('not-a-task')).toBe(0);
       expect(extractTaskNumber('TASKX001')).toBe(0);
       expect(extractTaskNumber('')).toBe(0);
     });
   });
   ```

4. Create tests for `findHighestTaskNumber`:
   ```typescript
   describe('findHighestTaskNumber', () => {
     it('should return 0 for empty array', () => {
       expect(findHighestTaskNumber([])).toBe(0);
     });
     
     it('should find the highest task number in an array', () => {
       const tasks = [
         { id: 'TASK-001', title: 'First task', /* other props */ },
         { id: 'TASK-005', title: 'Fifth task', /* other props */ },
         { id: 'TASK-003', title: 'Third task', /* other props */ },
       ];
       expect(findHighestTaskNumber(tasks)).toBe(5);
     });
     
     it('should handle mixed valid and invalid task IDs', () => {
       const tasks = [
         { id: 'TASK-001', title: 'First task', /* other props */ },
         { id: 'NOT-A-TASK', title: 'Invalid task', /* other props */ },
         { id: 'TASK-010', title: 'Tenth task', /* other props */ },
       ];
       expect(findHighestTaskNumber(tasks)).toBe(10);
     });
   });
   ```

5. Create tests for `generateTaskId`:
   ```typescript
   describe('generateTaskId', () => {
     it('should generate TASK-001 for empty task collection', () => {
       const emptyCollection: TaskCollection = { name: 'Test', description: 'Test collection', tasks: [] };
       expect(generateTaskId(emptyCollection)).toBe('TASK-001');
     });
     
     it('should increment highest existing ID', () => {
       const collection: TaskCollection = { 
         name: 'Test', 
         description: 'Test collection', 
         tasks: [
           { id: 'TASK-005', title: 'Task 5', /* other props */ },
           { id: 'TASK-002', title: 'Task 2', /* other props */ }
         ] 
       };
       expect(generateTaskId(collection)).toBe('TASK-006');
     });
     
     it('should preserve padding format based on existing tasks', () => {
       const collection: TaskCollection = { 
         name: 'Test', 
         description: 'Test collection', 
         tasks: [{ id: 'TASK-099', title: 'Task 99', /* other props */ }] 
       };
       expect(generateTaskId(collection)).toBe('TASK-100');
     });
     
     it('should use default 3-digit padding if no existing tasks', () => {
       expect(generateTaskId()).toBe('TASK-001');
     });
   });
   ```

## Related Tasks
- TASK-001: Set up Vitest configuration for the Huckleberry extension
- TASK-002: Create VS Code API mock shim for testing
- TASK-014: Implement comprehensive testing for taskUtils.ts
- TASK-015: Setup initial debugging of taskUtils.ts unit tests

## References
- [taskUtils.ts implementation](c:\Projects\vscode-huckleberry\apps\huckleberry-extension\src\handlers\tasks\taskUtils.ts)
- [Vitest Assertion API](https://vitest.dev/api/expect.html)
- [Testing Strategy](c:\Projects\vscode-huckleberry\docs\testing-strategy.md)

## Notes
- This task focuses on the parsing and ID generation specifically, while TASK-014 covers the overall module
- These are pure functions which are easier to test and make a good starting point
- Created via Huckleberry Task Manager
