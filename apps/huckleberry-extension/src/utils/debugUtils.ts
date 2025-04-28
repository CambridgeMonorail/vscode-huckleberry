/**
 * Debug utilities for the Huckleberry extension
 */
import * as vscode from 'vscode';

/**
 * Debug log levels for different types of messages
 */
export enum LogLevel {
  INFO = 'INFO',
  DEBUG = 'DEBUG',
  WARN = 'WARN',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL'
}

/**
 * Global debug flag to enable/disable detailed logging
 */
export const DEBUG_ENABLED = true;

/**
 * Enhanced debug logging with support for levels and object inspection
 * @param level The severity level of the log message
 * @param message The message to log
 * @param data Optional data to include
 */
export function logDebug(level: LogLevel, message: string, data?: unknown): void {
  if (!DEBUG_ENABLED) {
    return;
  }

  // Prepare emoji for visual distinction
  let emoji = '';
  switch (level) {
    case LogLevel.INFO:
      emoji = 'ℹ️';
      break;
    case LogLevel.DEBUG:
      emoji = '🔍';
      break;
    case LogLevel.WARN:
      emoji = '⚠️';
      break;
    case LogLevel.ERROR:
      emoji = '❌';
      break;
    case LogLevel.CRITICAL:
      emoji = '🚨';
      break;
  }

  // Format the output
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
  const logPrefix = `[HUCKLEBERRY ${level}] ${emoji} ${timestamp}:`;

  if (data !== undefined) {
    try {
      // For objects, try to stringify with proper formatting
      if (typeof data === 'object' && data !== null) {
        console.log(`${logPrefix} ${message}`, JSON.stringify(data, null, 2));
      } else {
        console.log(`${logPrefix} ${message}`, data);
      }
    } catch {
      console.log(`${logPrefix} ${message} [Data could not be stringified]`, data);
    }
  } else {
    console.log(`${logPrefix} ${message}`);
  }
}

/**
 * Debug channel for displaying messages in the output panel
 */
let debugChannel: vscode.OutputChannel | null = null;

/**
 * Initializes the debug channel for the extension
 */
export function initDebugChannel(): vscode.OutputChannel {
  if (!debugChannel) {
    debugChannel = vscode.window.createOutputChannel('Huckleberry Debug');
  }
  return debugChannel;
}

/**
 * Logs to both console and the debug channel
 * @param level The severity level of the log message
 * @param message The message to log
 * @param data Optional data to include
 */
export function logWithChannel(level: LogLevel, message: string, data?: unknown): void {
  logDebug(level, message, data);

  if (!debugChannel) {
    initDebugChannel();
  }

  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
  let channelMessage = `[${timestamp}] [${level}] ${message}`;

  if (data !== undefined) {
    try {
      if (typeof data === 'object' && data !== null) {
        channelMessage += `\n${JSON.stringify(data, null, 2)}`;
      } else {
        channelMessage += ` ${data}`;
      }
    } catch {
      channelMessage += ' [Data could not be stringified]';
    }
  }

  debugChannel?.appendLine(channelMessage);
}

/**
 * Shows the debug output channel
 */
export function showDebugChannel(): void {
  if (!debugChannel) {
    initDebugChannel();
  }
  debugChannel?.show();
}

/**
 * Dumps the current state of the extension for debugging purposes
 * @param context The extension context
 * @param state Object containing the current state to log
 */
export function dumpState(context: vscode.ExtensionContext, state: Record<string, unknown>): void {
  logWithChannel(LogLevel.DEBUG, '📊 Extension State Dump:');
  logWithChannel(LogLevel.DEBUG, `- Extension ID: ${context.extension.id}`);
  logWithChannel(LogLevel.DEBUG, `- Extension Version: ${context.extension.packageJSON.version}`);
  logWithChannel(LogLevel.DEBUG, `- Extension Path: ${context.extensionPath}`);
  logWithChannel(LogLevel.DEBUG, `- Workspace Folders: ${vscode.workspace.workspaceFolders?.length || 0}`);

  if (vscode.workspace.workspaceFolders?.length) {
    vscode.workspace.workspaceFolders.forEach((folder, index) => {
      logWithChannel(LogLevel.DEBUG, `  - [${index}] ${folder.name}: ${folder.uri.fsPath}`);
    });
  }

  logWithChannel(LogLevel.DEBUG, '- Current State:', state);
  showDebugChannel();
}