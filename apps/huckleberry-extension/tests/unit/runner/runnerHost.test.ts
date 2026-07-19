import { afterEach, describe, expect, it, vi } from 'vitest';
import { RunnerHost } from '@huckleberry/extension/runner/runnerHost';
import { RunnerRequest, RunnerResponse } from '@huckleberry/extension/runner/types';

const { executeCommandStepMock, persistStepEvidenceMock } = vi.hoisted(() => ({
  executeCommandStepMock: vi.fn(),
  persistStepEvidenceMock: vi.fn(),
}));

const { appendRunEventMock, appendEvidenceIndexMock, reconstructRunsFromEventsMock, getRunEventsMock } = vi.hoisted(() => ({
  appendRunEventMock: vi.fn(),
  appendEvidenceIndexMock: vi.fn(),
  reconstructRunsFromEventsMock: vi.fn(),
  getRunEventsMock: vi.fn(),
}));

vi.mock('@huckleberry/extension/runner/commandExecutor', () => ({
  executeCommandStep: executeCommandStepMock,
}));

vi.mock('@huckleberry/extension/runner/evidenceStore', () => ({
  persistStepEvidence: persistStepEvidenceMock,
}));

vi.mock('@huckleberry/extension/runner/runEventStore', () => ({
  appendRunEvent: appendRunEventMock,
  appendEvidenceIndex: appendEvidenceIndexMock,
  reconstructRunsFromEvents: reconstructRunsFromEventsMock,
  getRunEvents: getRunEventsMock,
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

    reconstructRunsFromEventsMock.mockResolvedValue([]);

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
    expect(appendRunEventMock).toHaveBeenCalled();
    expect(appendEvidenceIndexMock).toHaveBeenCalled();

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

    reconstructRunsFromEventsMock.mockResolvedValue([]);

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

    expect(appendRunEventMock).toHaveBeenCalled();

    host.dispose();
  });

  it('lists reconstructed runs loaded from persisted events', async () => {
    const host = new RunnerHost();
    const replies: RunnerResponse[] = [];

    reconstructRunsFromEventsMock.mockResolvedValue([
      {
        runId: 'historic-1',
        loopId: 'lint',
        loopFilePath: '/workspace/.huckleberry/loops/lint.yaml',
        status: 'failed',
        startedAt: 1,
        updatedAt: 2,
        completedAt: 2,
        stopReason: 'Step lint failed.',
      },
    ]);

    host.handleMessage(
      {
        type: 'listRuns',
        requestId: 'req-list',
        payload: {},
      },
      response => replies.push(response),
      () => undefined,
    );

    await flushAsyncWork();

    const runsResponse = replies.find(reply => reply.type === 'runs');
    expect(runsResponse).toBeDefined();
    if (runsResponse?.type === 'runs') {
      expect(runsResponse.payload.runs).toHaveLength(1);
      expect(runsResponse.payload.runs[0].runId).toBe('historic-1');
    }

    host.dispose();
  });

  it('returns persisted timeline events for a run', async () => {
    const host = new RunnerHost();
    const replies: RunnerResponse[] = [];

    reconstructRunsFromEventsMock.mockResolvedValue([]);
    getRunEventsMock.mockResolvedValue([
      {
        runId: 'historic-1',
        loopId: 'lint',
        loopFilePath: '/workspace/.huckleberry/loops/lint.yaml',
        status: 'queued',
        eventType: 'run-queued',
        timestamp: 1,
        message: 'queued',
      },
    ]);

    host.handleMessage(
      {
        type: 'events',
        requestId: 'req-events',
        payload: {
          runId: 'historic-1',
        },
      },
      response => replies.push(response),
      () => undefined,
    );

    await flushAsyncWork();

    const eventsResponse = replies.find(reply => reply.type === 'events');
    expect(eventsResponse).toBeDefined();
    if (eventsResponse?.type === 'events') {
      expect(eventsResponse.payload.events).toHaveLength(1);
      expect(eventsResponse.payload.events[0].eventType).toBe('run-queued');
    }

    host.dispose();
  });
});
