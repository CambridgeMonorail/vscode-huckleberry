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
 * Interface for source information in a task
 */
export interface TaskSource {
  /**
   * Relative file path where the task originated
   */
  file: string;

  /**
   * Line number in the file
   */
  line: number;

  /**
   * Context indicating where this task came from (e.g., 'requirements', 'todo', etc.)
   */
  context?: string;

  /**
   * Full URI to the source file for linking
   */
  uri?: string;

  /**
   * Section or heading where the task was found
   */
  section?: string;
}

/**
 * Interface for additional task metadata
 */
export interface TaskMetadata {
  /**
   * Source document path if created from a document
   */
  sourceDocument?: string;

  /**
   * Timestamp when the task was extracted
   */
  extractedAt?: string;

  /**
   * Any additional metadata
   */
  [key: string]: unknown;
}

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
   * Completion date of the task (ISO string format)
   */
  completedAt?: string;

  /**
   * Array of task IDs that are subtasks of this task
   */
  subtasks?: string[];

  /**
   * ID of the parent task if this is a subtask
   */
  parentTaskId?: string;

  /**
   * Source information for tasks created from code or documents
   */
  source?: TaskSource;

  /**
   * Additional metadata about the task
   */
  metadata?: TaskMetadata;

  /**
   * Additional enriched content from context analysis
   */
  enrichedContent?: {
    /**
     * Enhanced description with broader context
     */
    enhancedDescription?: string;

    /**
     * Related code snippets or document sections
     */
    contextualContent?: string;

    /**
     * When the content was last enriched
     */
    enrichedAt?: string;

    /**
     * What type of enrichment was performed (code-context, requirements-context, etc)
     */
    enrichmentType?: string;
  };
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
export interface taskmanagerConfig {
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