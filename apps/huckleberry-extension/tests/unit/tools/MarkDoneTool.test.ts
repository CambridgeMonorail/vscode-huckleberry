import { describe, it, expect, vi } from 'vitest';
import { MarkDoneTool } from '../../../src/tools/MarkDoneTool';
import * as fs from 'fs';

// Mock fs and vscode APIs for isolated logic testing
vi.mock('fs', () => ({
  existsSync: vi.fn(() => true),
  promises: {
    readFile: vi.fn(async () => '- [ ] Task 1\n- [x] Task 2'),
    writeFile: vi.fn(async () => undefined),
  },
}));
vi.mock('path', async () => await vi.importActual('path'));
vi.mock('vscode', () => ({
  workspace: {
    workspaceFolders: [{ uri: { fsPath: '/workspace' } }],
    fs: {
      readFile: vi.fn(),
      writeFile: vi.fn(),
      createDirectory: vi.fn(),
    },
  },
  window: {
    showInformationMessage: vi.fn(async () => 'Yes'),
    showErrorMessage: vi.fn(),
  },
  Uri: { file: (p: string) => ({ fsPath: p }) },
}));

describe('MarkDoneTool', () => {
  it('marks a markdown task as done', async () => {
    const tool = new MarkDoneTool();
    const result = await tool.execute({
      filePath: 'test.md',
      taskIdentifier: 'Task 1',
      isDone: true,
    });
    expect(result.success).toBe(true);
    expect(result.taskIdentifier).toBe('Task 1');
    expect(result.isDone).toBe(true);
  });

  it('marks a markdown task as undone', async () => {
    const tool = new MarkDoneTool();
    const result = await tool.execute({
      filePath: 'test.md',
      taskIdentifier: 'Task 2',
      isDone: false,
    });
    expect(result.success).toBe(true);
    expect(result.taskIdentifier).toBe('Task 2');
    expect(result.isDone).toBe(false);
  });

  it('returns success: false if no matching task', async () => {
    // Patch readFile to return content with no match
    (fs.promises.readFile as any).mockResolvedValueOnce('- [ ] Task X');
    const tool = new MarkDoneTool();
    const result = await tool.execute({
      filePath: 'test.md',
      taskIdentifier: 'NotFound',
      isDone: true,
    });
    expect(result.success).toBe(false);
  });

  it('throws if file does not exist', async () => {
    (fs.existsSync as any).mockReturnValueOnce(false);
    const tool = new MarkDoneTool();
    await expect(tool.execute({
      filePath: 'missing.md',
      taskIdentifier: 'Task',
      isDone: true,
    })).rejects.toThrow('File not found');
  });
});
