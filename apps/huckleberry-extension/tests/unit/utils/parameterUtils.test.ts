/**
 * Tests for parameterUtils.ts
 */

import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// No need to import types for mocks now

// Create mock task data
const mockTasksData = {
  tasks: [
    { id: 'task-1', title: 'Task 1', description: 'First task', priority: 'high' as TaskPriority, completed: false },
    { id: 'task-2', title: 'Task 2', description: 'Second task', priority: 'medium' as TaskPriority, completed: false },
    { id: 'task-3', title: 'Task 3', description: 'Completed task', priority: 'low' as TaskPriority, completed: true },
  ],
  nextId: 4,
};

// Mock vscode module with mock window functions
vi.mock('vscode', () => {
  const mockWindow = {
    showInformationMessage: vi.fn().mockResolvedValue(undefined),
    showErrorMessage: vi.fn().mockResolvedValue(undefined),
    showWarningMessage: vi.fn().mockResolvedValue(undefined),
    showQuickPick: vi.fn().mockImplementation(() => Promise.resolve(undefined)),
    showInputBox: vi.fn().mockImplementation(() => Promise.resolve('')),
    showOpenDialog: vi.fn().mockImplementation(() => Promise.resolve(undefined)),
    createOutputChannel: vi.fn().mockReturnValue({
      appendLine: vi.fn(),
      append: vi.fn(),
      clear: vi.fn(),
      show: vi.fn(),
      hide: vi.fn(),
      dispose: vi.fn(),
      name: 'Huckleberry Debug',
    }),
  };
  
  return {
    window: mockWindow,
    Uri: {
      file: (path: string) => ({ fsPath: path }),
    },
  };
});

// Mock taskUtils
vi.mock('../../../src/handlers/tasks/taskUtils', () => {
  return {
    getWorkspacePaths: vi.fn().mockImplementation(() => {
      return Promise.resolve({
        workspaceFolder: '/test/workspace',
        tasksDir: '/test/workspace/tasks',
        tasksJsonPath: '/test/workspace/tasks/tasks.json',
      });
    }),
    readTasksJson: vi.fn().mockImplementation(() => Promise.resolve(mockTasksData)),
    priorityEmoji: {
      critical: '⚠️',
      high: '🔴',
      medium: '🟠',
      low: '🟢',
    },
  };
});

// Import after mocks
import { 
  promptForTaskSelection,
  promptForPrioritySelection,
  promptForFilePattern,
  promptForDocumentSelection,
  promptForHelpTopic,
  promptForTaskAndPriority,
  UIProvider,
  TaskDataProvider,
  createTaskQuickPickItems,
  createPriorityQuickPickItems,
  // These imports are used indirectly in test setup
  createFilePatternQuickPickItems as _createFilePatternQuickPickItems,
  createDocumentFilters as _createDocumentFilters,
  createHelpTopicQuickPickItems as _createHelpTopicQuickPickItems,
  extractPriorityFromLabel,
} from '../../../src/utils/parameterUtils';
import { readTasksJson, getWorkspacePaths as _getWorkspacePaths } from '../../../src/handlers/tasks/taskUtils';
import { createMockToolManager } from './mocks';
import { TaskPriority } from '../../../src/types';

