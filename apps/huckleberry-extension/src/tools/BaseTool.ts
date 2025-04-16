import * as vscode from 'vscode';

/**
 * Base interface for tool parameters
 */
export interface BaseToolParams {
  // Common parameters can be defined here
}

/**
 * Base class for language model tools that can be used by the Task Manager
 */
export abstract class BaseTool<T extends BaseToolParams> {
  /**
   * The unique identifier for this tool
   */
  public abstract readonly id: string;

  /**
   * The display name for this tool
   */
  public abstract readonly name: string;

  /**
   * A description of what the tool does
   */
  public abstract readonly description: string;

  /**
   * Method to execute the tool's functionality
   * @param params The parameters for the tool
   * @returns A promise that resolves with the tool's result
   */
  public abstract execute(params: T): Promise<unknown>;

  /**
   * Shows a confirmation dialog to the user
   * @param message The confirmation message
   * @returns A promise that resolves to true if the user confirms, false otherwise
   */
  protected async confirm(message: string): Promise<boolean> {
    const result = await vscode.window.showInformationMessage(
      message,
      { modal: true },
      'Yes',
      'No'
    );
    return result === 'Yes';
  }

  /**
   * Shows an error message to the user
   * @param message The error message
   */
  protected showError(message: string): void {
    vscode.window.showErrorMessage(`Task Manager: ${message}`);
  }

  /**
   * Shows an information message to the user
   * @param message The information message
   */
  protected showInfo(message: string): void {
    vscode.window.showInformationMessage(`Task Manager: ${message}`);
  }

  /**
   * Logs a debug message to the console
   * @param message The debug message
   * @param data Optional data to log
   */
  protected log(message: string, data?: unknown): void {
    console.log(`[Tool: ${this.id}] ${message}`, data || '');
  }
}