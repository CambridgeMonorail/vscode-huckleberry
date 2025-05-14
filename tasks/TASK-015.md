# TASK-015: Setup initial debugging of taskUtils.ts unit tests

## Details
- **Priority**: high
- **Status**: To Do
- **Created**: 5/10/2025
- **Est. Effort**: 2 hours

## Description
Configure VS Code's debugging capabilities for efficiently debugging Vitest unit tests, starting with taskUtils.ts tests. This setup will allow developers to set breakpoints, inspect variables, and step through test code execution, making test development and troubleshooting more efficient.

## Acceptance Criteria
- [ ] Create a `.vscode/launch.json` configuration for debugging Vitest tests
- [ ] Configure debug setup to work specifically with taskUtils.ts tests
- [ ] Include ability to debug a single test or all tests
- [ ] Set up environment variables needed for debugging
- [ ] Document the debug setup process in a README section
- [ ] Test the configuration by successfully debugging at least one test case

## Implementation Details
1. Create or update the `.vscode/launch.json` file:
   ```json
   {
     "version": "0.2.0",
     "configurations": [
       {
         "type": "node",
         "request": "launch",
         "name": "Debug Current Test File",
         "autoAttachChildProcesses": true,
         "skipFiles": ["<node_internals>/**", "**/node_modules/**"],
         "program": "${workspaceFolder}/node_modules/vitest/vitest.mjs",
         "args": ["run", "${relativeFile}"],
         "smartStep": true,
         "console": "integratedTerminal",
         "cwd": "${workspaceFolder}/apps/huckleberry-extension"
       },
       {
         "type": "node",
         "request": "launch",
         "name": "Debug All Tests",
         "autoAttachChildProcesses": true,
         "skipFiles": ["<node_internals>/**", "**/node_modules/**"],
         "program": "${workspaceFolder}/node_modules/vitest/vitest.mjs",
         "args": ["run"],
         "smartStep": true,
         "console": "integratedTerminal",
         "cwd": "${workspaceFolder}/apps/huckleberry-extension"
       },
       {
         "type": "node",
         "request": "launch",
         "name": "Debug taskUtils Tests",
         "autoAttachChildProcesses": true,
         "skipFiles": ["<node_internals>/**", "**/node_modules/**"],
         "program": "${workspaceFolder}/node_modules/vitest/vitest.mjs",
         "args": ["run", "tests/unit/handlers/tasks/taskUtils.test.ts"],
         "smartStep": true,
         "console": "integratedTerminal",
         "cwd": "${workspaceFolder}/apps/huckleberry-extension"
       }
     ]
   }
   ```

2. Add a section in the extension's README or documentation:
   ```markdown
   ## Debugging Tests

   To debug unit tests in VS Code:

   1. Open the test file you want to debug
   2. Set breakpoints in your test code or source code
   3. Press F5 or select "Debug Current Test File" from the debug menu
   4. The debugger will stop at your breakpoints, allowing you to inspect variables and step through code

   You can also use "Debug All Tests" to run the entire test suite with the debugger attached, or "Debug taskUtils Tests" to specifically debug the task utilities tests.
   ```

3. Test the debugging setup with a sample taskUtils.test.ts file:
   ```typescript
   // This is a temporary test file to verify debugging works
   import { describe, it, expect } from 'vitest';
   import { generateTaskId } from '../../../../src/handlers/tasks/taskUtils';

   describe('taskUtils debugging test', () => {
     it('should generate a task ID correctly', () => {
       // Set a breakpoint on the line below to test debugging
       const taskId = generateTaskId();
       expect(taskId).toMatch(/^TASK-\d{3,}$/);
     });
   });
   ```

## Related Tasks
- TASK-001: Set up Vitest configuration for the Huckleberry extension
- TASK-002: Create VS Code API mock shim for testing
- TASK-014: Implement comprehensive testing for taskUtils.ts
- TASK-013: Add VS Code task for running tests

## References
- [VS Code Debugging Documentation](https://code.visualstudio.com/docs/editor/debugging)
- [Vitest Debugging Guide](https://vitest.dev/guide/debugging.html)
- [Project Debug Setup Guide](c:\Projects\vscode-huckleberry\docs\debug-setup.md)

## Notes
- This task enables efficient development of further unit tests by providing proper debugging tools
- Part of Phase 1 (Setup and Infrastructure) of our testing strategy
- Created via Huckleberry Task Manager
