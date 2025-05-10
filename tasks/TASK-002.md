# TASK-002: Create VS Code API mock shim for testing

## Details
- **Priority**: high
- **Status**: To Do
- **Created**: 5/10/2025
- **Est. Effort**: 4 hours

## Description
Create a VS Code API mock shim that allows unit tests to run without actual VS Code dependencies. This mock will simulate VS Code's API functionality for testing purposes, focusing on the APIs used by the Huckleberry extension.

## Acceptance Criteria
- [ ] Create a mock implementation of VS Code API in `tests/__mocks__/vscode.ts`
- [ ] Implement the following VS Code APIs with mock functions:
  - [ ] `window` (showInformationMessage, showErrorMessage, createOutputChannel)
  - [ ] `workspace` (workspaceFolders, onDidChangeWorkspaceFolders, fs)
  - [ ] `commands` (executeCommand, registerCommand)
  - [ ] `LanguageModelChatMessage` (if used in tests)
- [ ] Implement realistic return values for all mock functions
- [ ] Add Vitest spies (vi.fn()) to all functions to allow test assertion
- [ ] Document the mock API with JSDoc comments
- [ ] Verify that the mock can be imported in test files

## Implementation Details
1. Create the directory structure for mocks:
   ```powershell
   mkdir -p c:\Projects\vscode-huckleberry\apps\huckleberry-extension\tests\__mocks__
   ```

2. Create the VS Code API mock implementation:
   ```typescript
   // tests/__mocks__/vscode.ts
   import { vi } from 'vitest';
   
   // Window namespace
   export const window = { 
     showInformationMessage: vi.fn().mockResolvedValue(undefined),
     showErrorMessage: vi.fn().mockResolvedValue(undefined),
     createOutputChannel: vi.fn().mockReturnValue({
       appendLine: vi.fn(),
       clear: vi.fn(),
       show: vi.fn(),
       dispose: vi.fn(),
     }),
     // Add other window APIs as needed
   };
   
   // Workspace namespace
   export const workspace = { 
     workspaceFolders: [],
     onDidChangeWorkspaceFolders: vi.fn(),
     fs: {
       readFile: vi.fn(),
       writeFile: vi.fn(),
     },
     // Add other workspace APIs as needed
   };
   
   // Commands namespace
   export const commands = { 
     executeCommand: vi.fn(),
     registerCommand: vi.fn(),
     // Add other command APIs as needed
   };
   
   // Add more VS Code APIs as needed
   ```

3. Add helpers for testing and resetting mocks:
   ```typescript
   /**
    * Reset all VS Code API mocks between tests
    */
   export function resetAllMocks() {
     vi.clearAllMocks();
     workspace.workspaceFolders = [];
     // Reset any other state as needed
   }
   ```

## Related Tasks
- TASK-001: Set up Vitest configuration for the Huckleberry extension
- TASK-003: Set up initial test folder structure
- TASK-004: Create first test for debugUtils.ts

## References
- [VS Code API Documentation](https://code.visualstudio.com/api/references/vscode-api)
- [Vitest Mocking](https://vitest.dev/guide/mocking.html)
- [Testing VS Code Extensions](https://code.visualstudio.com/api/working-with-extensions/testing-extension)

## Notes
- Focus on mocking only the VS Code APIs that are actually used by the extension
- This is a key dependency for all unit tests that will interact with VS Code APIs
- Created via Huckleberry Task Manager
