/**
 * Command handlers for Huckleberry extension
 * Centralizes all command handler implementations
 */
import { logWithChannel, LogLevel, showInfo, checkCopilotAvailability } from '../../utils';
import { isWorkspaceAvailable, notifyNoWorkspace } from '../chatHandler';
import { getExtensionState } from '../../services/extensionStateService';

// Re-export all command handlers
export { manageTasks } from './manageTasks';
export { prioritizeTasks } from './prioritizeTasks';
export { changeTaskPriority } from './changeTaskPriority';
export { checkCopilotAgentMode } from './checkCopilotAgentMode';
export { testHuckleberryChat } from './testHuckleberryChat';
export { forceRefreshChatParticipants } from './forceRefreshChatParticipants';
export { getNextTask } from './getNextTask';
export { getHelp } from './getHelp';
export { createTask } from './createTask';
export { listTasks } from './listTasks';
export { markTaskComplete } from './markTaskComplete';
export { scanTodos } from './scanTodos';
export { parseRequirementsDocument } from './parseRequirementsDocument';
export { openTaskExplorer } from './openTaskExplorer';
export { createSubtasks } from './createSubtasks';
export { enrichTask } from './enrichTask';
export { exportTasks } from './exportTasks';
export { initializeTaskTracking, initialiseTaskTracking } from './initializeTaskTracking';

/**
 * Shared utilities for command handlers
 */
export const commandUtils = {
  isWorkspaceAvailable,
  notifyNoWorkspace,
  checkCopilotAvailability,
  showInfo,
  logWithChannel,
  LogLevel,
  getExtensionState,
};