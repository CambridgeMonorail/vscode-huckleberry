import { afterEach, describe, expect, it, vi } from 'vitest';
import { LoopExplorerProvider } from '@huckleberry/extension/providers/LoopExplorerProvider';

describe('LoopExplorerProvider', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns discovery summary counts when refreshed', async () => {
    const discoveryService = {
      discoverLoopFiles: vi.fn().mockResolvedValue([
        {
          uri: { fsPath: '/workspace/.huckleberry/loops/valid.yaml' },
          id: 'valid',
          relativePath: 'valid.yaml',
        },
        {
          uri: { fsPath: '/workspace/.huckleberry/loops/invalid.yaml' },
          id: 'invalid',
          relativePath: 'invalid.yaml',
        },
      ]),
      watchLoopFiles: vi.fn().mockReturnValue({ dispose: vi.fn() }),
    } as const;

    const workflowValidationService = {
      validateFile: vi.fn().mockImplementation(async (uri: { fsPath: string }) => {
        if (uri.fsPath.endsWith('/valid.yaml') || uri.fsPath.endsWith('\\valid.yaml')) {
          return { valid: true, errors: [] };
        }

        return {
          valid: false,
          errors: [
            {
              code: 'WORKFLOW_ID_INVALID',
              message: 'Invalid workflow id.',
              path: 'id',
            },
          ],
        };
      }),
    } as const;

    const provider = new LoopExplorerProvider(discoveryService as never, workflowValidationService as never);
    const summary = await provider.refresh();

    expect(summary).toEqual({
      discoveredCount: 2,
      validCount: 1,
      invalidCount: 1,
    });

    provider.dispose();
  });
});