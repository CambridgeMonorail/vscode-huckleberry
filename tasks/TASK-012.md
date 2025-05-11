# TASK-012: Add Vitest and coverage dependencies to the project

## Details
- **Priority**: medium
- **Status**: To Do
- **Created**: 5/10/2025
- **Est. Effort**: 1 hour

## Description
Add Vitest and related test coverage tools as development dependencies to the project. This will establish the foundation for our unit testing framework and provide code coverage reporting capabilities.

## Acceptance Criteria
- [ ] Install Vitest as a development dependency
- [ ] Install @vitest/coverage-v8 for code coverage analysis
- [ ] Install necessary type definitions for Node.js
- [ ] Add test scripts to package.json
- [ ] Create an initial .vitest directory and .gitignore entry
- [ ] Test the installation by running a simple test command

## Implementation Details
1. Install the required dependencies:   ```powershell
   cd c:\Projects\vscode-huckleberry
   pnpm add -D vitest @vitest/coverage-v8 @types/node
   ```

2. Add test scripts to the extension's package.json:
   ```json
   "scripts": {
     // ...existing scripts
     "test": "vitest run",
     "test:watch": "vitest",
     "test:coverage": "vitest run --coverage"
   }
   ```

3. Add entry to .gitignore:
   ```
   # Test coverage
   coverage/
   .vitest-cache/
   ```

4. Create a minimal test file to validate the setup:
   ```typescript
   // apps/huckleberry-extension/tests/setup.test.ts
   import { describe, it, expect } from 'vitest';

   describe('Vitest Setup', () => {
     it('should be properly configured', () => {
       expect(1 + 1).toBe(2);
     });
   });
   ```

5. Run the test command to verify the installation:
   ```powershell
   cd c:\Projects\vscode-huckleberry
   pnpm exec nx test huckleberry-extension
   ```

## Related Tasks
- TASK-001: Set up Vitest configuration for the Huckleberry extension
- TASK-003: Set up initial test folder structure
- TASK-013: Add VS Code task for running tests

## References
- [Vitest Documentation](https://vitest.dev/guide/)
- [Vitest Coverage Documentation](https://vitest.dev/guide/coverage.html)
- [Testing Strategy Document](c:\Projects\vscode-huckleberry\docs\testing-strategy.md)

## Notes
- This task is a prerequisite for TASK-001 (Vitest configuration)
- The @vitest/coverage-v8 package provides V8-based coverage reporting
- Created via Huckleberry Task Manager
