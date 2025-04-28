import * as vscode from 'vscode';
import { taskmanagerConfig, TaskPriority } from './types';

// Default configuration for Huckleberry
export const DEFAULT_CONFIG: taskmanagerConfig = {
  defaultTasksLocation: 'tasks',
  taskFileTemplate: 'markdown',
  defaultTaskPriority: 'medium',
};

/**
 * Get the extension configuration
 * @returns The Huckleberry configuration
 */
export function getConfiguration(): taskmanagerConfig {
  console.log('⚙️ Loading Huckleberry configuration...');
  const config = vscode.workspace.getConfiguration('huckleberry.taskmanager');
  
  const defaultPriority = (config.get('defaultTaskPriority') || DEFAULT_CONFIG.defaultTaskPriority) as string;
  const taskPriority = defaultPriority as TaskPriority;
  
  const finalConfig: taskmanagerConfig = {
    defaultTasksLocation: config.get('defaultTasksLocation') as string || DEFAULT_CONFIG.defaultTasksLocation,
    taskFileTemplate: (config.get('taskFileTemplate') || DEFAULT_CONFIG.taskFileTemplate) as 'markdown' | 'json',
    defaultTaskPriority: taskPriority,
    defaultDueDate: config.get('defaultDueDate') || 'none',
    customDueDateDays: config.get('customDueDateDays') || 0,
  };
  
  console.log('📋 Loaded configuration:', finalConfig);
  return finalConfig;
}

// System prompt for Huckleberry assistant
export const SYSTEM_PROMPT = `You are Huckleberry, a specialized assistant that helps users manage tasks and project requirements.
Your responsibilities include:
- Helping users track their tasks and project status
- Creating, updating, and organizing tasks
- Providing summaries and reports on project progress
- Offering suggestions for task prioritization

Always be concise, helpful, and focus on task management. If asked about topics unrelated to task management,
politely redirect the conversation back to task-related discussions.`;