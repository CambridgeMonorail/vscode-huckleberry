import { describe, it, expect, vi } from 'vitest';
import { WriteFileTool } from '../../../src/tools/WriteFileTool';
import * as vscode from 'vscode';

vi.mock('vscode', () => ({
  workspace: {
    fs: {
      writeFile: vi.fn(async () => undefined),
      createDirectory: vi.fn(async () => undefined),
    },
  },
  Uri: { file: (p: string) => ({ fsPath: p }) },
}));
vi.mock('path', async () => await vi.importActual('path'));

describe('WriteFileTool', () => {
  it('writes file content', async () => {
    const tool = new WriteFileTool();
    await expect(tool.execute({ path: '/test.txt', content: 'abc' })).resolves.toBeUndefined();
    expect(vscode.workspace.fs.writeFile).toHaveBeenCalled();
  });

  it('creates parent directories if requested', async () => {
    const tool = new WriteFileTool();
    await tool.execute({ path: '/dir/file.txt', content: 'abc', createParentDirectories: true });
    expect(vscode.workspace.fs.createDirectory).toHaveBeenCalled();
  });

  it('throws on write error', async () => {
    (vscode.workspace.fs.writeFile as any).mockRejectedValueOnce(new Error('fail'));
    const tool = new WriteFileTool();
    await expect(tool.execute({ path: '/fail.txt', content: 'abc' })).rejects.toThrow('fail');
  });
});
