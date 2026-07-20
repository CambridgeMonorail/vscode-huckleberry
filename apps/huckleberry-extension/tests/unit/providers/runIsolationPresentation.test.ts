import { describe, expect, it } from 'vitest';
import { buildRunIsolationPresentation } from '@huckleberry/extension/providers/runIsolationPresentation';
import { RunnerRunRecord } from '@huckleberry/extension/runner';

function createBaseRun(): RunnerRunRecord {
  return {
    runId: 'run-1',
    loopId: 'lint',
    loopFilePath: '/workspace/.huckleberry/loops/lint.yaml',
    status: 'succeeded',
    startedAt: 100,
    updatedAt: 200,
    completedAt: 200,
  };
}

describe('runIsolationPresentation', () => {
  it('reports missing isolation metadata as warning state', () => {
    const presentation = buildRunIsolationPresentation(createBaseRun());

    expect(presentation.modeLabel).toBe('unknown');
    expect(presentation.warnings).toContain('Isolation metadata is unavailable for this run.');
  });

  it('renders workspace isolation details without warnings', () => {
    const presentation = buildRunIsolationPresentation({
      ...createBaseRun(),
      executionContext: {
        mode: 'workspace',
        workspaceRoot: '/workspace',
        workingDirectory: '/workspace',
      },
    });

    expect(presentation.modeLabel).toBe('workspace');
    expect(presentation.details.some(detail => detail.includes('Workspace root: /workspace'))).toBe(true);
    expect(presentation.warnings).toHaveLength(0);
  });

  it('renders worktree warnings when branch/path metadata is incomplete', () => {
    const presentation = buildRunIsolationPresentation({
      ...createBaseRun(),
      executionContext: {
        mode: 'worktree',
        workspaceRoot: '/workspace',
        workingDirectory: '/workspace/.huckleberry/worktrees/run-1',
      },
    });

    expect(presentation.modeLabel).toBe('worktree');
    expect(presentation.warnings.some(warning => warning.includes('worktree path metadata is missing'))).toBe(true);
    expect(presentation.warnings.some(warning => warning.includes('branch/base-ref metadata is missing'))).toBe(true);
  });
});
