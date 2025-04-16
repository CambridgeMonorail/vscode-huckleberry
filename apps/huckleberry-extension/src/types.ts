/**
 * Type definitions for the Huckleberry Task Manager extension
 */

/**
 * Represents the priority level of a task
 */
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

/**
 * Represents the current status of a task
 */
export type TaskStatus = 'backlog' | 'todo' | 'in-progress' | 'review' | 'blocked' | 'completed';

/**
 * Interface for a basic task object
 */
export interface Task {
  /**
   * Unique identifier for the task
   */
  id: string;
  
  /**
   * Short title/summary of the task
   */
  title: string;
  
  /**
   * Detailed description of the task
   */
  description?: string;
  
  /**
   * Priority level of the task
   */
  priority?: TaskPriority;
  
  /**
   * Current status of the task
   */
  status?: TaskStatus;
  
  /**
   * Flag indicating if the task is completed
   */
  completed: boolean;
  
  /**
   * Due date for the task (ISO string format)
   */
  dueDate?: string;
  
  /**
   * Person assigned to the task
   */
  assignee?: string;
  
  /**
   * Array of labels/tags associated with the task
   */
  tags?: string[];
  
  /**
   * Creation date of the task (ISO string format)
   */
  createdAt?: string;
  
  /**
   * Last modification date of the task (ISO string format)
   */
  updatedAt?: string;
}

/**
 * Interface for a task collection (used in JSON task files)
 */
export interface TaskCollection {
  /**
   * Name or title of the task collection
   */
  name?: string;
  
  /**
   * Description of the task collection
   */
  description?: string;
  
  /**
   * Array of tasks in the collection
   */
  tasks: Task[];
}

/**
 * Interface for a Markdown task item (used when parsing markdown files)
 */
export interface MarkdownTaskItem {
  /**
   * The raw text of the task from markdown
   */
  text: string;
  
  /**
   * Whether the task is checked/completed
   */
  checked: boolean;
  
  /**
   * The heading/section the task belongs to (if any)
   */
  section?: string;
  
  /**
   * The line number where the task appears in the file
   */
  lineNumber: number;
}

/**
 * Configuration options for the Task Manager
 */
export interface TaskMasterConfig {
  /**
   * Default location for task files
   */
  defaultTasksLocation: string;
  
  /**
   * Template to use when creating new task files
   */
  taskFileTemplate: 'markdown' | 'json';
  
  /**
   * Default priority for new tasks with unspecified priority
   */
  defaultTaskPriority: TaskPriority;
  
  /**
   * Default setting for due dates on new tasks
   */
  defaultDueDate?: 'none' | 'tomorrow' | 'nextWeek' | 'twoWeeks' | 'custom';
  
  /**
   * Number of days for custom due date setting
   */
  customDueDateDays?: number;
}