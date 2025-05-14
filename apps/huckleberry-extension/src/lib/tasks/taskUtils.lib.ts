/**
 * Pure logic functions for task manipulation and utilities
 * These functions don't depend on VS Code API or other external systems
 */
import { Task, TaskCollection, TaskPriority, TaskStatus } from '../../types';

/**
 * Interface for the priority emoji mapping
 */
export interface PriorityEmojiMap {
  high: string;
  medium: string;
  low: string;
  critical: string;
  [key: string]: string;
}

/**
 * Emoji mapping for different task priorities
 */
export const priorityEmoji: PriorityEmojiMap = {
  high: '🔴',
  medium: '🟠',
  low: '🟢',
  critical: '⚠️',
};

/**
 * Extracts the numeric part of a task ID and returns it as a number
 * @param taskId The task ID string (e.g., "TASK-042")
 * @returns The numeric part as a number (e.g., 42), or 0 if parsing fails
 */
export function extractTaskNumber(taskId: string): number {
  try {
    const match = taskId.match(/TASK-(\d+)/i);
    if (match && match[1]) {
      return parseInt(match[1], 10);
    }
  } catch {
    // Don't log here - pure function should not have side effects
    // Caller can handle logging if needed
  }
  return 0;
}

/**
 * Finds the highest task ID number from the existing tasks
 * @param tasks Array of tasks to search through
 * @returns The highest task number found, or 0 if no valid task IDs exist
 */
export function findHighestTaskNumber(tasks: Task[]): number {
  if (!tasks || tasks.length === 0) {
    return 0;
  }

  let highest = 0;
  for (const task of tasks) {
    const taskNumber = extractTaskNumber(task.id);
    if (taskNumber > highest) {
      highest = taskNumber;
    }
  }

  return highest;
}

/**
 * Creates a new task ID by incrementing the highest existing ID
 * @param tasksData Optional task collection to find the highest existing ID
 * @returns A sequential task ID in the format TASK-XXX with consistent digit formatting
 */
export function generateTaskId(tasksData?: TaskCollection): string {
  let nextNumber = 1; // Default start

  if (tasksData && tasksData.tasks) {
    // Find the highest existing task number and increment
    const highestNumber = findHighestTaskNumber(tasksData.tasks);
    nextNumber = highestNumber + 1;
  }

  // Determine the number of digits required for consistent formatting
  const digitCount = Math.max(3, String(nextNumber).length);
  return `TASK-${String(nextNumber).padStart(digitCount, '0')}`;
}

/**
 * Creates a new task object
 * @param id Task ID
 * @param title Task title/description
 * @param priority Task priority
 * @param additionalProps Additional task properties
 * @returns A new Task object
 */
export function createTaskObject(
  id: string,
  title: string,
  priority: TaskPriority,
  additionalProps: Partial<Task> = {},
): Task {
  return {
    id,
    title,
    description: title,
    priority,
    status: 'todo' as TaskStatus,
    completed: false,
    createdAt: new Date().toISOString(),
    tags: [],
    ...additionalProps,
  };
}

/**
 * Finds a task by its ID in the task collection
 * @param tasksData The task collection to search within
 * @param taskId The task ID to look for
 * @returns The found task, or undefined if not found
 */
export function getTaskById(
  tasksData: TaskCollection,
  taskId: string,
): Task | undefined {
  // Normalize the task ID for comparison (uppercase)
  const normalizedTaskId = taskId.toUpperCase();
  // Find the task with the matching ID
  return tasksData.tasks.find(task => task.id.toUpperCase() === normalizedTaskId);
}
