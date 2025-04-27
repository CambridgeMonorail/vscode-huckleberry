import { BaseTool, BaseToolParams } from '../tools/BaseTool';

/**
 * Represents the possible return types from tool execution
 */
export type ToolResult = Record<string, unknown> | string | boolean | number | null | void | unknown;

/**
 * Service class to manage language model tools
 */
export class ToolManager {
  private tools: Map<string, BaseTool<any>> = new Map();
  
  /**
   * Register a tool with the manager
   * @param tool The tool to register
   * @returns The tool manager instance for method chaining
   */
  public registerTool<T extends BaseToolParams>(tool: BaseTool<T>): ToolManager {
    this.tools.set(tool.id, tool);
    console.log(`Registered tool: ${tool.id}`);
    return this;
  }
  
  /**
   * Get a tool by ID
   * @param id The tool ID to retrieve
   * @returns The tool instance or undefined if not found
   */
  public getTool<T extends BaseToolParams = BaseToolParams>(id: string): BaseTool<T> | undefined {
    return this.tools.get(id) as BaseTool<T> | undefined;
  }
  
  /**
   * Execute a tool by ID with the provided parameters
   * @param id The ID of the tool to execute
   * @param params Parameters to pass to the tool
   * @returns The result of the tool execution
   */
  public async executeTool<T extends BaseToolParams>(id: string, params: T): Promise<ToolResult> {
    const tool = this.getTool<T>(id);
    if (!tool) {
      throw new Error(`Tool not found: ${id}`);
    }
    
    return await tool.execute(params);
  }

  /**
   * Get all registered tools
   * @returns Array of all registered tools
   */
  public getTools(): BaseTool<any>[] {
    return Array.from(this.tools.values());
  }
}