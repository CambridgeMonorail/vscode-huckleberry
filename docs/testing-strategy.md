# Huckleberry Testing Strategy

> A methodical approach to incrementally add test coverage without disrupting functionality

## Overview

This document outlines a step-by-step approach for adding unit tests to the Huckleberry VS Code extension. The plan follows a gradual, incremental method that prioritizes stability while improving code quality through testing. By focusing first on pure utility functions and then moving toward more complex components, we can achieve high test coverage with minimal risk.

## Current Status

The Huckleberry extension currently:

- Is a VS Code extension using GitHub Copilot for task management
- Has no existing test setup or test files
- Has a modular structure with utils, tools, services, and handlers
- Uses the VS Code API extensively
- Interfaces with the Copilot/Language Model tools

## Testing Objectives

1. **Improve code quality** without breaking existing functionality
2. **Increase reliability** by catching regressions early
3. **Enable refactoring** with confidence
4. **Document behavior** through tests
5. **Achieve >90% code coverage** for pure logic components

## Phased Implementation Plan

### Phase 1: Setup and Infrastructure (Week 1)

1. **Set up Vitest configuration**:
   - Add Vitest as a dev dependency
   - Create a `vitest.config.ts` in the extension root
   - Configure a VS Code API mock/shim

2. **Create initial test folder structure**:

   ```bash
   apps/huckleberry-extension/
     tests/
       unit/       <- Vitest pure logic tests
       stubs/      <- Mock implementations 
       __mocks__/  <- Mock for vscode modules
       integration-edh/  <- For later VS Code integration tests
   ```

3. **Create a VS Code API shim**:
   - Create a basic vscode mock in `tests/__mocks__/vscode.ts`
   - Implement the minimum required VS Code APIs for testing

### Phase 2: Pure Utility Testing (Week 2)

1. **Identify pure functions** to test first:
   - `debugUtils.ts` - Logging functionality
   - `parameterUtils.ts` - Parameter handling functions
   - `taskUtils.ts` - Task manipulation functions

2. **Create first test for a pure utility**:
   - Start with a simple utility function
   - Write a comprehensive test suite for it
   - Ensure CI pipeline runs tests correctly

3. **Extract pure logic** where possible:
   - Move business logic from VS Code-dependent code to pure functions
   - Consider creating a `src/lib` folder for pure, easily testable code

### Phase 3: Service Layer Testing (Week 3-4)

1. **Create interfaces and adapter patterns**:
   - Define clear interfaces for services
   - Create shims for Copilot and VS Code APIs
   - Apply dependency injection for testability

2. **Implement service test stubs**:
   - Create mock implementations of services
   - Test service layers in isolation

3. **Test ToolManager components**:
   - Test registration and invocation flows
   - Mock tool execution paths

### Phase 4: Integration Testing with VS Code API (Week 5-6)

1. **Setup Extension Host Testing**:
   - Configure @vscode/test-electron for EDH testing
   - Create simple integration tests

2. **Add CI configuration**:
   - Add GitHub Actions workflow
   - Configure coverage reporting

## Implementation Details

### Initial Setup Commands

```powershell
# Add Vitest and coverage dependencies
cd c:\Projects\vscode-huckleberry
pnpm add -D vitest @vitest/coverage-c8 @types/node
```

### VS Code API Mock Template

```typescript
// tests/__mocks__/vscode.ts
import { vi } from 'vitest';

export const window = { 
  showInformationMessage: vi.fn(),
  showErrorMessage: vi.fn(),
  createOutputChannel: vi.fn().mockReturnValue({
    appendLine: vi.fn(),
    clear: vi.fn(),
    show: vi.fn()
  })
};

export const workspace = { 
  workspaceFolders: [],
  onDidChangeWorkspaceFolders: vi.fn(),
  fs: {
    readFile: vi.fn(),
    writeFile: vi.fn(),
  }
};

export const commands = { 
  executeCommand: vi.fn(),
  registerCommand: vi.fn()
};

// Add more API mocks as needed
```

