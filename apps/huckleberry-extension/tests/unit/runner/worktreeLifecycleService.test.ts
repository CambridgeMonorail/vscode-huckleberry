import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  GitCommandRunner,
  WorktreeLifecycleService,
} from '@huckleberry/extension/runner/worktreeLifecycleService';

describe('WorktreeLifecycleService', () => {
  let sandboxDirectory: string;
  let workspaceRoot: string;
  let gitRunner: GitCommandRunner;
  let runGitMock: ReturnType<typeof vi.fn>;
  let nowValue: number;

  beforeEach(async () => {
    sandboxDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'huckleberry-worktree-service-'));
    workspaceRoot = path.join(sandboxDirectory, 'workspace');
    await fs.mkdir(workspaceRoot, { recursive: true });

    runGitMock = vi.fn(async (args: string[]) => {
      if (args[0] === 'worktree' && args[1] === 'add') {
        const worktreePath = args[2];
        await fs.mkdir(worktreePath, { recursive: true });
      }

      if (args[0] === 'worktree' && args[1] === 'remove') {
        const worktreePath = args[3];
        await fs.rm(worktreePath, { recursive: true, force: true });
      }

      return { stdout: '', stderr: '' };
    });

    gitRunner = {
      runGit: (args, cwd) => runGitMock(args, cwd),
    };

    nowValue = 1_000;
  });

  afterEach(async () => {
    await fs.rm(sandboxDirectory, { recursive: true, force: true });
  });

  it('provisions a worktree and persists run metadata mapping', async () => {
    const service = new WorktreeLifecycleService(gitRunner, () => nowValue);

    const metadata = await service.provisionWorktree({
      runId: 'run-1',
      loopId: 'lint',
      workspaceRoot,
      baseRef: 'main',
    });

    expect(metadata.runId).toBe('run-1');
    expect(metadata.worktreePath).toContain(path.join('.huckleberry', 'worktrees'));
    expect(metadata.active).toBe(true);

    const statePath = path.join(workspaceRoot, '.huckleberry', 'runs', 'worktree-metadata.json');
    const content = await fs.readFile(statePath, 'utf8');
    expect(content).toContain('run-1');
    expect(runGitMock).toHaveBeenCalledWith(['rev-parse', '--is-inside-work-tree'], workspaceRoot);
    expect(runGitMock).toHaveBeenCalledWith(['worktree', 'add', metadata.worktreePath, 'main'], workspaceRoot);
  });

  it('reuses an existing active worktree for subsequent runs when requested', async () => {
    const service = new WorktreeLifecycleService(gitRunner, () => nowValue);

    const first = await service.provisionWorktree({
      runId: 'run-1',
      loopId: 'test',
      workspaceRoot,
      baseRef: 'HEAD',
    });

    nowValue = 2_000;
    const second = await service.provisionWorktree({
      runId: 'run-2',
      loopId: 'test',
      workspaceRoot,
      baseRef: 'HEAD',
      reuseExisting: true,
    });

    expect(second.worktreePath).toBe(first.worktreePath);
    expect(second.reused).toBe(true);

    const worktreeAddCalls = runGitMock.mock.calls.filter(call => call[0][0] === 'worktree' && call[0][1] === 'add');
    expect(worktreeAddCalls).toHaveLength(1);
  });

  it('preserves shared worktrees during cleanup when another active run is mapped', async () => {
    const service = new WorktreeLifecycleService(gitRunner, () => nowValue);

    const first = await service.provisionWorktree({
      runId: 'run-1',
      loopId: 'repair',
      workspaceRoot,
      reuseExisting: false,
    });

    await service.provisionWorktree({
      runId: 'run-2',
      loopId: 'repair',
      workspaceRoot,
      reuseExisting: true,
    });

    const result = await service.cleanupRunWorktree('run-1', workspaceRoot);
    expect(result.removed).toBe(false);
    expect(result.preservedForActiveRuns).toBe(true);
    expect(result.worktreePath).toBe(first.worktreePath);
  });

  it('detects orphaned worktree paths and missing mapped paths', async () => {
    const service = new WorktreeLifecycleService(gitRunner, () => nowValue);

    const metadata = await service.provisionWorktree({
      runId: 'run-1',
      loopId: 'lint',
      workspaceRoot,
    });

    await fs.rm(metadata.worktreePath, { recursive: true, force: true });

    const unmanagedPath = path.join(workspaceRoot, '.huckleberry', 'worktrees', 'orphan-path');
    await fs.mkdir(unmanagedPath, { recursive: true });

    const orphans = await service.detectOrphanedWorktrees(workspaceRoot);

    expect(orphans.some(orphan => orphan.reason === 'missing-path' && orphan.worktreePath === metadata.worktreePath)).toBe(true);
    expect(orphans.some(orphan => orphan.reason === 'untracked-path' && orphan.worktreePath === unmanagedPath)).toBe(true);
  });

  it('surfaces actionable setup errors when git worktree provisioning fails', async () => {
    const failingRunner: GitCommandRunner = {
      runGit: vi.fn(async (args: string[]) => {
        if (args[0] === 'worktree' && args[1] === 'add') {
          throw new Error('fatal: invalid reference');
        }

        return { stdout: '', stderr: '' };
      }),
    };

    const service = new WorktreeLifecycleService(failingRunner, () => nowValue);

    await expect(
      service.provisionWorktree({
        runId: 'run-fail',
        loopId: 'lint',
        workspaceRoot,
        baseRef: 'does-not-exist',
      }),
    ).rejects.toThrow("Verify git worktree support and ref 'does-not-exist'");
  });
});
