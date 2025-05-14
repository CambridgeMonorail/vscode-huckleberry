/**
 * Interface for ToolManager service
 */
import { BaseTool, BaseToolParams } from '../tools';

/**
 * Represents the possible return types from tool execution
 */
export type ToolResult = unknown;

/**
 * Interface for the ToolManager service
 */
export interface IToolManager {
  /**
   * Register a tool with the manager
   * @param tool The tool to register
   * @returns The tool manager instance for method chaining
   */
  registerTool<P extends BaseToolParams>(tool: BaseTool<P>): IToolManager;

  /**
   * Get a tool by ID
   * @param id The tool ID to retrieve
   * @returns The tool instance or undefined if not found
   */
  getTool<P extends BaseToolParams>(id: string): BaseTool<P> | undefined;

  /**
   * Execute a tool by ID with the provided parameters
   * @param id The ID of the tool to execute
   * @param params Parameters to pass to the tool
   * @returns The result of the tool execution
   */
  executeTool<P extends BaseToolParams>(id: string, params: P): Promise<ToolResult>;
  
  /**
   * Get all registered tools
   * @returns An array of tool IDs
   */
  getAllTools(): string[];
}
