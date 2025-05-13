/**
 * Interface for LanguageModelToolsProvider
 */
import * as vscode from 'vscode';
import { IToolManager } from './IToolManager';

/**
 * Interface for the LanguageModelToolsProvider
 */
export interface ILanguageModelToolsProvider {
  /**
   * Initialize the language model tools provider
   * @param context VS Code extension context
   * @param toolManager The tool manager service
   */
  initialize(context: vscode.ExtensionContext, toolManager: IToolManager): void;

  /**
   * Register all tools with the provided tool manager
   */
  registerTools(): void;

  /**
   * Check if the tools have been registered
   * @returns True if tools are registered
   */
  isInitialized(): boolean;
  /**
   * Handle requests from language models
   * This allows the language model to invoke tools through the Huckleberry extension
   * @param request The request from the language model
   * @returns The result of the tool execution
   */
  handleRequest(request: unknown): Promise<unknown>;

  /**
   * Dispose of any resources used by the provider
   */
  dispose(): void;
}
