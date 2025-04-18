/**
 * Task handlers index file
 * Exports all task handler functionality in a unified API
 */

// Export all handlers from their respective modules
export { handleInitializeTaskTracking } from './initHandler';
export { handleCreateTaskRequest } from './createTaskHandler';
export { handleScanTodosRequest } from './todoScanHandler';
export { handleMarkTaskDoneRequest, handleChangeTaskPriorityRequest } from './statusHandler';
export { handlePriorityTaskQuery, handleReadTasksRequest } from './queryHandler';

// Re-export utility functions that might be useful for other modules
export { 
  priorityEmoji,
  recommendAgentModeInChat,
  getWorkspacePaths,
  readTasksJson,
  writeTasksJson,
  generateTaskId,
  createTaskObject
} from './taskUtils';