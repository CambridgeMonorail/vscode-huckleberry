import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  appendEvidenceIndex,
  appendRunEvent,
  getRunEvents,
  getRunSummaryArtifacts,
  reconstructRunsFromEvents,
  writeRunSummaryArtifacts,
} from '@huckleberry/extension/runner/runEventStore';
import { RunnerHost } from '@huckleberry/extension/runner/runnerHost';
import { RunnerEvent, RunnerStepResult } from '@huckleberry/extension/runner/types';

describe('runner lifecycle smoke', () => {
  let originalCwd: string;
  let sandboxDirectory: string;

  beforeEach(async () => {
    originalCwd = process.cwd();
    sandboxDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'huckleberry-runner-smoke-'));
    process.chdir(sandboxDirectory);
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    await fs.rm(sandboxDirectory, { recursive: true, force: true });
  });

  it('catches retry failure stop reasons and persists summary evidence', async () => {
    const runId = 'run-smoke-failure';
    const baseEvent: Omit<RunnerEvent, 'status' | 'eventType' | 'timestamp'> = {
      runId,
      loopId: 'lint-loop',
      loopFilePath: '/workspace/.huckleberry/loops/lint.yaml',
    };

    const stepResult: RunnerStepResult = {
      runId,
      stepId: 'lint',
      attempt: 2,
      command: 'pnpm lint:affected',
      cwd: '/workspace',
      startedAt: 120,
      completedAt: 180,
      durationMs: 60,
      exitCode: 2,
      timedOut: false,
      stdoutArtifactPath: '/workspace/.huckleberry/runs/run-smoke-failure/lint.attempt-2.stdout.txt',
      stderrArtifactPath: '/workspace/.huckleberry/runs/run-smoke-failure/lint.attempt-2.stderr.txt',
      metadataArtifactPath: '/workspace/.huckleberry/runs/run-smoke-failure/lint.attempt-2.metadata.json',
    };

    await appendRunEvent({
      ...baseEvent,
      status: 'queued',
      eventType: 'run-queued',
      timestamp: 100,
      message: 'queued',
    });

    await appendRunEvent({
      ...baseEvent,
      status: 'running',
      eventType: 'step-retry',
      timestamp: 150,
      message: 'retrying lint',
      transition: { from: 'running', to: 'running', stepId: 'lint', attempt: 1, reason: 'step-retry' },
      stepResult: {
        ...stepResult,
        attempt: 1,
      },
    });

    await appendRunEvent({
      ...baseEvent,
      status: 'failed',
      eventType: 'step-failed',
      timestamp: 200,
      message: 'Step lint failed.',
      transition: { from: 'running', to: 'failed', stepId: 'lint', attempt: 2, reason: 'step-failed' },
      stopReason: {
        code: 'STEP_EXIT_NON_ZERO',
        message: "Step 'lint' exited with code 2.",
      },
      stepResult,
    });

    await appendEvidenceIndex(runId, stepResult);

    const runs = await reconstructRunsFromEvents();
    const run = runs.find(entry => entry.runId === runId);
    expect(run).toBeDefined();
    expect(run?.status).toBe('failed');
    expect(run?.stopReasonCode).toBe('STEP_EXIT_NON_ZERO');

    const artifacts = await writeRunSummaryArtifacts(runId);
    expect(artifacts).toBeDefined();

    const loadedSummary = await getRunSummaryArtifacts(runId);
    expect(loadedSummary?.summary.stopReasonCode).toBe('STEP_EXIT_NON_ZERO');
    expect(loadedSummary?.summary.attempts.find(entry => entry.stepId === 'lint')?.attempts).toBe(2);
    expect(loadedSummary?.summary.keyEvidence.some(entry => entry.kind === 'stdout')).toBe(true);
  });

  it('captures repair exhaustion and keeps diff-warning events inspectable', async () => {
    const runId = 'run-smoke-exhausted';
    const events: RunnerEvent[] = [
      {
        runId,
        loopId: 'repair-loop',
        loopFilePath: '/workspace/.huckleberry/loops/repair.yaml',
        status: 'queued',
        eventType: 'run-queued',
        timestamp: 100,
        message: 'queued',
      },
      {
        runId,
        loopId: 'repair-loop',
        loopFilePath: '/workspace/.huckleberry/loops/repair.yaml',
        status: 'running',
        eventType: 'repair-attempt',
        timestamp: 130,
        message: 'repair attempt 1',
        transition: { from: 'running', to: 'running', stepId: 'tests', attempt: 1, reason: 'repair-attempt' },
      },
      {
        runId,
        loopId: 'repair-loop',
        loopFilePath: '/workspace/.huckleberry/loops/repair.yaml',
        status: 'exhausted',
        eventType: 'repair-attempts-exhausted',
        timestamp: 190,
        message: 'repair exhausted',
        transition: { from: 'running', to: 'exhausted', stepId: 'tests', attempt: 2, reason: 'repair-attempts-exhausted' },
        stopReason: {
          code: 'REPAIR_ATTEMPTS_EXHAUSTED',
          message: "Step 'tests' exhausted repair attempts (1).",
        },
      },
      {
        runId,
        loopId: 'repair-loop',
        loopFilePath: '/workspace/.huckleberry/loops/repair.yaml',
        status: 'exhausted',
        eventType: 'run-diff-capture-warning',
        timestamp: 191,
        message: 'Unable to capture isolated run diff for run-smoke-exhausted.',
        deepLinks: [
          {
            kind: 'diff',
            label: 'Open run diff artifact',
            target: '/workspace/.huckleberry/runs/run-smoke-exhausted/run.diff.patch',
          },
        ],
      },
    ];

    for (const event of events) {
      await appendRunEvent(event);
    }

    const timeline = await getRunEvents(runId);
    const warning = timeline.find(event => event.eventType === 'run-diff-capture-warning');
    expect(warning).toBeDefined();
    expect(warning?.deepLinks?.some(link => link.label === 'Open run diff artifact')).toBe(true);

    const summary = await writeRunSummaryArtifacts(runId);
    expect(summary?.summary.status).toBe('exhausted');
    expect(summary?.summary.terminalEventType).toBe('run-diff-capture-warning');
    expect(summary?.summary.unresolvedItems.some(item => item.code === 'REPAIR_ATTEMPTS_EXHAUSTED')).toBe(true);
  });

  it('replays interrupted runs deterministically after extension reload', async () => {
    const runId = 'run-smoke-interrupted';

    await appendRunEvent({
      runId,
      loopId: 'repair-loop',
      loopFilePath: '/workspace/.huckleberry/loops/repair.yaml',
      status: 'queued',
      eventType: 'run-queued',
      timestamp: 100,
      message: 'queued',
    });

    await appendRunEvent({
      runId,
      loopId: 'repair-loop',
      loopFilePath: '/workspace/.huckleberry/loops/repair.yaml',
      status: 'running',
      eventType: 'step-started',
      timestamp: 140,
      message: 'running tests',
      transition: {
        from: 'running',
        to: 'running',
        stepId: 'tests',
        attempt: 1,
        reason: 'step-started',
      },
    });

    const runs = await reconstructRunsFromEvents();
    const run = runs.find(entry => entry.runId === runId);

    expect(run).toBeDefined();
    expect(run?.status).toBe('running');
    expect(run?.startedAt).toBe(100);
    expect(run?.updatedAt).toBe(140);
    expect(run?.completedAt).toBeUndefined();
    expect(run?.stopReasonCode).toBeUndefined();
  });

  it('hydrates persisted interrupted state through RunnerHost listRuns after restart', async () => {
    const runId = 'run-smoke-host-reload';

    await appendRunEvent({
      runId,
      loopId: 'lint-loop',
      loopFilePath: '/workspace/.huckleberry/loops/lint.yaml',
      status: 'queued',
      eventType: 'run-queued',
      timestamp: 100,
      message: 'queued',
    });

    await appendRunEvent({
      runId,
      loopId: 'lint-loop',
      loopFilePath: '/workspace/.huckleberry/loops/lint.yaml',
      status: 'running',
      eventType: 'step-started',
      timestamp: 120,
      message: 'running lint',
      transition: {
        from: 'running',
        to: 'running',
        stepId: 'lint',
        attempt: 1,
        reason: 'step-started',
      },
    });

    const host = new RunnerHost();
    const replies: Array<{ type: string; payload: unknown }> = [];

    host.handleMessage(
      {
        type: 'listRuns',
        requestId: 'req-list-reload',
        payload: {},
      },
      response => replies.push(response as { type: string; payload: unknown }),
      () => undefined,
    );

    let runsReply = replies.find(reply => reply.type === 'runs') as
      | {
          type: 'runs';
          payload: {
            runs: Array<{ runId: string; status: string; updatedAt: number }>;
          };
        }
      | undefined;

    for (let attempt = 0; attempt < 20 && !runsReply; attempt += 1) {
      await new Promise(resolve => setTimeout(resolve, 5));
      runsReply = replies.find(reply => reply.type === 'runs') as
        | {
            type: 'runs';
            payload: {
              runs: Array<{ runId: string; status: string; updatedAt: number }>;
            };
          }
        | undefined;
    }

    expect(runsReply).toBeDefined();
    const restored = runsReply?.payload.runs.find(run => run.runId === runId);
    expect(restored).toBeDefined();
    expect(restored?.status).toBe('running');
    expect(restored?.updatedAt).toBe(120);

    host.dispose();
  });
});
