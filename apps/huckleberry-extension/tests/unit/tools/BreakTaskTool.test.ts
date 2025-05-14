import { describe, it, expect, vi } from 'vitest';
import { BreakTaskTool } from '../../../src/tools/BreakTaskTool';

// Mock dependencies
vi.mock('vscode', () => ({
  window: {
    showInformationMessage: vi.fn(),
    createOutputChannel: vi.fn(() => ({
      appendLine: vi.fn(),
      show: vi.fn(),
      dispose: vi.fn(),
    })),
  },
  Uri: { file: (p: string) => ({ fsPath: p }) },
}));
vi.mock('../../../src/handlers/tasks/taskDecompositionHandler', () => ({
  handleBreakTaskRequest: vi.fn(async (_prompt, stream, _toolManager) => {
    await stream.markdown('Subtask 1');
    await stream.markdown('Subtask 2');
  }),
}));

describe('BreakTaskTool', () => {
  it('returns subtasks as markdown', async () => {
    const tool = new BreakTaskTool();
    // Provide a fake toolManager to avoid error
    tool.toolManager = {} as any;
    const result = await tool.execute({ taskId: 'TASK-1' });
    expect(result).toContain('Subtask 1');
    expect(result).toContain('Subtask 2');
  });

  it('returns error message on failure', async () => {
    // Patch handler to throw
    const { handleBreakTaskRequest } = await import('../../../src/handlers/tasks/taskDecompositionHandler');
    (handleBreakTaskRequest as any).mockImplementationOnce(() => { throw new Error('fail'); });
    const tool = new BreakTaskTool();
    tool.toolManager = {} as any;
    const result = await tool.execute({ taskId: 'TASK-FAIL' });
    expect(result).toContain('Failed to break task into subtasks');
  });
});
