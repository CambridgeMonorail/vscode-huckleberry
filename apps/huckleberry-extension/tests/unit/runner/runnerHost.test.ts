import { afterEach, describe, expect, it, vi } from 'vitest';
import { AgentAdapterRegistry } from '@huckleberry/extension/runner/agentAdapter';
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
    if (failedEvent?.type === 'event') {
      expect(failedEvent.payload.stopReason?.code).toBe('STEP_EXIT_NON_ZERO');
      expect(failedEvent.payload.stopReason?.message).toContain("Step 'test' exited with code 2");
    }

    expect(appendRunEventMock).toHaveBeenCalled();

    host.dispose();
  });

  it('marks timed out command steps with timeout stop reason payload', async () => {
    const host = new RunnerHost();
    const events: RunnerResponse[] = [];

    executeCommandStepMock.mockResolvedValue({
      stdout: '',
      stderr: '',
      exitCode: null,
      timedOut: true,
      cancelled: false,
      startedAt: 100,
      completedAt: 500,
      durationMs: 400,
    });

    persistStepEvidenceMock.mockImplementation(async ({ runId, stepId, attempt, command, cwd }) => ({
      runId,
      stepId,
      attempt,
      command,
      cwd,
      startedAt: 100,
      completedAt: 500,
      durationMs: 400,
      exitCode: null,
      timedOut: true,
      cancelled: false,
      stdoutArtifactPath: '/tmp/stdout',
      stderrArtifactPath: '/tmp/stderr',
      metadataArtifactPath: '/tmp/metadata',
    }));

    reconstructRunsFromEventsMock.mockResolvedValue([]);

    host.handleMessage(
      {
        type: 'start',
        requestId: 'req-timeout',
        payload: {
          loopId: 'timeout-loop',
          loopFilePath: '/workspace/.huckleberry/loops/timeout.yaml',
          workflow: {
            schemaVersion: 1,
            id: 'timeout-loop',
            name: 'Timeout',
            steps: [
              {
                id: 'timeout-step',
                type: 'command',
                command: 'pnpm test:affected',
              },
            ],
          },
          execution: {
            stepTimeoutMs: 400,
          },
        },
      },
      () => undefined,
      event => events.push(event),
    );

    await flushAsyncWork();

    const timeoutEvent = events.find(
      event => event.type === 'event' && event.payload.eventType === 'step-timeout',
    );
    expect(timeoutEvent).toBeDefined();
    if (timeoutEvent?.type === 'event') {
      expect(timeoutEvent.payload.stopReason?.code).toBe('STEP_TIMEOUT');
      expect(timeoutEvent.payload.stopReason?.message).toContain("Step 'timeout-step' timed out");
    }

    host.dispose();
  });

  it('cancels an in-flight command step and emits cancellation stop reason', async () => {
    const host = new RunnerHost();
    const replies: RunnerResponse[] = [];
    const events: RunnerResponse[] = [];

    executeCommandStepMock.mockImplementation(({ abortSignal }) => {
      return new Promise(resolve => {
        if (abortSignal?.aborted) {
          resolve({
            stdout: '',
            stderr: '',
            exitCode: null,
            timedOut: false,
            cancelled: true,
            startedAt: 100,
            completedAt: 120,
            durationMs: 20,
          });
          return;
        }

        abortSignal?.addEventListener('abort', () => {
          resolve({
            stdout: '',
            stderr: '',
            exitCode: null,
            timedOut: false,
            cancelled: true,
            startedAt: 100,
            completedAt: 140,
            durationMs: 40,
          });
        });
      });
    });

    persistStepEvidenceMock.mockImplementation(async ({ runId, stepId, attempt, command, cwd }) => ({
      runId,
      stepId,
      attempt,
      command,
      cwd,
      startedAt: 100,
      completedAt: 140,
      durationMs: 40,
      exitCode: null,
      timedOut: false,
      cancelled: true,
      stdoutArtifactPath: '/tmp/stdout',
      stderrArtifactPath: '/tmp/stderr',
      metadataArtifactPath: '/tmp/metadata',
    }));

    reconstructRunsFromEventsMock.mockResolvedValue([]);

    host.handleMessage(
      {
        type: 'start',
        requestId: 'req-cancel-start',
        payload: {
          loopId: 'cancel-loop',
          loopFilePath: '/workspace/.huckleberry/loops/cancel.yaml',
          workflow: {
            schemaVersion: 1,
            id: 'cancel-loop',
            name: 'Cancel',
            steps: [
              {
                id: 'cancel-step',
                type: 'command',
                command: 'pnpm test:affected',
              },
            ],
          },
        },
      },
      response => replies.push(response),
      event => events.push(event),
    );

    await flushAsyncWork();

    const startAck = replies.find(reply => reply.type === 'ack' && reply.requestId === 'req-cancel-start');
    expect(startAck).toBeDefined();
    if (startAck?.type !== 'ack' || !startAck.payload.runId) {
      host.dispose();
      throw new Error('Expected start ack run id');
    }

    host.handleMessage(
      {
        type: 'cancel',
        requestId: 'req-cancel',
        payload: {
          runId: startAck.payload.runId,
        },
      },
      response => replies.push(response),
      event => events.push(event),
    );

    await flushAsyncWork();

    const cancelRequestedEvent = events.find(
      event => event.type === 'event' && event.payload.eventType === 'run-cancel-requested',
    );
    expect(cancelRequestedEvent).toBeDefined();

    const cancelledEvent = events.find(
      event => event.type === 'event' && event.payload.eventType === 'run-cancelled',
    );
    expect(cancelledEvent).toBeDefined();
    if (cancelledEvent?.type === 'event') {
      expect(cancelledEvent.payload.stopReason?.code).toBe('CANCELLED_BY_USER');
      expect(cancelledEvent.payload.stopReason?.message).toContain('Run cancelled while executing step');
    }

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

  it('fails agent steps clearly when no adapter is registered', async () => {
    const host = new RunnerHost(new AgentAdapterRegistry());
    const events: RunnerResponse[] = [];

    reconstructRunsFromEventsMock.mockResolvedValue([]);

    host.handleMessage(
      {
        type: 'start',
        requestId: 'req-agent-unavailable',
        payload: {
          loopId: 'agent-loop',
          loopFilePath: '/workspace/.huckleberry/loops/agent.yaml',
          workflow: {
            schemaVersion: 1,
            id: 'agent-loop',
            name: 'Agent Loop',
            steps: [
              {
                id: 'repair',
                type: 'agent',
                prompt: 'Fix the failing check.',
                allowedPaths: ['src'],
                maxFilesChanged: 2,
                maxTurns: 3,
              },
            ],
          } as unknown as RunnerRequest['payload']['workflow'],
        },
      },
      () => undefined,
      event => events.push(event),
    );

    await flushAsyncWork();

    const failedEvent = events.find(
      event => event.type === 'event' && event.payload.eventType === 'step-failed:agent-adapter-unavailable',
    );
    expect(failedEvent).toBeDefined();
    if (failedEvent?.type === 'event') {
      expect(failedEvent.payload.stopReason?.code).toBe('AGENT_ADAPTER_UNAVAILABLE');
    }

    host.dispose();
  });

  it('routes agent steps through the adapter contract when available', async () => {
    const adapterRegistry = new AgentAdapterRegistry();
    const executeAgentStep = vi.fn().mockResolvedValue({
      summary: 'Agent step completed.',
      turnsUsed: 1,
      changedFiles: ['src/fix.ts'],
    });
    adapterRegistry.registerAdapter({
      id: 'fake-adapter',
      isAvailable: vi.fn().mockResolvedValue({ available: true }),
      executeAgentStep,
    });

    const host = new RunnerHost(adapterRegistry);
    const events: RunnerResponse[] = [];

    reconstructRunsFromEventsMock.mockResolvedValue([]);

    host.handleMessage(
      {
        type: 'start',
        requestId: 'req-agent-available',
        payload: {
          loopId: 'agent-loop',
          loopFilePath: '/workspace/.huckleberry/loops/agent.yaml',
          workflow: {
            schemaVersion: 1,
            id: 'agent-loop',
            name: 'Agent Loop',
            steps: [
              {
                id: 'repair',
                type: 'agent',
                prompt: 'Fix the failing check.',
                allowedPaths: ['src'],
                maxFilesChanged: 2,
                maxTurns: 3,
              },
            ],
          } as unknown as RunnerRequest['payload']['workflow'],
        },
      },
      () => undefined,
      event => events.push(event),
    );

    await flushAsyncWork();

    expect(executeAgentStep).toHaveBeenCalledTimes(1);
    const successEvent = events.find(
      event => event.type === 'event' && event.payload.eventType === 'step-succeeded:agent',
    );
    expect(successEvent).toBeDefined();

    host.dispose();
  });

  it('fails agent steps when max turns are exceeded', async () => {
    const adapterRegistry = new AgentAdapterRegistry();
    adapterRegistry.registerAdapter({
      id: 'fake-adapter',
      isAvailable: vi.fn().mockResolvedValue({ available: true }),
      executeAgentStep: vi.fn().mockResolvedValue({
        summary: 'Too many turns used.',
        turnsUsed: 4,
        changedFiles: [],
      }),
    });

    const host = new RunnerHost(adapterRegistry);
    const events: RunnerResponse[] = [];
    reconstructRunsFromEventsMock.mockResolvedValue([]);

    host.handleMessage(
      {
        type: 'start',
        requestId: 'req-agent-turns',
        payload: {
          loopId: 'agent-loop',
          loopFilePath: '/workspace/.huckleberry/loops/agent.yaml',
          workflow: {
            schemaVersion: 1,
            id: 'agent-loop',
            name: 'Agent Loop',
            steps: [
              {
                id: 'repair',
                type: 'agent',
                prompt: 'Fix the failing check.',
                allowedPaths: ['src'],
                maxFilesChanged: 2,
                maxTurns: 3,
              },
            ],
          } as unknown as RunnerRequest['payload']['workflow'],
        },
      },
      () => undefined,
      event => events.push(event),
    );

    await flushAsyncWork();

    const failedEvent = events.find(
      event => event.type === 'event' && event.payload.stopReason?.code === 'AGENT_MAX_TURNS_EXCEEDED',
    );
    expect(failedEvent).toBeDefined();

    host.dispose();
  });

  it('fails agent steps when max files changed is exceeded', async () => {
    const adapterRegistry = new AgentAdapterRegistry();
    adapterRegistry.registerAdapter({
      id: 'fake-adapter',
      isAvailable: vi.fn().mockResolvedValue({ available: true }),
      executeAgentStep: vi.fn().mockResolvedValue({
        summary: 'Changed too many files.',
        turnsUsed: 1,
        changedFiles: ['src/one.ts', 'src/two.ts', 'src/three.ts'],
      }),
    });

    const host = new RunnerHost(adapterRegistry);
    const events: RunnerResponse[] = [];
    reconstructRunsFromEventsMock.mockResolvedValue([]);

    host.handleMessage(
      {
        type: 'start',
        requestId: 'req-agent-files',
        payload: {
          loopId: 'agent-loop',
          loopFilePath: '/workspace/.huckleberry/loops/agent.yaml',
          workflow: {
            schemaVersion: 1,
            id: 'agent-loop',
            name: 'Agent Loop',
            steps: [
              {
                id: 'repair',
                type: 'agent',
                prompt: 'Fix the failing check.',
                allowedPaths: ['src'],
                maxFilesChanged: 2,
                maxTurns: 3,
              },
            ],
          } as unknown as RunnerRequest['payload']['workflow'],
        },
      },
      () => undefined,
      event => events.push(event),
    );

    await flushAsyncWork();

    const failedEvent = events.find(
      event => event.type === 'event' && event.payload.stopReason?.code === 'AGENT_MAX_FILES_CHANGED_EXCEEDED',
    );
    expect(failedEvent).toBeDefined();

    host.dispose();
  });

  it('fails agent steps when changed files are outside allowed paths', async () => {
    const adapterRegistry = new AgentAdapterRegistry();
    adapterRegistry.registerAdapter({
      id: 'fake-adapter',
      isAvailable: vi.fn().mockResolvedValue({ available: true }),
      executeAgentStep: vi.fn().mockResolvedValue({
        summary: 'Changed disallowed path.',
        turnsUsed: 1,
        changedFiles: ['../outside.ts'],
      }),
    });

    const host = new RunnerHost(adapterRegistry);
    const events: RunnerResponse[] = [];
    reconstructRunsFromEventsMock.mockResolvedValue([]);

    host.handleMessage(
      {
        type: 'start',
        requestId: 'req-agent-path',
        payload: {
          loopId: 'agent-loop',
          loopFilePath: '/workspace/.huckleberry/loops/agent.yaml',
          workflow: {
            schemaVersion: 1,
            id: 'agent-loop',
            name: 'Agent Loop',
            steps: [
              {
                id: 'repair',
                type: 'agent',
                prompt: 'Fix the failing check.',
                allowedPaths: ['src'],
                maxFilesChanged: 2,
                maxTurns: 3,
              },
            ],
          } as unknown as RunnerRequest['payload']['workflow'],
        },
      },
      () => undefined,
      event => events.push(event),
    );

    await flushAsyncWork();

    const failedEvent = events.find(
      event => event.type === 'event' && event.payload.stopReason?.code === 'AGENT_PATH_SCOPE_VIOLATION',
    );
    expect(failedEvent).toBeDefined();

    host.dispose();
  });
});
