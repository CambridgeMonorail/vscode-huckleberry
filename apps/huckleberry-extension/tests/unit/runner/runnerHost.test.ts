import { afterEach, describe, expect, it, vi } from 'vitest';
import { RunnerHost } from '@huckleberry/extension/runner/runnerHost';
import { RunnerRequest, RunnerResponse } from '@huckleberry/extension/runner/types';

const { executeCommandStepMock, persistStepEvidenceMock } = vi.hoisted(() => ({
  executeCommandStepMock: vi.fn(),
  persistStepEvidenceMock: vi.fn(),
}));

vi.mock('@huckleberry/extension/runner/commandExecutor', () => ({
  executeCommandStep: executeCommandStepMock,
}));

vi.mock('@huckleberry/extension/runner/evidenceStore', () => ({
  persistStepEvidence: persistStepEvidenceMock,
}));

async function flushAsyncWork(): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 0));
  await new Promise(resolve => setTimeout(resolve, 0));
}

describe('RunnerHost', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('starts a run and emits queued/running/succeeded lifecycle events', async () => {
    const host = new RunnerHost();
    const replies: RunnerResponse[] = [];
    const events: RunnerResponse[] = [];

    executeCommandStepMock.mockResolvedValue({
      stdout: 'ok',
      stderr: '',
      exitCode: 0,
      timedOut: false,
      startedAt: 100,
      completedAt: 120,
      durationMs: 20,
    });

    persistStepEvidenceMock.mockResolvedValue({
      runId: 'run-1',
      stepId: 'lint',
      attempt: 1,
      command: 'pnpm lint:affected',
      cwd: '/workspace/.huckleberry/loops',
      startedAt: 100,
      completedAt: 120,
      durationMs: 20,
      exitCode: 0,
      timedOut: false,
      stdoutArtifactPath: '/tmp/stdout',
      stderrArtifactPath: '/tmp/stderr',
      metadataArtifactPath: '/tmp/metadata',
    });

    const request: RunnerRequest = {
      type: 'start',
      requestId: 'req-1',
      payload: {
        loopId: 'lint',
        loopFilePath: '/workspace/.huckleberry/loops/lint.yaml',
        workflow: {
          schemaVersion: 1,
          id: 'lint',
          name: 'Lint',
          steps: [
            {
              id: 'lint',
              type: 'command',
              command: 'pnpm lint:affected',
            },
          ],
        },
      },
    };

    host.handleMessage(request, response => replies.push(response), event => events.push(event));
    await flushAsyncWork();

    expect(replies).toHaveLength(1);
    expect(replies[0].type).toBe('ack');
    expect(events[0]).toMatchObject({
      type: 'event',
      payload: {
        status: 'queued',
      },
    });

    const statuses = events
      .filter(event => event.type === 'event')
      .map(event => (event.type === 'event' ? event.payload.status : ''));

    expect(statuses).toContain('queued');
    expect(statuses).toContain('running');
    expect(statuses).toContain('succeeded');
    expect(executeCommandStepMock).toHaveBeenCalledTimes(1);
    expect(persistStepEvidenceMock).toHaveBeenCalledTimes(1);

    host.dispose();
  });

  it('retries and fails when command step keeps failing', async () => {
    const host = new RunnerHost();
    const replies: RunnerResponse[] = [];
    const events: RunnerResponse[] = [];

    executeCommandStepMock.mockResolvedValue({
      stdout: '',
      stderr: 'boom',
      exitCode: 2,
      timedOut: false,
      startedAt: 100,
      completedAt: 120,
      durationMs: 20,
    });

    persistStepEvidenceMock.mockImplementation(async ({ runId, stepId, attempt, command, cwd }) => ({
      runId,
      stepId,
      attempt,
      command,
      cwd,
      startedAt: 100,
      completedAt: 120,
      durationMs: 20,
      exitCode: 2,
      timedOut: false,
      stdoutArtifactPath: '/tmp/stdout',
      stderrArtifactPath: '/tmp/stderr',
      metadataArtifactPath: '/tmp/metadata',
    }));

    host.handleMessage(
      {
        type: 'start',
        requestId: 'req-start',
        payload: {
          loopId: 'test',
          loopFilePath: '/workspace/.huckleberry/loops/test.yaml',
          workflow: {
            schemaVersion: 1,
            id: 'test',
            name: 'Test',
            steps: [
              {
                id: 'test',
                type: 'command',
                command: 'pnpm test:affected',
              },
            ],
          },
          execution: {
            maxStepRetries: 1,
          },
        },
      },
      response => replies.push(response),
      event => events.push(event),
    );

    await flushAsyncWork();

    expect(executeCommandStepMock).toHaveBeenCalledTimes(2);
    const retryEvents = events.filter(
      event => event.type === 'event' && event.payload.eventType === 'step-retry',
    );
    expect(retryEvents).toHaveLength(1);

    const failedEvent = events.find(
      event => event.type === 'event' && event.payload.status === 'failed',
    );
    expect(failedEvent).toBeDefined();

    host.dispose();
  });
});
