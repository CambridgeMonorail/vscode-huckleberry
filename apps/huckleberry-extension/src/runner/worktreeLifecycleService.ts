import * as fs from 'fs/promises';
import * as path from 'path';
import { execFile } from 'child_process';

export interface WorktreeProvisionRequest {
  runId: string;
  loopId: string;
  workspaceRoot: string;
  baseRef?: string;
  reuseExisting?: boolean;
}

export interface WorktreeRunMetadata {
  runId: string;
  loopId: string;
  workspaceRoot: string;
  baseRef: string;
  worktreePath: string;
  createdAt: number;
  lastUsedAt: number;
  active: boolean;
  reused: boolean;
}

export interface WorktreeCleanupResult {
  runId: string;
  removed: boolean;
  preservedForActiveRuns: boolean;
  worktreePath?: string;
}

export interface WorktreeOrphanRecord {
  worktreePath: string;
  reason: 'missing-path' | 'untracked-path';
}

export interface GitCommandRunner {
  runGit(args: string[], cwd: string): Promise<{ stdout: string; stderr: string }>;
}

interface WorktreeStateFile {
  version: 1;
  runs: Record<string, WorktreeRunMetadata>;
}

const STATE_FILE_NAME = 'worktree-metadata.json';

export class WorktreeLifecycleService {
  constructor(
    private readonly gitRunner: GitCommandRunner = new DefaultGitCommandRunner(),
    private readonly now: () => number = () => Date.now(),
  ) {}

  async provisionWorktree(request: WorktreeProvisionRequest): Promise<WorktreeRunMetadata> {
    const normalizedWorkspaceRoot = path.resolve(request.workspaceRoot);
    const statePath = this.getStateFilePath(normalizedWorkspaceRoot);
    const worktreesRoot = this.getWorktreesRoot(normalizedWorkspaceRoot);

    await fs.mkdir(worktreesRoot, { recursive: true });
    const state = await this.readState(statePath);

    const existingRun = state.runs[request.runId];
    if (existingRun && existingRun.active && await this.pathExists(existingRun.worktreePath)) {
      return existingRun;
    }

    const baseRef = request.baseRef ?? 'HEAD';
    const timestamp = this.now();

    if (request.reuseExisting) {
      const reusable = Object.values(state.runs).find(entry => {
        return entry.active
          && entry.loopId === request.loopId
          && entry.baseRef === baseRef
          && path.resolve(entry.workspaceRoot) === normalizedWorkspaceRoot;
      });

      if (reusable && await this.pathExists(reusable.worktreePath)) {
        const metadata: WorktreeRunMetadata = {
          ...reusable,
          runId: request.runId,
          lastUsedAt: timestamp,
          reused: true,
          active: true,
        };

        state.runs[request.runId] = metadata;
        await this.writeState(statePath, state);
        return metadata;
      }
    }

    await this.ensureGitRepository(normalizedWorkspaceRoot);

    const worktreePath = path.join(worktreesRoot, `${sanitizeSegment(request.loopId)}-${sanitizeSegment(request.runId).slice(0, 8)}`);

    try {
      await this.gitRunner.runGit(['worktree', 'add', worktreePath, baseRef], normalizedWorkspaceRoot);
    } catch (error) {
      throw new Error(
        `Failed to create isolated worktree at '${worktreePath}'. Verify git worktree support and ref '${baseRef}'. ${stringifyError(error)}`,
      );
    }

    const metadata: WorktreeRunMetadata = {
      runId: request.runId,
      loopId: request.loopId,
      workspaceRoot: normalizedWorkspaceRoot,
      baseRef,
      worktreePath,
      createdAt: timestamp,
      lastUsedAt: timestamp,
      active: true,
      reused: false,
    };

    state.runs[request.runId] = metadata;
    await this.writeState(statePath, state);
    return metadata;
  }

