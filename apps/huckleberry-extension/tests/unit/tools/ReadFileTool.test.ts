import { describe, it, expect, vi } from 'vitest';
import { ReadFileTool } from '../../../src/tools/ReadFileTool';
import * as vscode from 'vscode';

vi.mock('vscode', () => ({
  workspace: {
    fs: {
      readFile: vi.fn(async () => new Uint8Array(Buffer.from('file content'))),
    },
  },
  Uri: { file: (p: string) => ({ fsPath: p }) },
}));

describe('ReadFileTool', () => {
  it('reads file content as string', async () => {
    const tool = new ReadFileTool();
    const result = await tool.execute({ path: '/test.txt' });
    expect(result).toBe('file content');
  });

  it('throws on read error', async () => {
    (vscode.workspace.fs.readFile as any).mockRejectedValueOnce(new Error('fail'));
    const tool = new ReadFileTool();
    await expect(tool.execute({ path: '/fail.txt' })).rejects.toThrow('fail');
  });
});