describe('parameterUtils', () => {
  const mockToolManager = createMockToolManager();

  // Create mock providers for testing
  const mockUIProvider: UIProvider = {
    showInformationMessage: vi.fn().mockResolvedValue(undefined),
    showErrorMessage: vi.fn().mockResolvedValue(undefined),
    showQuickPick: vi.fn().mockResolvedValue(undefined),
    showInputBox: vi.fn().mockResolvedValue(''),
    showOpenDialog: vi.fn().mockResolvedValue(undefined),
  };

  const mockTaskDataProvider: TaskDataProvider = {
    getTasksData: vi.fn().mockResolvedValue(mockTasksData),
    getWorkspacePaths: vi.fn().mockResolvedValue({
      workspaceFolder: '/test/workspace',
      tasksDir: '/test/workspace/tasks',
      tasksJsonPath: '/test/workspace/tasks/tasks.json',
    }),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock implementations
    (readTasksJson as ReturnType<typeof vi.fn>).mockResolvedValue(mockTasksData);
    (mockUIProvider.showQuickPick as ReturnType<typeof vi.fn>).mockReset();
    (mockUIProvider.showInformationMessage as ReturnType<typeof vi.fn>).mockReset();
    (mockUIProvider.showErrorMessage as ReturnType<typeof vi.fn>).mockReset();
    (mockUIProvider.showInputBox as ReturnType<typeof vi.fn>).mockReset();
    (mockUIProvider.showOpenDialog as ReturnType<typeof vi.fn>).mockReset();
    (mockTaskDataProvider.getTasksData as ReturnType<typeof vi.fn>).mockReset();
    (mockTaskDataProvider.getWorkspacePaths as ReturnType<typeof vi.fn>).mockReset();
    
    // Default implementations
    (mockUIProvider.showInformationMessage as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (mockUIProvider.showErrorMessage as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (mockUIProvider.showQuickPick as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (mockUIProvider.showInputBox as ReturnType<typeof vi.fn>).mockResolvedValue('');
    (mockUIProvider.showOpenDialog as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (mockTaskDataProvider.getTasksData as ReturnType<typeof vi.fn>).mockResolvedValue(mockTasksData);
    (mockTaskDataProvider.getWorkspacePaths as ReturnType<typeof vi.fn>).mockResolvedValue({
      workspaceFolder: '/test/workspace',
      tasksDir: '/test/workspace/tasks',
      tasksJsonPath: '/test/workspace/tasks/tasks.json',
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  // Test pure functions first
  describe('createTaskQuickPickItems', () => {
    it('should create task items with correct properties', () => {
      const items = createTaskQuickPickItems(mockTasksData.tasks, false);
      
      expect(items.length).toBe(3);
      expect(items[0].label).toBe('task-1');
      expect(items[0].description).toBe('Task 1');
      expect(items[0].taskId).toBe('task-1');
      expect(items[0].detail).toContain('🔴 high priority');
    });

    it('should filter out completed tasks when excludeCompleted is true', () => {
      const items = createTaskQuickPickItems(mockTasksData.tasks, true);
      
      expect(items.length).toBe(2);
      expect(items.some(item => item.taskId === 'task-3')).toBe(false);
    });
  });

  describe('createPriorityQuickPickItems', () => {
    it('should create priority items with correct properties', () => {
      const items = createPriorityQuickPickItems();
      
      expect(items.length).toBe(4);
      expect(items.some(item => item.label.includes('Critical'))).toBe(true);
      expect(items.some(item => item.label.includes('High'))).toBe(true);
      expect(items.some(item => item.label.includes('Medium'))).toBe(true);
      expect(items.some(item => item.label.includes('Low'))).toBe(true);
    });
  });

  describe('extractPriorityFromLabel', () => {
    it('should extract priority correctly from labels', () => {
      expect(extractPriorityFromLabel('⚠️ Critical')).toBe('critical');
      expect(extractPriorityFromLabel('🔴 High')).toBe('high');
      expect(extractPriorityFromLabel('🟠 Medium')).toBe('medium');
      expect(extractPriorityFromLabel('🟢 Low')).toBe('low');
      expect(extractPriorityFromLabel('Unknown')).toBeUndefined();
    });
  });

  describe('promptForTaskSelection', () => {
    it('should show a message when no tasks are found', async () => {
      // Mock empty tasks data for this test
      (mockTaskDataProvider.getTasksData as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ tasks: [] });
      
      const result = await promptForTaskSelection(mockToolManager, false, mockUIProvider, mockTaskDataProvider);
      
      expect(mockUIProvider.showInformationMessage).toHaveBeenCalledWith('No tasks found. Create a task first.');
      expect(result).toBeUndefined();
    });

    it('should show a message when no incomplete tasks are found with excludeCompleted=true', async () => {
      // Mock tasks data with only completed tasks
      (mockTaskDataProvider.getTasksData as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        tasks: [
          { id: 'task-1', title: 'Task 1', completed: true },
        ],
      });
      
      const result = await promptForTaskSelection(mockToolManager, true, mockUIProvider, mockTaskDataProvider);
      
      expect(mockUIProvider.showInformationMessage).toHaveBeenCalledWith('No incomplete tasks found. All tasks are completed!');
      expect(result).toBeUndefined();
    });

    it('should return selected task ID when user makes a selection', async () => {
      // Mock the showQuickPick to return a selected item
      (mockUIProvider.showQuickPick as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        taskId: 'task-2',
        label: 'task-2',
        description: 'Task 2',
      });
      
      const result = await promptForTaskSelection(mockToolManager, false, mockUIProvider, mockTaskDataProvider);
      
      expect(mockUIProvider.showQuickPick).toHaveBeenCalled();
      expect(result).toBe('task-2');
    });

    it('should filter out completed tasks when excludeCompleted is true', async () => {
      // Mock the showQuickPick implementation to capture the items
      (mockUIProvider.showQuickPick as ReturnType<typeof vi.fn>).mockImplementationOnce(items => {
        // Check that completed tasks are filtered out
        const taskItems = items as Array<{ taskId: string }>;
        expect(taskItems.length).toBe(2);
        expect(taskItems.some(item => item.taskId === 'task-3')).toBe(false);
        
        // Return a selection
        return Promise.resolve(taskItems[0]);
      });
      
      await promptForTaskSelection(mockToolManager, true, mockUIProvider, mockTaskDataProvider);
      
      expect(mockUIProvider.showQuickPick).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      // Mock getTasksData to throw an error
      const testError = new Error('Test error');
      (mockTaskDataProvider.getTasksData as ReturnType<typeof vi.fn>).mockRejectedValueOnce(testError);
      
      const result = await promptForTaskSelection(mockToolManager, false, mockUIProvider, mockTaskDataProvider);
      
      // Check that an error message is shown
      expect(mockUIProvider.showErrorMessage).toHaveBeenCalled();
      expect(result).toBeUndefined();
    });
  });

  describe('promptForPrioritySelection', () => {
    it('should return undefined when user cancels selection', async () => {
      // Mock the showQuickPick to return undefined (user cancelled)
      (mockUIProvider.showQuickPick as ReturnType<typeof vi.fn>).mockResolvedValueOnce(undefined);
      
      const result = await promptForPrioritySelection(mockUIProvider);
      
      expect(mockUIProvider.showQuickPick).toHaveBeenCalled();
      expect(result).toBeUndefined();
    });

    it('should return the correct priority when user makes a selection', async () => {
      // Mock the showQuickPick to return a selected item
      (mockUIProvider.showQuickPick as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        label: '🔴 High',
        description: 'Important tasks that should be done soon',
      });
      
      const result = await promptForPrioritySelection(mockUIProvider);
      
      expect(mockUIProvider.showQuickPick).toHaveBeenCalled();
      expect(result).toBe('high');
    });
    
    it('should show all priority options', async () => {
      // Mock the showQuickPick implementation to capture the items
      (mockUIProvider.showQuickPick as ReturnType<typeof vi.fn>).mockImplementationOnce(items => {
        // Check that all priority options are shown
        const priorityItems = items as Array<{ label: string }>;
        expect(priorityItems.length).toBe(4);
        expect(priorityItems.some(item => item.label.includes('Critical'))).toBe(true);
        expect(priorityItems.some(item => item.label.includes('High'))).toBe(true);
        expect(priorityItems.some(item => item.label.includes('Medium'))).toBe(true);
        expect(priorityItems.some(item => item.label.includes('Low'))).toBe(true);
        
        // Return a selection
        return Promise.resolve(priorityItems[0]);
      });
      
      await promptForPrioritySelection(mockUIProvider);
      
      expect(mockUIProvider.showQuickPick).toHaveBeenCalled();
    });
  });

  describe('promptForFilePattern', () => {
    it('should return undefined when user cancels selection', async () => {
      // Mock the showQuickPick to return undefined (user cancelled)
      (mockUIProvider.showQuickPick as ReturnType<typeof vi.fn>).mockResolvedValueOnce(undefined);
      
      const result = await promptForFilePattern(mockUIProvider);
      
      expect(mockUIProvider.showQuickPick).toHaveBeenCalled();
      expect(result).toBeUndefined();
    });

    it('should return undefined for "All Files" option', async () => {
      // Mock the showQuickPick to return the "All Files" option
      (mockUIProvider.showQuickPick as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        label: 'All Files',
        description: 'Scan all files in the workspace',
      });
      
      const result = await promptForFilePattern(mockUIProvider);
      
      expect(mockUIProvider.showQuickPick).toHaveBeenCalled();
      expect(result).toBeUndefined();
    });

    it('should return the description for predefined patterns', async () => {
      // Mock the showQuickPick to return a predefined pattern option
      (mockUIProvider.showQuickPick as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        label: 'TypeScript Files',
        description: '**/*.ts',
        detail: 'Scan all TypeScript files',
      });
      
      const result = await promptForFilePattern(mockUIProvider);
      
      expect(mockUIProvider.showQuickPick).toHaveBeenCalled();
      expect(result).toBe('**/*.ts');
    });

    it('should prompt for custom pattern when "Custom Pattern" is selected', async () => {
      // Mock the showQuickPick to return the "Custom Pattern" option
      (mockUIProvider.showQuickPick as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        label: 'Custom Pattern',
        description: 'Enter a custom file pattern',
      });
      
      // Mock the showInputBox to return a custom pattern
      (mockUIProvider.showInputBox as ReturnType<typeof vi.fn>).mockResolvedValueOnce('src/**/*.{js,jsx}');
      
      const result = await promptForFilePattern(mockUIProvider);
      
      expect(mockUIProvider.showQuickPick).toHaveBeenCalled();
      expect(mockUIProvider.showInputBox).toHaveBeenCalled();
      expect(result).toBe('src/**/*.{js,jsx}');
    });
    
    it('should return undefined if user cancels custom pattern input', async () => {
      // Mock the showQuickPick to return the "Custom Pattern" option
      (mockUIProvider.showQuickPick as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        label: 'Custom Pattern',
        description: 'Enter a custom file pattern',
      });
      
      // Mock the showInputBox to return undefined (user cancelled)
      (mockUIProvider.showInputBox as ReturnType<typeof vi.fn>).mockResolvedValueOnce(undefined);
      
      const result = await promptForFilePattern(mockUIProvider);
      
      expect(mockUIProvider.showQuickPick).toHaveBeenCalled();
      expect(mockUIProvider.showInputBox).toHaveBeenCalled();
      expect(result).toBeUndefined();
    });
  });

  describe('promptForDocumentSelection', () => {
    it('should return undefined when user cancels selection', async () => {
      // Mock the showOpenDialog to return undefined (user cancelled)
      (mockUIProvider.showOpenDialog as ReturnType<typeof vi.fn>).mockResolvedValueOnce(undefined);
      
      const result = await promptForDocumentSelection(mockUIProvider);
      
      expect(mockUIProvider.showOpenDialog).toHaveBeenCalled();
      expect(result).toBeUndefined();
    });

    it('should return file path when user selects a file', async () => {
      // Mock the showOpenDialog to return a file URI
      (mockUIProvider.showOpenDialog as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
        { fsPath: '/test/workspace/requirements.md' },
      ]);
      
      const result = await promptForDocumentSelection(mockUIProvider);
      
      expect(mockUIProvider.showOpenDialog).toHaveBeenCalled();
      expect(result).toBe('/test/workspace/requirements.md');
    });

    it('should handle errors gracefully', async () => {
      // Mock showOpenDialog to throw an error
      const testError = new Error('Test error');
      (mockUIProvider.showOpenDialog as ReturnType<typeof vi.fn>).mockRejectedValueOnce(testError);
      
      const result = await promptForDocumentSelection(mockUIProvider);
      
      expect(mockUIProvider.showErrorMessage).toHaveBeenCalled();
      expect(result).toBeUndefined();
    });
  });

  describe('promptForHelpTopic', () => {
    it('should return undefined when user cancels selection', async () => {
      // Mock the showQuickPick to return undefined (user cancelled)
      (mockUIProvider.showQuickPick as ReturnType<typeof vi.fn>).mockResolvedValueOnce(undefined);
      
      const result = await promptForHelpTopic(mockUIProvider);
      
      expect(mockUIProvider.showQuickPick).toHaveBeenCalled();
      expect(result).toBeUndefined();
    });

    it('should return the selected topic value when user makes a selection', async () => {
      // Mock the showQuickPick to return a selected item
      (mockUIProvider.showQuickPick as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        label: 'Task Creation',
        value: 'task-creation',
        description: 'Creating and managing tasks',
      });
      
      const result = await promptForHelpTopic(mockUIProvider);
      
      expect(mockUIProvider.showQuickPick).toHaveBeenCalled();
      expect(result).toBe('task-creation');
    });
    
    it('should show all help topics', async () => {
      // Mock the showQuickPick implementation to capture the items
      (mockUIProvider.showQuickPick as ReturnType<typeof vi.fn>).mockImplementationOnce(items => {
        // Check that all help topics are shown
        const topicItems = items as Array<{ label: string; value: string }>;
        expect(topicItems.length).toBe(10); // Verify we have all 10 topics
        
        // Check for a few key topics
        expect(topicItems.some(item => item.value === 'task-creation')).toBe(true);
        expect(topicItems.some(item => item.value === 'general')).toBe(true);
        expect(topicItems.some(item => item.value === 'todo-scanning')).toBe(true);
        
        // Return a selection
        return Promise.resolve(topicItems[0]);
      });
      
      await promptForHelpTopic(mockUIProvider);
      
      expect(mockUIProvider.showQuickPick).toHaveBeenCalled();
    });
  });

  describe('promptForTaskAndPriority', () => {
    it('should return empty object when task selection is cancelled', async () => {
      // Mock task selection to return undefined
      (mockUIProvider.showQuickPick as ReturnType<typeof vi.fn>).mockResolvedValueOnce(undefined);
      
      const result = await promptForTaskAndPriority(mockToolManager, mockUIProvider, mockTaskDataProvider);
      
      expect(result).toEqual({});
    });

    it('should return task ID and priority when both are selected', async () => {
      // First call - task selection
      (mockUIProvider.showQuickPick as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        taskId: 'task-1',
        label: 'task-1',
        description: 'Task 1',
      });
      
      // Second call - priority selection
      (mockUIProvider.showQuickPick as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        label: '🔴 High',
        description: 'Important tasks that should be done soon',
      });
      
      const result = await promptForTaskAndPriority(mockToolManager, mockUIProvider, mockTaskDataProvider);
      
      expect(result.taskId).toBe('task-1');
      expect(result.priority).toBe('high');
    });

    it('should return only task ID when priority selection is cancelled', async () => {
      // First call - task selection
      (mockUIProvider.showQuickPick as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        taskId: 'task-2',
        label: 'task-2',
        description: 'Task 2',
      });
      
      // Second call - priority selection (user cancelled)
      (mockUIProvider.showQuickPick as ReturnType<typeof vi.fn>).mockResolvedValueOnce(undefined);
      
      const result = await promptForTaskAndPriority(mockToolManager, mockUIProvider, mockTaskDataProvider);
      
      expect(result.taskId).toBe('task-2');
      expect(result.priority).toBeUndefined();
    });
  });
});
