# TASK-003: Set up initial test folder structure following the testing strategy

## Details
- **Priority**: medium
- **Status**: Done
- **Created**: 5/10/2025
- **Est. Effort**: 1.5 hours
- **Completed**: 5/10/2025

## Description
Create the initial folder structure for test files as outlined in the testing strategy document. This structure will organize unit tests, integration tests, and mock implementations to support the overall testing approach for the Huckleberry extension.

## Acceptance Criteria
- [x] Create the following folder structure in the extension directory:
  - [x] `tests/unit/` for pure logic unit tests
  - [x] `tests/unit/utils/` for utility function tests
  - [x] `tests/unit/handlers/` for handler function tests
  - [x] `tests/unit/services/` for service tests
  - [x] `tests/stubs/` for mock implementations
  - [x] `tests/__mocks__/` for module mocks
  - [x] `tests/integration-edh/` placeholder for future extension host tests
- [x] Create initial README.md files in each folder explaining its purpose
- [x] Create sample test files in appropriate folders following proper naming conventions
- [x] Update .gitignore to exclude test coverage reports

## Implementation Details
1. Create the directory structure:
   ```powershell
   cd c:\Projects\vscode-huckleberry\apps\huckleberry-extension
   
   # Create primary test folders
   mkdir -p tests/unit/utils
   mkdir -p tests/unit/handlers/tasks
   mkdir -p tests/unit/services
   mkdir -p tests/stubs
   mkdir -p tests/__mocks__
   mkdir -p tests/integration-edh
   ```

2. Create README files for each test folder:
   ```markdown
   # Unit Tests
   
   This directory contains unit tests for pure logic functions using Vitest.
   
   ## Organization
   
   Tests are organized to mirror the src directory structure:
   - `/utils` - Tests for utility functions
   - `/handlers` - Tests for command handlers
   - `/services` - Tests for services
   
   ## Naming Convention
   
   Files should be named according to the module they test:
   - `moduleName.test.ts`
   
   ## Running Tests
   
   Run tests with: `pnpm test`
   ```

3. Update .gitignore:
   ```
   # Test coverage
   coverage/
   .vitest-cache/
   ```

4. Create sample test placeholder files to validate the structure:
   ```typescript
   // tests/unit/utils/index.test.ts
   import { describe, it, expect } from 'vitest';
   
   describe('Utils placeholder test', () => {
     it('passes placeholder test', () => {
       expect(true).toBe(true);
     });
   });
   ```

## Related Tasks
- TASK-001: Set up Vitest configuration for the Huckleberry extension
- TASK-002: Create VS Code API mock shim for testing
- TASK-004: Create first test for debugUtils.ts

## References
- [Huckleberry Testing Strategy](c:\Projects\vscode-huckleberry\docs\testing-strategy.md)
- [Nx Testing Best Practices](https://nx.dev/recipes/testing)
- [Vitest Documentation](https://vitest.dev/guide/)

## Notes
- This task implements Phase 1 of the testing strategy: "Setup and Infrastructure"
- The folder structure follows the pattern outlined in the testing strategy document
- Created via Huckleberry Task Manager
