import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import * as vscode from 'vscode';
import { LoopDiscoveryService, buildLoopId, isSupportedLoopFilePath } from '@huckleberry/extension/services/loopDiscoveryService';

describe('loopDiscoveryService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('isSupportedLoopFilePath', () => {
    it('accepts json/yaml/yml loop files', () => {
      expect(isSupportedLoopFilePath('build.json')).toBe(true);
      expect(isSupportedLoopFilePath('build.yaml')).toBe(true);
      expect(isSupportedLoopFilePath('build.yml')).toBe(true);
    });

    it('rejects unsupported file extensions', () => {
      expect(isSupportedLoopFilePath('build.md')).toBe(false);
      expect(isSupportedLoopFilePath('build.ts')).toBe(false);
    });
  });

  describe('buildLoopId', () => {
    it('removes extension and normalizes separators', () => {
      expect(buildLoopId('ci/validate.yml')).toBe('ci/validate');
      expect(buildLoopId('ci\\validate.yml')).toBe('ci/validate');
    });
  });

  describe('discoverLoopFiles', () => {
    it('returns sorted discovered loop files from nested directories', async () => {
      const service = new LoopDiscoveryService();

      (vscode.workspace.fs.stat as Mock).mockResolvedValue({ type: 2 });
      (vscode.workspace.fs.readDirectory as Mock).mockImplementation(async (uri: vscode.Uri) => {
        const normalizedPath = uri.fsPath.replace(/\\/g, '/');

        if (normalizedPath.endsWith('/.huckleberry/loops')) {
          return [
            ['b-loop.yaml', 1],
            ['a-loop.json', 1],
            ['nested', 2],
          ];
        }

        if (normalizedPath.endsWith('/.huckleberry/loops/nested')) {
          return [
            ['z-loop.yml', 1],
            ['ignore.txt', 1],
          ];
        }

        return [];
      });

      const result = await service.discoverLoopFiles();

      expect(result.map(item => item.relativePath)).toEqual([
        'a-loop.json',
        'b-loop.yaml',
        'nested/z-loop.yml',
      ]);
      expect(result.map(item => item.id)).toEqual([
        'a-loop',
        'b-loop',
        'nested/z-loop',
      ]);
    });

    it('returns empty when loops directory does not exist', async () => {
      const service = new LoopDiscoveryService();

      (vscode.workspace.fs.stat as Mock).mockRejectedValue(new Error('missing'));

      const result = await service.discoverLoopFiles();

      expect(result).toEqual([]);
    });
  });
});
