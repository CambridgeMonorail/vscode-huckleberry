import * as vscode from 'vscode';

/**
 * Utility function to stream markdown with consistent spacing
 * @param stream The chat response stream
 * @param content The markdown content to stream
 */
export async function streamMarkdown(stream: vscode.ChatResponseStream, content: string): Promise<void> {
  // Add a newline before content if it doesn't start with one
  const spacedContent = content.startsWith('\n') ? content : '\n' + content;
  await stream.markdown(spacedContent);
}

/**
 * Utility function to show progress in a consistent and thematic way
 * @param stream The chat response stream
 * @returns A promise that resolves when the progress message is shown
 */
export async function showProgress(stream: vscode.ChatResponseStream): Promise<void> {
  await stream.progress('I\'ll be your huckleberry');
}

/**
 * Shows an information message in VS Code
 * @param message The message to show
 */
export function showInfo(message: string): void {
  vscode.window.showInformationMessage(message);
}

/**
 * Shows an error message in VS Code
 * @param message The error message to show
 */
export function showError(message: string): void {
  vscode.window.showErrorMessage(message);
}

/**
 * Shows a warning message in VS Code
 * @param message The warning message to show
 */
export function showWarning(message: string): void {
  vscode.window.showWarningMessage(message);
}

/**
 * Shows a confirmation dialog to the user
 * @param message The confirmation message
 * @returns A promise that resolves to true if the user confirms, false otherwise
 */
export async function confirm(message: string): Promise<boolean> {
  const result = await vscode.window.showInformationMessage(
    message,
    { modal: true },
    'Yes',
    'No',
  );
  return result === 'Yes';
}