### Vitest Configuration

```typescript
// vitest.config.ts
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.ts'],
    globals: true,
    coverage: { 
      provider: 'c8',
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

### First Test Example: debugUtils

```typescript
// tests/unit/utils/debugUtils.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { LogLevel, logWithChannel } from '../../../src/utils/debugUtils';
import * as vscode from 'vscode';

describe('debugUtils', () => {
  const mockOutputChannel = {
    appendLine: vi.fn(),
    clear: vi.fn(),
    show: vi.fn()
  };
  
  beforeEach(() => {
    vi.clearAllMocks();
    (vscode.window.createOutputChannel as any).mockReturnValue(mockOutputChannel);
  });
  
  it('should have the correct log levels defined', () => {
    expect(LogLevel.INFO).toBe('INFO');
    expect(LogLevel.ERROR).toBe('ERROR');
    expect(LogLevel.DEBUG).toBe('DEBUG');
    expect(LogLevel.WARN).toBe('WARN');
    expect(LogLevel.CRITICAL).toBe('CRITICAL');
  });
  
  it('should log messages with the correct format', () => {
    logWithChannel(LogLevel.INFO, 'Test message');
    expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
      expect.stringMatching(/^\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\] \[INFO\] Test message$/)
    );
  });
});
```

## Refactoring Strategies

### 1. Interface Extraction

For components that interact with VS Code APIs, extract interfaces:

```typescript
export interface FileSystemService {
  readTaskFile(): Promise<TaskData>;
  writeTaskFile(data: TaskData): Promise<void>;
}

// Implementation that uses VS Code APIs
export class VSCodeFileSystemService implements FileSystemService {
  async readTaskFile(): Promise<TaskData> {
    // Implementation using vscode.workspace.fs
  }
  
  async writeTaskFile(data: TaskData): Promise<void> {
    // Implementation using vscode.workspace.fs
  }
}

// Mock for testing
export class MockFileSystemService implements FileSystemService {
  private mockData: TaskData = { tasks: [] };
  
  async readTaskFile(): Promise<TaskData> {
    return this.mockData;
  }
  
  async writeTaskFile(data: TaskData): Promise<void> {
    this.mockData = data;
  }
}
```

### 2. Dependency Injection

Update services to use dependency injection:

```typescript
export class TaskService {
  constructor(private fileSystem: FileSystemService) {}
  
  async getTasks(): Promise<Task[]> {
    const data = await this.fileSystem.readTaskFile();
    return data.tasks;
  }
}
```

## Challenges and Solutions

| Challenge | Solution |
|-----------|----------|
| VS Code API Dependencies | Create adapter patterns and interfaces |
| Copilot Integration | Mock Copilot responses using fixtures |
| Circular Dependencies | Refactor code to have clearer module boundaries |
| Testing Commands | Use CommandHandler pattern to separate logic from registration |
| Testing User Interactions | Mock UI components and test business logic in isolation |

## Coverage Goals

| Component | Initial Target | Final Target |
|-----------|----------------|--------------|
| Utils | 90% | 95% |
| Task Logic | 80% | 90% |
| Services | 70% | 85% |
| Tools | 70% | 85% |
| Command Handlers | 60% | 75% |
| UI Components | 50% | 70% |

## Next Steps

1. Set up Vitest configuration
2. Create the VS Code API mock/shim
3. Start with one pure utility function test (debugUtils.ts)
4. Extract task logic into testable units
5. Add tests for task manipulation functions
6. Gradually expand coverage following the phased plan

## References

- [Improving Extension Quality with Vitest](c:\Projects\vscode-huckleberry\docs\improving-quality.md)
- [VS Code Extension Testing Documentation](https://code.visualstudio.com/api/working-with-extensions/testing-extension)
- [Vitest Documentation](https://vitest.dev/guide/)
