/**
 * Task handlers barrel file
 * Re-exports all task handler functionality to avoid circular dependencies
 */

// Re-export all handlers from the tasks module
export { 
  handleInitializeTaskTracking,
  handleCreateTaskRequest,
  handleScanTodosRequest,
  handleMarkTaskDoneRequest, 
  handleChangeTaskPriorityRequest,
  handlePriorityTaskQuery, 
  handleReadTasksRequest,
  handleParseRequirementsRequest,
  handlePrioritizeTasksRequest,
  handleNextTaskRequest
} from './tasks';