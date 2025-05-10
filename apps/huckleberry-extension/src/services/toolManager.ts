import { BaseTool, BaseToolParams } from '../tools';

/**
 * Represents the possible return types from tool execution
 */
export type ToolResult = unknown;

/**
 * Service class to manage language model tools
 */
export class ToolManager {
  private tools = new Map<string, BaseTool<BaseToolParams>>();

  /**
   * Register a tool with the manager
   * @param tool The tool to register
   * @returns The tool manager instance for method chaining
   */
  public registerTool<P extends BaseToolParams>(tool: BaseTool<P>): ToolManager {
    // Safe to cast since P extends BaseToolParams
    this.tools.set(tool.id, tool as unknown as BaseTool<BaseToolParams>);
    console.log(`Registered tool: ${tool.id}`);
    return this;
  }

  /**
   * Get a tool by ID
   * @param id The tool ID to retrieve
   * @returns The tool instance or undefined if not found
   */
  public getTool<P extends BaseToolParams>(id: string): BaseTool<P> | undefined {
    return this.tools.get(id) as BaseTool<P> | undefined;
  }

  /**
   * Execute a tool by ID with the provided parameters
   * @param id The ID of the tool to execute
   * @param params Parameters to pass to the tool
   * @returns The result of the tool execution
   */
  public async executeTool<P extends BaseToolParams>(id: string, params: P): Promise<ToolResult> {
    const tool = this.getTool<P>(id);
    if (!tool) {
      throw new Error(`Tool not found: ${id}`);
    }

    return await tool.execute(params);
  }

  /**
   * Get all registered tools
   * @returns Array of all registered tools
   */
  public getTools(): BaseTool<BaseToolParams>[] {
    return Array.from(this.tools.values());
  }
}