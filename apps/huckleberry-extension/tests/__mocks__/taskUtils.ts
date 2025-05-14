/**
 * Mock for taskUtils module
 */
import { vi } from 'vitest';

// Define the TaskPriority enum directly in the mock to avoid path issues
export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export const getWorkspacePaths = vi.fn().mockResolvedValue({
  workspacePath: '/test/workspace',
  tasksJsonPath: '/test/workspace/tasks.json',
});

export const readTasksJson = vi.fn().mockResolvedValue({
  tasks: [
    { id: 'task-1', title: 'Task 1', description: 'First task', priority: TaskPriority.HIGH, completed: false },
    { id: 'task-2', title: 'Task 2', description: 'Second task', priority: TaskPriority.MEDIUM, completed: false },
    { id: 'task-3', title: 'Task 3', description: 'Completed task', priority: TaskPriority.LOW, completed: true },
  ],
  nextId: 4,
});

export const saveTasksJson = vi.fn().mockResolvedValue(undefined);

export const priorityEmoji = {
  [TaskPriority.HIGH]: '🔴',
  [TaskPriority.MEDIUM]: '🟡',
  [TaskPriority.LOW]: '🟢',
  [TaskPriority.CRITICAL]: '⚠️',
};

export const getCachedTasksData = vi.fn();
export const setCachedTasksData = vi.fn();
