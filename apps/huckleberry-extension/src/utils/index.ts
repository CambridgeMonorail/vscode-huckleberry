/**
 * Utils index file
 * Exports all utility functions from the utils directory
 */

// Debug utilities
export { 
  LogLevel,
  logDebug,
  logWithChannel,
  initDebugChannel,
  showDebugChannel,
  DEBUG_ENABLED,
  dumpState,
} from './debugUtils';

// UI helper functions
export {
  streamMarkdown,
  showProgress,
  showInfo,
  showError,
  showWarning,
  confirm,
} from './uiHelpers';

// Parameter utilities
export {
  promptForTaskSelection,
  promptForPrioritySelection,
  promptForTaskAndPriority,
  promptForFilePattern,
  promptForDocumentSelection,
  promptForHelpTopic,
} from './parameterUtils';

// Copilot helper utilities
export {
  CopilotModeInfo,
  detectCopilotMode,
  checkCopilotAvailability,
} from './copilotHelper';
