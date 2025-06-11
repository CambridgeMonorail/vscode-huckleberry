/**
 * Common mock implementations for tests
 */
import { vi } from 'vitest';
import type { ToolManager } from '../../../src/services/toolManager';

/**
 * Creates a mock tool manager for testing
 * @returns A mocked ToolManager instance
 */
export function createMockToolManager(): ToolManager {
  return {
    getWorkspacePaths: vi.fn(),
    getTools: vi.fn().mockReturnValue([]),
    registerTool: vi.fn(),
    invokeTool: vi.fn(),
    isRegistered: vi.fn().mockReturnValue(true),
    getRegistrationInfo: vi.fn(),
    getAllTools: vi.fn().mockReturnValue([]),
  } as unknown as ToolManager;
}

/**
 * Interface for the VSCode window mock
 */
interface VSCodeWindowMock {
  showInformationMessage: import('vitest').Mock;
  showErrorMessage: import('vitest').Mock;
  showWarningMessage: import('vitest').Mock;
  showQuickPick: import('vitest').Mock;
  showInputBox: import('vitest').Mock;
  showOpenDialog: import('vitest').Mock;
  createOutputChannel: import('vitest').Mock;
}

/**
 * Interface for the VSCode mock
 */
interface VSCodeMock {
  window: VSCodeWindowMock;
  Uri: {
    file: (path: string) => { fsPath: string };
  };
}

/**
 * Interface for the task selection mock controls
 */
interface TaskSelectionMockControls {
  selectItem: (index: number) => void;
  cancelSelection: () => void;
}

/**
 * Sets up basic mock behavior for task selection
 */
export function setupTaskSelectionMocks(
  vscode: VSCodeMock, 
  _unused: unknown[] = [],
): TaskSelectionMockControls {
  // Mock basic task data
  vscode.window.showInformationMessage.mockReset();
  vscode.window.showErrorMessage.mockReset();
  vscode.window.showQuickPick.mockReset();

  // Default implementation returns the first task
  vscode.window.showQuickPick.mockImplementation(items => {
    if (Array.isArray(items) && items.length > 0) {
      return Promise.resolve(items[0]);
    }
    return Promise.resolve(undefined);
  });

  return {
    /**
     * Simulates user selecting a specific item
     */
    selectItem: (index: number): void => {
      vscode.window.showQuickPick.mockImplementationOnce(items => {
        if (Array.isArray(items) && items.length > index) {
          return Promise.resolve(items[index]);
        }
        return Promise.resolve(items[0]);
      });
    },
    /**
     * Simulates user cancelling the selection
     */    cancelSelection: (): void => {
      vscode.window.showQuickPick.mockImplementationOnce(() => Promise.resolve(undefined));
    },
  };
}
