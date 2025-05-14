# TASK-001: Set up Vitest configuration for the Huckleberry extension

## Details
- **Priority**: high
- **Status**: Done
- **Created**: 5/10/2025
- **Est. Effort**: 3 hours
- **Completed**: 5/10/2025

## Description
Create and configure Vitest for the Huckleberry extension to enable unit testing. This includes creating a `vitest.config.ts` file in the extension root, configuring the test environment, and setting up proper aliases for VS Code API mocking.

## Acceptance Criteria
- [x] Vitest configuration file is created and properly configured for the extension
- [x] Test environment is set to "node"
- [x] Test file pattern includes tests in the `tests/unit` directory
- [x] Coverage reporting is configured to output text, HTML, and LCOV formats
- [x] VS Code API can be mocked via alias configuration
- [x] Running `vitest run` executes without errors (even if no tests exist yet)

## Implementation Details
1. Add Vitest dependencies to the project:
   ```powershell   cd c:\Projects\vscode-huckleberry
   pnpm add -D vitest @vitest/coverage-v8 @types/node
   ```

2. Create `vitest.config.ts` in the extension root with the following configuration:
   ```typescript
   import { defineConfig } from 'vite';
   import { resolve } from 'path';   export default defineConfig({
     test: {
       environment: 'node',
       include: ['tests/unit/**/*.test.ts'],
       globals: true,
       coverage: {
         provider: 'v8',
         reporter: ['text', 'html', 'lcov'],
         exclude: ['**/node_modules/**', '**/tests/**']
       },
       deps: { fallbackCJS: true },
       alias: {
         vscode: resolve(__dirname, './tests/__mocks__/vscode.ts')
       }
     }
   });
   ```

3. Add a script to `package.json` to run Vitest:
   ```json
   "scripts": {
     "test": "vitest run",
     "test:watch": "vitest",
     "test:coverage": "vitest run --coverage"
   }
   ```

## Related Tasks
- TASK-002: Create VS Code API mock shim for testing
- TASK-003: Set up initial test folder structure
- TASK-012: Add Vitest and coverage dependencies to the project

## References
- [Vitest Configuration Documentation](https://vitest.dev/config/)
- [Improving Extension Quality with Vitest](c:\Projects\vscode-huckleberry\docs\improving-quality.md)
- [VS Code Extension Testing](https://code.visualstudio.com/api/working-with-extensions/testing-extension)

## Notes
- This is part of Phase 1 (Setup and Infrastructure) of our testing strategy
- Created via Huckleberry Task Manager