  async cleanupRunWorktree(runId: string, workspaceRoot: string): Promise<WorktreeCleanupResult> {
    const normalizedWorkspaceRoot = path.resolve(workspaceRoot);
    const statePath = this.getStateFilePath(normalizedWorkspaceRoot);
    const state = await this.readState(statePath);
    const metadata = state.runs[runId];

    if (!metadata) {
      return {
        runId,
        removed: false,
        preservedForActiveRuns: false,
      };
    }

    const worktreesRoot = this.getWorktreesRoot(normalizedWorkspaceRoot);
    const resolvedWorktreePath = path.resolve(metadata.worktreePath);
    if (!resolvedWorktreePath.startsWith(path.resolve(worktreesRoot) + path.sep)) {
      throw new Error(`Refusing to clean up unmanaged worktree path '${metadata.worktreePath}'.`);
    }

    metadata.active = false;
    metadata.lastUsedAt = this.now();

    const activePeers = Object.values(state.runs).filter(entry => {
      return entry.runId !== runId && entry.active && path.resolve(entry.worktreePath) === resolvedWorktreePath;
    });

    if (activePeers.length > 0) {
      await this.writeState(statePath, state);
      return {
        runId,
        removed: false,
        preservedForActiveRuns: true,
        worktreePath: metadata.worktreePath,
      };
    }

    if (await this.pathExists(resolvedWorktreePath)) {
      try {
        await this.gitRunner.runGit(['worktree', 'remove', '--force', resolvedWorktreePath], normalizedWorkspaceRoot);
      } catch (error) {
        throw new Error(
          `Failed to remove isolated worktree '${resolvedWorktreePath}'. Resolve local git state and retry cleanup. ${stringifyError(error)}`,
        );
      }

      await this.gitRunner.runGit(['worktree', 'prune'], normalizedWorkspaceRoot);
    }

    await this.writeState(statePath, state);
    return {
      runId,
      removed: true,
      preservedForActiveRuns: false,
      worktreePath: metadata.worktreePath,
    };
  }

  async detectOrphanedWorktrees(workspaceRoot: string): Promise<WorktreeOrphanRecord[]> {
    const normalizedWorkspaceRoot = path.resolve(workspaceRoot);
    const worktreesRoot = this.getWorktreesRoot(normalizedWorkspaceRoot);
    const state = await this.readState(this.getStateFilePath(normalizedWorkspaceRoot));

    const orphans: WorktreeOrphanRecord[] = [];
    const activeMappedPaths = new Set<string>();

    for (const runMetadata of Object.values(state.runs)) {
      if (!runMetadata.active || path.resolve(runMetadata.workspaceRoot) !== normalizedWorkspaceRoot) {
        continue;
      }

      const resolved = path.resolve(runMetadata.worktreePath);
      activeMappedPaths.add(resolved);
      if (!await this.pathExists(resolved)) {
        orphans.push({
          worktreePath: runMetadata.worktreePath,
          reason: 'missing-path',
        });
      }
    }

    if (await this.pathExists(worktreesRoot)) {
      const entries = await fs.readdir(worktreesRoot, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isDirectory()) {
          continue;
        }

        const resolved = path.resolve(path.join(worktreesRoot, entry.name));
        if (!activeMappedPaths.has(resolved)) {
          orphans.push({
            worktreePath: resolved,
            reason: 'untracked-path',
          });
        }
      }
    }

    return orphans.sort((left, right) => left.worktreePath.localeCompare(right.worktreePath));
  }

  private getWorktreesRoot(workspaceRoot: string): string {
    return path.join(workspaceRoot, '.huckleberry', 'worktrees');
  }

  private getStateFilePath(workspaceRoot: string): string {
    return path.join(workspaceRoot, '.huckleberry', 'runs', STATE_FILE_NAME);
  }

  private async ensureGitRepository(workspaceRoot: string): Promise<void> {
    try {
      await this.gitRunner.runGit(['rev-parse', '--is-inside-work-tree'], workspaceRoot);
    } catch (error) {
      throw new Error(`Workspace '${workspaceRoot}' is not a git repository. ${stringifyError(error)}`);
    }
  }

  private async readState(statePath: string): Promise<WorktreeStateFile> {
    try {
      const content = await fs.readFile(statePath, 'utf8');
      const parsed = JSON.parse(content) as WorktreeStateFile;
      if (parsed.version === 1 && parsed.runs) {
        return parsed;
      }
    } catch {
      // fall through
    }

    return {
      version: 1,
      runs: {},
    };
  }

  private async writeState(statePath: string, state: WorktreeStateFile): Promise<void> {
    await fs.mkdir(path.dirname(statePath), { recursive: true });
    await fs.writeFile(statePath, JSON.stringify(state, null, 2), 'utf8');
  }

  private async pathExists(targetPath: string): Promise<boolean> {
    try {
      await fs.stat(targetPath);
      return true;
    } catch {
      return false;
    }
  }
}

class DefaultGitCommandRunner implements GitCommandRunner {
  async runGit(args: string[], cwd: string): Promise<{ stdout: string; stderr: string }> {
    return new Promise((resolve, reject) => {
      execFile('git', ['-C', cwd, ...args], (error, stdout, stderr) => {
        if (error) {
          reject(new Error(stderr || error.message));
          return;
        }

        resolve({
          stdout: stdout.trim(),
          stderr: stderr.trim(),
        });
      });
    });
  }
}

function sanitizeSegment(value: string): string {
  const safe = value.replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  return safe.length > 0 ? safe : 'run';
}

function stringifyError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}