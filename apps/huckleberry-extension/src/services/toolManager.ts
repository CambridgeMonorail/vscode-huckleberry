import { BaseTool } from '../tools/BaseTool';

/**
 * Service class to manage language model tools
 */
export class ToolManager {
  private tools: Map<string, BaseTool<any>> = new Map();
  
  /**
   * Register a tool with the manager
   * @param tool The tool to register
   */
  public registerTool(tool: BaseTool<any>): void {
    this.tools.set(tool.id, tool);
    console.log(`Registered tool: ${tool.id}`);
  }
  
  /**
   * Get a tool by ID
   * @param id The tool ID to retrieve
   * @returns The tool instance or undefined if not found
   */
  public getTool(id: string): BaseTool<any> | undefined {
    return this.tools.get(id);
  }
  
  /**
   * Execute a tool by ID with the provided parameters
   * @param id The ID of the tool to execute
   * @param params Parameters to pass to the tool
   * @returns The result of the tool execution
   */
  public async executeTool(id: string, params: any): Promise<any> {
    const tool = this.getTool(id);
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