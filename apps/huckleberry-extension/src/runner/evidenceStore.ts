import * as fs from 'fs/promises';
import * as path from 'path';
import { RunnerExecutionContext, RunnerStepResult } from './types';

export interface PersistStepEvidenceRequest {
  runId: string;
  stepId: string;
  attempt: number;
  command: string;
  cwd: string;
  startedAt: number;
  completedAt: number;
  durationMs: number;
  exitCode: number | null;
  timedOut: boolean;
  cancelled?: boolean;
  executionContext?: RunnerExecutionContext;
  stdout: string;
  stderr: string;
}

const RUNS_ROOT = path.join(process.cwd(), '.huckleberry', 'runs');

/**
 * Persists command step outputs and metadata in the local evidence store.
 */
export async function persistStepEvidence(request: PersistStepEvidenceRequest): Promise<RunnerStepResult> {
  const runDirectory = path.join(RUNS_ROOT, request.runId);
  await fs.mkdir(runDirectory, { recursive: true });

  const fileStem = `${request.stepId}.attempt-${request.attempt}`;
  const stdoutArtifactPath = path.join(runDirectory, `${fileStem}.stdout.txt`);
  const stderrArtifactPath = path.join(runDirectory, `${fileStem}.stderr.txt`);
  const metadataArtifactPath = path.join(runDirectory, `${fileStem}.metadata.json`);

  await fs.writeFile(stdoutArtifactPath, request.stdout, 'utf8');
  await fs.writeFile(stderrArtifactPath, request.stderr, 'utf8');

  const metadata = {
    runId: request.runId,
    stepId: request.stepId,
    attempt: request.attempt,
    command: request.command,
    cwd: request.cwd,
    startedAt: request.startedAt,
    completedAt: request.completedAt,
    durationMs: request.durationMs,
    exitCode: request.exitCode,
    timedOut: request.timedOut,
    cancelled: request.cancelled ?? false,
    executionContext: request.executionContext,
    stdoutArtifactPath,
    stderrArtifactPath,
  };

  await fs.writeFile(metadataArtifactPath, JSON.stringify(metadata, null, 2), 'utf8');

  return {
    runId: request.runId,
    stepId: request.stepId,
    attempt: request.attempt,
    command: request.command,
    cwd: request.cwd,
    startedAt: request.startedAt,
    completedAt: request.completedAt,
    durationMs: request.durationMs,
    exitCode: request.exitCode,
    timedOut: request.timedOut,
    cancelled: request.cancelled ?? false,
    executionContext: request.executionContext,
    stdoutArtifactPath,
    stderrArtifactPath,
    metadataArtifactPath,
  };
}
