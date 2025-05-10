# TASK-017: Create unit tests for task prioritization functions in taskUtils.ts

## Details
- **Priority**: high
- **Status**: To Do
- **Created**: 5/10/2025
- **Est. Effort**: 4 hours

## Description
Create unit tests for the task prioritization, creation, and management functions in taskUtils.ts. This includes testing the `createTaskObject`, `getTaskById`, `priorityEmoji` mapping, and the file I/O operations like `readTasksJson` and `writeTasksJson`.

## Acceptance Criteria
- [ ] Create comprehensive tests for `createTaskObject` function
  - [ ] Verify task creation with minimal parameters
  - [ ] Verify task creation with additional properties
  - [ ] Validate default field values
- [ ] Create comprehensive tests for `getTaskById` function
  - [ ] Test with existing task IDs
  - [ ] Test with non-existent task IDs
  - [ ] Test case-insensitive matching
- [ ] Create comprehensive tests for `readTasksJson` function
  - [ ] Test successful reading with ToolManager
  - [ ] Test successful reading with direct fs API fallback
  - [ ] Test error handling and default task collection creation
- [ ] Create comprehensive tests for `writeTasksJson` function
  - [ ] Test successful writing with ToolManager
  - [ ] Test successful writing with direct fs API fallback
  - [ ] Test error handling
- [ ] Achieve >85% coverage for these functions
- [ ] All tests pass successfully when run with `vitest run`

## Implementation Details
1. Create comprehensive mocks for the ToolManager and VS Code dependencies:
   ```typescript
   // tests/unit/handlers/tasks/__mocks__/toolManager.mock.ts
   import { vi } from 'vitest';
   import { TaskCollection } from '../../../../../src/types';
   
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
   
   export function configureMockReadSuccess(taskCollection: TaskCollection) {
     mockReadFile.mockResolvedValue(JSON.stringify(taskCollection));
   }
   
   export function configureMockReadFailure() {
     mockReadFile.mockRejectedValue(new Error('Failed to read file'));
   }
   
   export function resetMocks() {
     vi.clearAllMocks();
     mockReadFile.mockReset();
     mockWriteFile.mockReset();
   }
   ```

2. Create tests for `createTaskObject`:
   ```typescript
   describe('createTaskObject', () => {
     it('should create a task with minimal parameters', () => {
       const task = createTaskObject('TASK-001', 'Test task', 'medium');
       
       expect(task).toMatchObject({
         id: 'TASK-001',
         title: 'Test task',
         description: 'Test task',
         priority: 'medium',
         status: 'todo',
         completed: false,
         tags: []
       });
       
       // Verify date format
       expect(new Date(task.createdAt).toString()).not.toBe('Invalid Date');
     });
     
     it('should override default values with additional properties', () => {
       const task = createTaskObject('TASK-001', 'Test task', 'high', {
         description: 'Custom description',
         status: 'in-progress',
         completed: true,
         tags: ['important', 'urgent']
       });
       
       expect(task).toMatchObject({
         id: 'TASK-001',
         title: 'Test task',
         description: 'Custom description',
         priority: 'high',
         status: 'in-progress',
         completed: true,
         tags: ['important', 'urgent']
       });
     });
   });
   ```

3. Create tests for `getTaskById`:
   ```typescript
   describe('getTaskById', () => {
     const testCollection: TaskCollection = {
       name: 'Test Collection',
       description: 'For testing',
       tasks: [
         { id: 'TASK-001', title: 'First task', description: 'First', priority: 'low', status: 'todo', completed: false, createdAt: '2025-05-01', tags: [] },
         { id: 'TASK-002', title: 'Second task', description: 'Second', priority: 'medium', status: 'in-progress', completed: false, createdAt: '2025-05-02', tags: [] },
         { id: 'TASK-003', title: 'Third task', description: 'Third', priority: 'high', status: 'done', completed: true, createdAt: '2025-05-03', tags: [] }
       ]
     };
     
     it('should find a task by ID', () => {
       const task = getTaskById(testCollection, 'TASK-002');
       expect(task).toMatchObject({
         id: 'TASK-002',
         title: 'Second task'
       });
     });
     
     it('should return undefined for non-existent task ID', () => {
       const task = getTaskById(testCollection, 'TASK-999');
       expect(task).toBeUndefined();
     });
     
     it('should match task ID case-insensitively', () => {
       const task = getTaskById(testCollection, 'task-003');
       expect(task).toMatchObject({
         id: 'TASK-003',
         title: 'Third task'
       });
     });
   });
   ```

4. Create tests for the file I/O functions:
   ```typescript
   describe('readTasksJson', () => {
     beforeEach(() => {
       resetMocks();
     });
     
     it('should read tasks using ToolManager', async () => {
       const mockData = {
         name: 'Test Tasks',
         description: 'Test collection',
         tasks: [{ id: 'TASK-001', title: 'Test', description: 'Test', priority: 'medium', status: 'todo', completed: false, createdAt: '2025-05-01', tags: [] }]
       };
       
       configureMockReadSuccess(mockData);
       
       const result = await readTasksJson(mockToolManager, '/path/to/tasks.json');
       
       expect(mockReadFile).toHaveBeenCalledWith({ path: '/path/to/tasks.json' });
       expect(result).toEqual(mockData);
     });
     
     it('should create a new task collection when file read fails', async () => {
       configureMockReadFailure();
       
       const result = await readTasksJson(mockToolManager, '/path/to/tasks.json');
       
       expect(result).toMatchObject({
         name: 'Project Tasks',
         description: 'Task collection for the project',
         tasks: []
       });
     });
   });
   ```

## Related Tasks
- TASK-001: Set up Vitest configuration for the Huckleberry extension
- TASK-002: Create VS Code API mock shim for testing
- TASK-014: Implement comprehensive testing for taskUtils.ts
- TASK-016: Create unit tests for task parsing functions in taskUtils.ts

## References
- [taskUtils.ts implementation](c:\Projects\vscode-huckleberry\apps\huckleberry-extension\src\handlers\tasks\taskUtils.ts)
- [Vitest Mocking Documentation](https://vitest.dev/guide/mocking.html)
- [Testing Strategy](c:\Projects\vscode-huckleberry\docs\testing-strategy.md)

## Notes
- This task completes the test coverage for taskUtils.ts, working in tandem with TASK-016
- These tests are more complex due to file I/O operations and service dependencies
- Proper mocking is essential for isolating the functionality being tested
- Created via Huckleberry Task Manager
