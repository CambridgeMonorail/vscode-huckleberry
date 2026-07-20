import { afterEach, describe, expect, it, vi } from 'vitest';
import { AgentAdapterRegistry } from '@huckleberry/extension/runner/agentAdapter';
import { RunnerHost } from '@huckleberry/extension/runner/runnerHost';
import { RunnerRequest, RunnerResponse } from '@huckleberry/extension/runner/types';

const { executeCommandStepMock, persistStepEvidenceMock } = vi.hoisted(() => ({
  executeCommandStepMock: vi.fn(),
  persistStepEvidenceMock: vi.fn(),
}));

const {
  appendRunEventMock,
  appendEvidenceIndexMock,
  reconstructRunsFromEventsMock,
  getRunEventsMock,
  getRunSummaryArtifactsMock,
  writeRunSummaryArtifactsMock,
} = vi.hoisted(() => ({
  appendRunEventMock: vi.fn(),
  appendEvidenceIndexMock: vi.fn(),
  reconstructRunsFromEventsMock: vi.fn(),
  getRunEventsMock: vi.fn(),
  getRunSummaryArtifactsMock: vi.fn(),
  writeRunSummaryArtifactsMock: vi.fn(),
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
  getRunSummaryArtifacts: getRunSummaryArtifactsMock,
  writeRunSummaryArtifacts: writeRunSummaryArtifactsMock,
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

  it('runs command and agent steps in workspace execution context', async () => {
    const adapterRegistry = new AgentAdapterRegistry();
    const executeAgentStep = vi.fn().mockResolvedValue({
      summary: 'Agent completed in workspace mode.',
      turnsUsed: 1,
      changedFiles: [],
    });
    adapterRegistry.registerAdapter({
      id: 'fake-adapter',
      isAvailable: vi.fn().mockResolvedValue({ available: true }),
      executeAgentStep,
    });

    const host = new RunnerHost(adapterRegistry);
    const events: RunnerResponse[] = [];

    reconstructRunsFromEventsMock.mockResolvedValue([]);
    executeCommandStepMock.mockResolvedValue({
      stdout: 'ok',
      stderr: '',
      exitCode: 0,
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
      exitCode: 0,
      timedOut: false,
      stdoutArtifactPath: '/tmp/stdout',
      stderrArtifactPath: '/tmp/stderr',
      metadataArtifactPath: '/tmp/meta',
    }));

    const workflow: RunnerRequest['payload']['workflow'] = {
      schemaVersion: 1,
      id: 'context-flow',
      name: 'Context Flow',
      steps: [
        { id: 'lint', type: 'command', command: 'pnpm lint:affected' },
        { id: 'repair', type: 'agent', prompt: 'Fix issues.', allowedPaths: ['src'], maxFilesChanged: 1, maxTurns: 2 },
      ],
    };

    host.handleMessage(
      {
        type: 'start',
        requestId: 'req-workspace-context',
        payload: {
          loopId: 'context-flow',
          loopFilePath: '/workspace/.huckleberry/loops/context-flow.yaml',
          workflow,
          execution: { isolationMode: 'workspace' },
        },
      },
      () => undefined,
      event => events.push(event),
    );

    await flushAsyncWork();

    expect(executeCommandStepMock).toHaveBeenCalled();
    expect(executeCommandStepMock.mock.calls[0][0].cwd.replace(/\\/g, '/')).toContain('/workspace');
    expect(executeAgentStep).toHaveBeenCalled();
    expect(executeAgentStep.mock.calls[0][0].cwd.replace(/\\/g, '/')).toContain('/workspace');

    const runStarted = events.find(event => event.type === 'event' && event.payload.eventType === 'run-started');
    if (runStarted?.type === 'event') {
      expect(runStarted.payload.executionContext?.mode).toBe('workspace');
      expect(runStarted.payload.executionContext?.workingDirectory.replace(/\\/g, '/')).toContain('/workspace');
    }

    host.dispose();
  });

  it('runs command and agent steps in provisioned worktree execution context', async () => {
    const adapterRegistry = new AgentAdapterRegistry();
    const executeAgentStep = vi.fn().mockResolvedValue({
      summary: 'Agent completed in worktree mode.',
      turnsUsed: 1,
      changedFiles: [],
    });
    adapterRegistry.registerAdapter({
      id: 'fake-adapter',
      isAvailable: vi.fn().mockResolvedValue({ available: true }),
      executeAgentStep,
    });

    const provisionWorktree = vi.fn().mockResolvedValue({
      runId: 'placeholder',
      loopId: 'context-flow',
      workspaceRoot: '/workspace',
      baseRef: 'HEAD',
      worktreePath: '/workspace/.huckleberry/worktrees/context-run',
      createdAt: 1,
      lastUsedAt: 1,
      active: true,
      reused: false,
    });
    const cleanupRunWorktree = vi.fn().mockResolvedValue({
      runId: 'placeholder',
      removed: true,
      preservedForActiveRuns: false,
    });

    const runDiffGenerator = vi.fn().mockResolvedValue({
      artifactPath: '/workspace/.huckleberry/runs/run-worktree/run.diff.patch',
    });
    const host = new RunnerHost(adapterRegistry, { provisionWorktree, cleanupRunWorktree }, runDiffGenerator);
    const events: RunnerResponse[] = [];

    reconstructRunsFromEventsMock.mockResolvedValue([]);
    executeCommandStepMock.mockResolvedValue({
      stdout: 'ok',
      stderr: '',
      exitCode: 0,
      timedOut: false,
      startedAt: 100,
      completedAt: 120,
      durationMs: 20,
    });
    persistStepEvidenceMock.mockImplementation(async ({ runId, stepId, attempt, command, cwd, executionContext }) => ({
      runId,
      stepId,
      attempt,
      command,
      cwd,
      executionContext,
      startedAt: 100,
      completedAt: 120,
      durationMs: 20,
      exitCode: 0,
      timedOut: false,
      stdoutArtifactPath: '/tmp/stdout',
      stderrArtifactPath: '/tmp/stderr',
      metadataArtifactPath: '/tmp/meta',
    }));

    const workflow: RunnerRequest['payload']['workflow'] = {
      schemaVersion: 1,
      id: 'context-flow',
      name: 'Context Flow',
      steps: [
        { id: 'lint', type: 'command', command: 'pnpm lint:affected' },
        { id: 'repair', type: 'agent', prompt: 'Fix issues.', allowedPaths: ['src'], maxFilesChanged: 1, maxTurns: 2 },
      ],
    };

    host.handleMessage(
      {
        type: 'start',
        requestId: 'req-worktree-context',
        payload: {
          loopId: 'context-flow',
          loopFilePath: '/workspace/.huckleberry/loops/context-flow.yaml',
          workflow,
          execution: { isolationMode: 'worktree', reuseWorktree: true },
        },
      },
      () => undefined,
      event => events.push(event),
    );

    await flushAsyncWork();

    expect(provisionWorktree).toHaveBeenCalled();
    expect(executeCommandStepMock.mock.calls[0][0].cwd).toBe('/workspace/.huckleberry/worktrees/context-run');
    expect(executeAgentStep.mock.calls[0][0].cwd).toBe('/workspace/.huckleberry/worktrees/context-run');
    expect(cleanupRunWorktree).toHaveBeenCalled();
    expect(runDiffGenerator).toHaveBeenCalledTimes(1);

    const terminalEvent = events
      .filter((event): event is Extract<RunnerResponse, { type: 'event' }> => event.type === 'event')
      .find(event => event.payload.status === 'succeeded');
    expect(terminalEvent).toBeDefined();
    expect(terminalEvent?.payload.deepLinks?.some(link => link.label === 'Open run diff artifact')).toBe(true);

    const runStarted = events.find(event => event.type === 'event' && event.payload.eventType === 'run-started');
    if (runStarted?.type === 'event') {
      expect(runStarted.payload.executionContext?.mode).toBe('worktree');
      expect(runStarted.payload.executionContext?.worktreePath).toBe('/workspace/.huckleberry/worktrees/context-run');
    }

    host.dispose();
  });

  it('emits an explicit warning event when isolated diff generation fails', async () => {
    const provisionWorktree = vi.fn().mockResolvedValue({
      runId: 'placeholder',
      loopId: 'diff-warning',
      workspaceRoot: '/workspace',
      baseRef: 'HEAD',
      worktreePath: '/workspace/.huckleberry/worktrees/diff-warning',
      createdAt: 1,
      lastUsedAt: 1,
      active: true,
      reused: false,
    });
    const cleanupRunWorktree = vi.fn().mockResolvedValue({
      runId: 'placeholder',
      removed: true,
      preservedForActiveRuns: false,
    });
    const runDiffGenerator = vi.fn().mockResolvedValue({
      artifactPath: '/workspace/.huckleberry/runs/run-diff-warning/run.diff.patch',
      warningMessage: 'Unable to generate diff artifact for isolated run.',
    });

    const host = new RunnerHost(new AgentAdapterRegistry(), { provisionWorktree, cleanupRunWorktree }, runDiffGenerator);
    const events: RunnerResponse[] = [];

    reconstructRunsFromEventsMock.mockResolvedValue([]);
    executeCommandStepMock.mockResolvedValue({
      stdout: 'ok',
      stderr: '',
      exitCode: 0,
      timedOut: false,
      startedAt: 100,
      completedAt: 120,
      durationMs: 20,
    });
    persistStepEvidenceMock.mockImplementation(async ({ runId, stepId, attempt, command, cwd, executionContext }) => ({
      runId,
      stepId,
      attempt,
      command,
      cwd,
      executionContext,
      startedAt: 100,
      completedAt: 120,
      durationMs: 20,
      exitCode: 0,
      timedOut: false,
      stdoutArtifactPath: '/tmp/stdout',
      stderrArtifactPath: '/tmp/stderr',
      metadataArtifactPath: '/tmp/meta',
    }));

    host.handleMessage(
      {
        type: 'start',
        requestId: 'req-diff-warning',
        payload: {
          loopId: 'diff-warning',
          loopFilePath: '/workspace/.huckleberry/loops/diff-warning.yaml',
          workflow: {
            schemaVersion: 1,
            id: 'diff-warning',
            name: 'Diff Warning',
            steps: [
              { id: 'lint', type: 'command', command: 'pnpm lint:affected' },
            ],
          },
          execution: { isolationMode: 'worktree' },
        },
      },
      () => undefined,
      event => events.push(event),
    );

    await flushAsyncWork();

    const warningEvent = events
      .filter((event): event is Extract<RunnerResponse, { type: 'event' }> => event.type === 'event')
      .find(event => event.payload.eventType === 'run-diff-capture-warning');

    expect(warningEvent).toBeDefined();
    expect(warningEvent?.payload.message).toContain('Unable to generate diff artifact for isolated run.');
    expect(warningEvent?.payload.deepLinks?.some(link => link.label === 'Open run diff artifact')).toBe(true);

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
      expect(failedEvent.payload.deepLinks?.some(link => link.kind === 'problems')).toBe(true);
      expect(failedEvent.payload.deepLinks?.some(link => link.kind === 'tests')).toBe(true);
      expect(failedEvent.payload.deepLinks?.some(link => link.kind === 'logs')).toBe(true);
      expect(failedEvent.payload.deepLinks?.some(link => link.kind === 'diff')).toBe(true);
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

  it('returns run summary artifacts for a run', async () => {
    const host = new RunnerHost();
    const replies: RunnerResponse[] = [];

    reconstructRunsFromEventsMock.mockResolvedValue([]);
    getRunSummaryArtifactsMock.mockResolvedValue({
      summary: {
        runId: 'historic-1',
        loopId: 'lint',
        status: 'failed',
        startedAt: 1,
        updatedAt: 2,
        completedAt: 2,
        eventCount: 3,
        terminalEventType: 'step-failed',
        stopReasonCode: 'STEP_EXIT_NON_ZERO',
        stopReason: 'Step lint failed.',
        attempts: [{ stepId: 'lint', attempts: 1 }],
        attemptTotal: 1,
        keyEvidence: [],
        unresolvedItems: [],
      },
      jsonPath: '/workspace/.huckleberry/runs/historic-1/summary.json',
      markdownPath: '/workspace/.huckleberry/runs/historic-1/summary.md',
    });

    host.handleMessage(
      {
        type: 'summary',
        requestId: 'req-summary',
        payload: {
          runId: 'historic-1',
        },
      },
      response => replies.push(response),
      () => undefined,
    );

    await flushAsyncWork();

    const summaryResponse = replies.find(reply => reply.type === 'summary');
    expect(summaryResponse).toBeDefined();
    if (summaryResponse?.type === 'summary') {
      expect(summaryResponse.payload.artifacts?.summary.runId).toBe('historic-1');
      expect(summaryResponse.payload.artifacts?.markdownPath).toContain('summary.md');
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
    if (successEvent?.type === 'event') {
      expect(successEvent.payload.agentClaim?.source).toBe('agent');
      expect(successEvent.payload.agentClaim?.summary).toBe('Agent step completed.');
    }

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

  it('executes deterministic check-repair-recheck until the check succeeds', async () => {
    const adapterRegistry = new AgentAdapterRegistry();
    const executeAgentStep = vi.fn().mockResolvedValue({
      summary: 'Applied repair changes.',
      turnsUsed: 1,
      changedFiles: ['src/repair.ts'],
    });

    adapterRegistry.registerAdapter({
      id: 'fake-adapter',
      isAvailable: vi.fn().mockResolvedValue({ available: true }),
      executeAgentStep,
    });

    const host = new RunnerHost(adapterRegistry);
    const events: RunnerResponse[] = [];
    reconstructRunsFromEventsMock.mockResolvedValue([]);

    executeCommandStepMock
      .mockResolvedValueOnce({
        stdout: '',
        stderr: 'check failed',
        exitCode: 1,
        timedOut: false,
        cancelled: false,
        startedAt: 100,
        completedAt: 130,
        durationMs: 30,
      })
      .mockResolvedValueOnce({
        stdout: 'all good',
        stderr: '',
        exitCode: 0,
        timedOut: false,
        cancelled: false,
        startedAt: 200,
        completedAt: 220,
        durationMs: 20,
      });

    persistStepEvidenceMock
      .mockImplementationOnce(async ({ runId, stepId, attempt, command, cwd }) => ({
        runId,
        stepId,
        attempt,
        command,
        cwd,
        startedAt: 100,
        completedAt: 130,
        durationMs: 30,
        exitCode: 1,
        timedOut: false,
        cancelled: false,
        stdoutArtifactPath: '/tmp/stdout-1',
        stderrArtifactPath: '/tmp/stderr-1',
        metadataArtifactPath: '/tmp/metadata-1',
      }))
      .mockImplementationOnce(async ({ runId, stepId, attempt, command, cwd }) => ({
        runId,
        stepId,
        attempt,
        command,
        cwd,
        startedAt: 200,
        completedAt: 220,
        durationMs: 20,
        exitCode: 0,
        timedOut: false,
        cancelled: false,
        stdoutArtifactPath: '/tmp/stdout-2',
        stderrArtifactPath: '/tmp/stderr-2',
        metadataArtifactPath: '/tmp/metadata-2',
      }));

    host.handleMessage(
      {
        type: 'start',
        requestId: 'req-repair-success',
        payload: {
          loopId: 'repair-loop',
          loopFilePath: '/workspace/.huckleberry/loops/repair.yaml',
          workflow: {
            schemaVersion: 1,
            id: 'repair-loop',
            name: 'Repair Loop',
            steps: [
              {
                id: 'check',
                type: 'command',
                command: 'pnpm test:affected',
                onFailure: 'repair',
              },
              {
                id: 'repair',
                type: 'agent',
                prompt: 'Repair failing check.',
                allowedPaths: ['src'],
                maxFilesChanged: 2,
                maxTurns: 3,
                retry: {
                  target: 'check',
                  maxAttempts: 2,
                },
              },
            ],
          } as unknown as RunnerRequest['payload']['workflow'],
        },
      },
      () => undefined,
      event => events.push(event),
    );

    await flushAsyncWork();

    expect(executeCommandStepMock).toHaveBeenCalledTimes(2);
    expect(executeAgentStep).toHaveBeenCalledTimes(1);

    const repairEvent = events.find(
      event => event.type === 'event' && event.payload.eventType === 'repair-attempt',
    );
    expect(repairEvent).toBeDefined();
    if (repairEvent?.type === 'event') {
      expect(repairEvent.payload.transition?.attempt).toBe(1);
    }

    const succeededEvent = events.find(
      event => event.type === 'event' && event.payload.status === 'succeeded',
    );
    expect(succeededEvent).toBeDefined();

    host.dispose();
  });

  it('marks runs as exhausted when repair attempts are consumed', async () => {
    const adapterRegistry = new AgentAdapterRegistry();
    adapterRegistry.registerAdapter({
      id: 'fake-adapter',
      isAvailable: vi.fn().mockResolvedValue({ available: true }),
      executeAgentStep: vi.fn().mockResolvedValue({
        summary: 'Applied repair changes.',
        turnsUsed: 1,
        changedFiles: ['src/repair.ts'],
      }),
    });

    const host = new RunnerHost(adapterRegistry);
    const events: RunnerResponse[] = [];
    reconstructRunsFromEventsMock.mockResolvedValue([]);

    executeCommandStepMock.mockResolvedValue({
      stdout: '',
      stderr: 'still failing',
      exitCode: 1,
      timedOut: false,
      cancelled: false,
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
      exitCode: 1,
      timedOut: false,
      cancelled: false,
      stdoutArtifactPath: `/tmp/stdout-${attempt}`,
      stderrArtifactPath: `/tmp/stderr-${attempt}`,
      metadataArtifactPath: `/tmp/metadata-${attempt}`,
    }));

    host.handleMessage(
      {
        type: 'start',
        requestId: 'req-repair-exhausted',
        payload: {
          loopId: 'repair-loop',
          loopFilePath: '/workspace/.huckleberry/loops/repair.yaml',
          workflow: {
            schemaVersion: 1,
            id: 'repair-loop',
            name: 'Repair Loop',
            steps: [
              {
                id: 'check',
                type: 'command',
                command: 'pnpm test:affected',
                onFailure: 'repair',
              },
              {
                id: 'repair',
                type: 'agent',
                prompt: 'Repair failing check.',
                allowedPaths: ['src'],
                maxFilesChanged: 2,
                maxTurns: 3,
                retry: {
                  target: 'check',
                  maxAttempts: 1,
                },
              },
            ],
          } as unknown as RunnerRequest['payload']['workflow'],
        },
      },
      () => undefined,
      event => events.push(event),
    );

    await flushAsyncWork();

    const exhaustedEvent = events.find(
      event => event.type === 'event' && event.payload.status === 'exhausted',
    );
    expect(exhaustedEvent).toBeDefined();
    if (exhaustedEvent?.type === 'event') {
      expect(exhaustedEvent.payload.stopReason?.code).toBe('REPAIR_ATTEMPTS_EXHAUSTED');
    }

    host.dispose();
  });

  it('pauses at approval and resumes on approve with auditable decision metadata', async () => {
    const host = new RunnerHost();
    const replies: RunnerResponse[] = [];
    const events: RunnerResponse[] = [];

    reconstructRunsFromEventsMock.mockResolvedValue([]);
    executeCommandStepMock.mockResolvedValue({
      stdout: 'ok',
      stderr: '',
      exitCode: 0,
      timedOut: false,
      cancelled: false,
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
      exitCode: 0,
      timedOut: false,
      cancelled: false,
      stdoutArtifactPath: '/tmp/stdout',
      stderrArtifactPath: '/tmp/stderr',
      metadataArtifactPath: '/tmp/metadata',
    }));

    host.handleMessage(
      {
        type: 'start',
        requestId: 'req-approval-start',
        payload: {
          loopId: 'approval-loop',
          loopFilePath: '/workspace/.huckleberry/loops/approval.yaml',
          workflow: {
            schemaVersion: 1,
            id: 'approval-loop',
            name: 'Approval Loop',
            steps: [
              { id: 'gate', type: 'approval' },
              { id: 'post-approval', type: 'command', command: 'echo ok' },
            ],
          } as unknown as RunnerRequest['payload']['workflow'],
        },
      },
      response => replies.push(response),
      event => events.push(event),
    );

    await flushAsyncWork();

    const startAck = replies.find(reply => reply.type === 'ack' && reply.requestId === 'req-approval-start');
    expect(startAck).toBeDefined();
    if (startAck?.type !== 'ack' || !startAck.payload.runId) {
      host.dispose();
      throw new Error('Expected start ack run id');
    }

    const pausedEvent = events.find(
      event => event.type === 'event' && event.payload.eventType === 'approval-requested',
    );
    expect(pausedEvent).toBeDefined();

    host.handleMessage(
      {
        type: 'approvalAction',
        requestId: 'req-approval-approve',
        payload: {
          runId: startAck.payload.runId,
          action: 'approve',
          actorId: 'alice',
          actorName: 'Alice',
          note: 'Looks good',
        },
      },
      response => replies.push(response),
      event => events.push(event),
    );

    await flushAsyncWork();

    const decisionEvent = events.find(
      event => event.type === 'event' && event.payload.eventType === 'approval-approve',
    );
    expect(decisionEvent).toBeDefined();
    if (decisionEvent?.type === 'event') {
      expect(decisionEvent.payload.approvalDecision?.actorId).toBe('alice');
      expect(decisionEvent.payload.approvalDecision?.action).toBe('approve');
    }

    const succeededEvent = events.find(
      event => event.type === 'event' && event.payload.status === 'succeeded',
    );
    expect(succeededEvent).toBeDefined();
    expect(executeCommandStepMock).toHaveBeenCalledTimes(1);

    host.dispose();
  });

  it('records rejection decisions and stops run when no reject branch is configured', async () => {
    const host = new RunnerHost();
    const replies: RunnerResponse[] = [];
    const events: RunnerResponse[] = [];

    reconstructRunsFromEventsMock.mockResolvedValue([]);

    host.handleMessage(
      {
        type: 'start',
        requestId: 'req-reject-start',
        payload: {
          loopId: 'approval-loop',
          loopFilePath: '/workspace/.huckleberry/loops/approval.yaml',
          workflow: {
            schemaVersion: 1,
            id: 'approval-loop',
            name: 'Approval Loop',
            steps: [{ id: 'gate', type: 'approval' }],
          } as unknown as RunnerRequest['payload']['workflow'],
        },
      },
      response => replies.push(response),
      event => events.push(event),
    );

    await flushAsyncWork();

    const startAck = replies.find(reply => reply.type === 'ack' && reply.requestId === 'req-reject-start');
    if (startAck?.type !== 'ack' || !startAck.payload.runId) {
      host.dispose();
      throw new Error('Expected start ack run id');
    }

    host.handleMessage(
      {
        type: 'approvalAction',
        requestId: 'req-reject-action',
        payload: {
          runId: startAck.payload.runId,
          action: 'reject',
          actorId: 'bob',
        },
      },
      response => replies.push(response),
      event => events.push(event),
    );

    await flushAsyncWork();

    const failedEvent = events.find(
      event => event.type === 'event' && event.payload.status === 'failed',
    );
    expect(failedEvent).toBeDefined();
    if (failedEvent?.type === 'event') {
      expect(failedEvent.payload.stopReason?.code).toBe('APPROVAL_REJECTED');
    }

    host.dispose();
  });

  it('records defer decisions and keeps run paused when no defer branch is configured', async () => {
    const host = new RunnerHost();
    const replies: RunnerResponse[] = [];
    const events: RunnerResponse[] = [];

    reconstructRunsFromEventsMock.mockResolvedValue([]);

    host.handleMessage(
      {
        type: 'start',
        requestId: 'req-defer-start',
        payload: {
          loopId: 'approval-loop',
          loopFilePath: '/workspace/.huckleberry/loops/approval.yaml',
          workflow: {
            schemaVersion: 1,
            id: 'approval-loop',
            name: 'Approval Loop',
            steps: [{ id: 'gate', type: 'approval' }],
          } as unknown as RunnerRequest['payload']['workflow'],
        },
      },
      response => replies.push(response),
      event => events.push(event),
    );

    await flushAsyncWork();

    const startAck = replies.find(reply => reply.type === 'ack' && reply.requestId === 'req-defer-start');
    if (startAck?.type !== 'ack' || !startAck.payload.runId) {
      host.dispose();
      throw new Error('Expected start ack run id');
    }

    host.handleMessage(
      {
        type: 'approvalAction',
        requestId: 'req-defer-action',
        payload: {
          runId: startAck.payload.runId,
          action: 'defer',
          actorId: 'charlie',
          note: 'Need more context',
        },
      },
      response => replies.push(response),
      event => events.push(event),
    );

    await flushAsyncWork();

    const deferEvent = events.find(
      event => event.type === 'event' && event.payload.eventType === 'approval-defer',
    );
    expect(deferEvent).toBeDefined();
    if (deferEvent?.type === 'event') {
      expect(deferEvent.payload.approvalDecision?.note).toBe('Need more context');
    }

    const terminalEvent = events.find(
      event =>
        event.type === 'event'
        && (event.payload.status === 'succeeded'
          || event.payload.status === 'failed'
          || event.payload.status === 'cancelled'
          || event.payload.status === 'exhausted'),
    );
    expect(terminalEvent).toBeUndefined();

    host.dispose();
  });
});
