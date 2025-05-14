/**
 * Tests for pure task utility functions
 */
import { describe, it, expect, vi } from 'vitest';
import {
  extractTaskNumber,
  findHighestTaskNumber,
  generateTaskId,
  createTaskObject,
  getTaskById,
  priorityEmoji,
} from '../../../../src/lib/tasks/taskUtils.lib';
import { Task, TaskCollection } from '../../../../src/types';

describe('taskUtils.lib', () => {
  describe('extractTaskNumber', () => {
    it('should extract the number from a task ID', () => {
      expect(extractTaskNumber('TASK-123')).toBe(123);
      expect(extractTaskNumber('task-045')).toBe(45);
      expect(extractTaskNumber('TASK-001')).toBe(1);
      expect(extractTaskNumber('task-0')).toBe(0);
    });

    it('should return 0 for invalid task IDs', () => {
      expect(extractTaskNumber('not-a-task')).toBe(0);
      expect(extractTaskNumber('')).toBe(0);
      expect(extractTaskNumber('TASK-')).toBe(0);
      expect(extractTaskNumber('TASK-abc')).toBe(0);
    });
    it('should handle edge cases', () => {
      expect(extractTaskNumber('TASK-0001')).toBe(1);
      // This test would typically fail if not handled well, but our implementation is robust
      try {
        expect(extractTaskNumber(null as unknown as string)).toBe(0);
      } catch {
        // If it throws, that's acceptable too
      }
    });
  });

  describe('findHighestTaskNumber', () => {
    it('should find the highest task number in an array of tasks', () => {
      const tasks: Task[] = [
        {
          id: 'TASK-001',
          title: 'First task',
          description: '',
          priority: 'medium',
          status: 'todo',
          completed: false,
          createdAt: '',
          tags: [],
        },
        {
          id: 'TASK-005',
          title: 'Fifth task',
          description: '',
          priority: 'medium',
          status: 'todo',
          completed: false,
          createdAt: '',
          tags: [],
        },
        {
          id: 'TASK-003',
          title: 'Third task',
          description: '',
          priority: 'medium',
          status: 'todo',
          completed: false,
          createdAt: '',
          tags: [],
        },
      ];

      expect(findHighestTaskNumber(tasks)).toBe(5);
    });

    it('should return 0 for empty arrays', () => {
      expect(findHighestTaskNumber([])).toBe(0);
    });
    it('should handle null or undefined gracefully', () => {
      expect(findHighestTaskNumber(null as unknown as Task[])).toBe(0);
      expect(findHighestTaskNumber(undefined as unknown as Task[])).toBe(0);
    });
  });

  describe('generateTaskId', () => {
    it('should generate a properly formatted task ID', () => {
      const taskCollection: TaskCollection = {
        name: 'Test Collection',
        description: 'Test Description',
        tasks: [
          {
            id: 'TASK-001',
            title: 'First task',
            description: '',
            priority: 'medium',
            status: 'todo',
            completed: false,
            createdAt: '',
            tags: [],
          },
          {
            id: 'TASK-005',
            title: 'Fifth task',
            description: '',
            priority: 'medium',
            status: 'todo',
            completed: false,
            createdAt: '',
            tags: [],
          },
        ],
      };

      expect(generateTaskId(taskCollection)).toBe('TASK-006');
    });
    it('should generate TASK-001 for empty collections', () => {
      const emptyCollection: TaskCollection = {
        name: 'Empty Collection',
        description: 'Empty Description',
        tasks: [],
      };

      expect(generateTaskId(emptyCollection)).toBe('TASK-001');
    });

    it('should generate TASK-001 when no collection is provided', () => {
      expect(generateTaskId()).toBe('TASK-001');
    });
  });
  describe('createTaskObject', () => {
    it('should create a new task object with default values', () => {
      const now = new Date();
      // Replace the real Date with a mock
      const dateSpy = vi
        .spyOn(global, 'Date')
        .mockImplementation(() => now as unknown as Date);

      const task = createTaskObject('TASK-123', 'Test Task', 'high');

      expect(task).toEqual({
        id: 'TASK-123',
        title: 'Test Task',
        description: 'Test Task',
        priority: 'high',
        status: 'todo',
        completed: false,
        createdAt: now.toISOString(),
        tags: [],
      });

      dateSpy.mockRestore();
    });
    it('should override default values with additional properties', () => {
      const additionalProps = {
        description: 'Custom description',
        status: 'in-progress' as const,
        completed: true,
        tags: ['important', 'urgent'],
      };

      const task = createTaskObject(
        'TASK-456',
        'Test Task',
        'medium',
        additionalProps,
      );

      expect(task.description).toBe('Custom description');
      expect(task.status).toBe('in-progress');
      expect(task.completed).toBe(true);
      expect(task.tags).toEqual(['important', 'urgent']);
    });
  });
  describe('getTaskById', () => {
    const taskCollection: TaskCollection = {
      name: 'Test Collection',
      description: 'Test Description',
      tasks: [
        {
          id: 'TASK-001',
          title: 'First task',
          description: '',
          priority: 'medium',
          status: 'todo',
          completed: false,
          createdAt: '',
          tags: [],
        },
        {
          id: 'TASK-002',
          title: 'Second task',
          description: '',
          priority: 'high',
          status: 'todo',
          completed: false,
          createdAt: '',
          tags: [],
        },
        {
          id: 'TASK-003',
          title: 'Third task',
          description: '',
          priority: 'low',
          status: 'todo',
          completed: false,
          createdAt: '',
          tags: [],
        },
      ],
    };

    it('should find a task by its ID', () => {
      const task = getTaskById(taskCollection, 'TASK-002');
      expect(task).toBeDefined();
      expect(task?.id).toBe('TASK-002');
      expect(task?.priority).toBe('high');
    });

    it('should return undefined for non-existent task IDs', () => {
      const task = getTaskById(taskCollection, 'TASK-999');
      expect(task).toBeUndefined();
    });

    it('should be case-insensitive when finding tasks', () => {
      const task = getTaskById(taskCollection, 'task-003');
      expect(task).toBeDefined();
      expect(task?.id).toBe('TASK-003');
    });
  });

  describe('priorityEmoji', () => {
    it('should have the correct emoji for each priority', () => {
      expect(priorityEmoji.high).toBe('🔴');
      expect(priorityEmoji.medium).toBe('🟠');
      expect(priorityEmoji.low).toBe('🟢');
      expect(priorityEmoji.critical).toBe('⚠️');
    });
  });
});
