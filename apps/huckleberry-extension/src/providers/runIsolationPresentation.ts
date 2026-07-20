import { RunnerRunRecord } from '../runner';

export interface RunIsolationPresentation {
  modeLabel: 'workspace' | 'worktree' | 'unknown';
  details: string[];
  warnings: string[];
}

export function buildRunIsolationPresentation(run: RunnerRunRecord): RunIsolationPresentation {
  const context = run.executionContext;

  if (!context) {
    return {
      modeLabel: 'unknown',
      details: [],
      warnings: ['Isolation metadata is unavailable for this run.'],
    };
  }

  if (context.mode === 'workspace') {
    return {
      modeLabel: 'workspace',
      details: [
        `Workspace root: ${context.workspaceRoot}`,
        `Working directory: ${context.workingDirectory}`,
      ],
      warnings: [],
    };
  }

  const details = [
    `Workspace root: ${context.workspaceRoot}`,
    `Working directory: ${context.workingDirectory}`,
    `Worktree path: ${context.worktreePath ?? 'n/a'}`,
    `Base ref: ${context.baseRef ?? 'n/a'}`,
    `Reused worktree: ${context.reusedWorktree ? 'yes' : 'no'}`,
  ];

  const warnings: string[] = [];
  if (!context.worktreePath) {
    warnings.push('Worktree isolation is set but worktree path metadata is missing.');
  }

  if (!context.baseRef) {
    warnings.push('Worktree isolation is set but branch/base-ref metadata is missing.');
  }

  return {
    modeLabel: 'worktree',
    details,
    warnings,
  };
}