import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  appendEvidenceIndex,
  appendRunEvent,
  getEvidenceIndex,
  getRunEvents,
  reconstructRunsFromEvents,
} from '@huckleberry/extension/runner/runEventStore';
import { RunnerEvent, RunnerStepResult } from '@huckleberry/extension/runner/types';

describe('runEventStore', () => {
  let originalCwd: string;
  let sandboxDirectory: string;

  beforeEach(async () => {
    originalCwd = process.cwd();
    sandboxDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'huckleberry-run-store-'));
    process.chdir(sandboxDirectory);
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    await fs.rm(sandboxDirectory, { recursive: true, force: true });
  });

  it('reconstructs run records from append-only event history', async () => {
    const eventBase: Omit<RunnerEvent, 'status' | 'eventType' | 'timestamp' | 'message'> = {
      runId: 'run-1',
      loopId: 'lint',
      loopFilePath: '/workspace/.huckleberry/loops/lint.yaml',
    };

    await appendRunEvent({
      ...eventBase,
      status: 'queued',
      eventType: 'run-queued',
      timestamp: 100,
      message: 'queued',
    });

    await appendRunEvent({
      ...eventBase,
      status: 'succeeded',
      eventType: 'all-steps-succeeded',
      timestamp: 200,
      message: 'run complete',
    });

    const runs = await reconstructRunsFromEvents();
    expect(runs).toHaveLength(1);
    expect(runs[0]).toMatchObject({
      runId: 'run-1',
      loopId: 'lint',
      status: 'succeeded',
      startedAt: 100,
      completedAt: 200,
    });
  });

  it('skips corrupted event lines and preserves valid reconstruction', async () => {
    const runsRoot = path.join(process.cwd(), '.huckleberry', 'runs', 'run-2');
    await fs.mkdir(runsRoot, { recursive: true });

    const content = [
      JSON.stringify({
        runId: 'run-2',
        loopId: 'tests',
        loopFilePath: '/workspace/.huckleberry/loops/tests.yaml',
        status: 'queued',
        eventType: 'run-queued',
        timestamp: 10,
      }),
      '{this-is-not-json}',
      JSON.stringify({
        runId: 'run-2',
        loopId: 'tests',
        loopFilePath: '/workspace/.huckleberry/loops/tests.yaml',
        status: 'failed',
        eventType: 'step-failed',
        timestamp: 20,
        message: 'failed',
      }),
      '',
    ].join('\n');

    await fs.writeFile(path.join(runsRoot, 'events.ndjson'), content, 'utf8');

    const runs = await reconstructRunsFromEvents();
    expect(runs).toHaveLength(1);
    expect(runs[0]).toMatchObject({
      runId: 'run-2',
      status: 'failed',
      completedAt: 20,
    });
  });

  it('indexes evidence metadata and supports query by run and step', async () => {
    const stepResult: RunnerStepResult = {
      runId: 'run-3',
      stepId: 'lint',
      attempt: 1,
      command: 'pnpm lint:affected',
      cwd: '/workspace',
      startedAt: 100,
      completedAt: 110,
      durationMs: 10,
      exitCode: 0,
      timedOut: false,
      stdoutArtifactPath: '/artifacts/stdout.txt',
      stderrArtifactPath: '/artifacts/stderr.txt',
      metadataArtifactPath: '/artifacts/metadata.json',
    };

    await appendEvidenceIndex('run-3', stepResult);

    const byRun = await getEvidenceIndex('run-3');
    const byStep = await getEvidenceIndex('run-3', 'lint');
    const missingStep = await getEvidenceIndex('run-3', 'tests');

    expect(byRun).toHaveLength(1);
    expect(byStep).toHaveLength(1);
    expect(byStep[0].stepId).toBe('lint');
    expect(missingStep).toHaveLength(0);
  });

  it('returns timeline events in timestamp order for a run', async () => {
    await appendRunEvent({
      runId: 'run-4',
      loopId: 'lint',
      loopFilePath: '/workspace/.huckleberry/loops/lint.yaml',
      status: 'running',
      eventType: 'step-started',
      timestamp: 200,
      message: 'Step started.',
    });

    await appendRunEvent({
      runId: 'run-4',
      loopId: 'lint',
      loopFilePath: '/workspace/.huckleberry/loops/lint.yaml',
      status: 'queued',
      eventType: 'run-queued',
      timestamp: 100,
      message: 'Queued.',
    });

    const events = await getRunEvents('run-4');

    expect(events).toHaveLength(2);
    expect(events[0].eventType).toBe('run-queued');
    expect(events[1].eventType).toBe('step-started');
  });

  it('persists agent claims separately from deterministic evidence payloads', async () => {
    const claimEvent: RunnerEvent = {
      runId: 'run-5',
      loopId: 'repair-loop',
      loopFilePath: '/workspace/.huckleberry/loops/repair.yaml',
      status: 'running',
      eventType: 'step-succeeded:agent',
      timestamp: 300,
      message: 'Agent repair completed.',
      agentClaim: {
        stepId: 'repair',
        attempt: 1,
        source: 'agent',
        summary: 'I fixed the test failures.',
        adapterId: 'copilot',
      },
      stepResult: {
        runId: 'run-5',
        stepId: 'tests',
        attempt: 2,
        command: 'pnpm test:affected',
        cwd: '/workspace',
        startedAt: 260,
        completedAt: 290,
        durationMs: 30,
        exitCode: 0,
        timedOut: false,
        stdoutArtifactPath: '/artifacts/stdout.txt',
        stderrArtifactPath: '/artifacts/stderr.txt',
        metadataArtifactPath: '/artifacts/metadata.json',
      },
    };

    await appendRunEvent(claimEvent);

    const events = await getRunEvents('run-5');
    expect(events).toHaveLength(1);
    expect(events[0].agentClaim?.summary).toBe('I fixed the test failures.');
    expect(events[0].stepResult?.stdoutArtifactPath).toBe('/artifacts/stdout.txt');
  });
});
