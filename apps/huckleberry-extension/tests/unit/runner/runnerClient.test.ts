import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EventEmitter } from 'events';

const fakeFork = vi.fn();

vi.mock('child_process', () => {
  return {
    fork: (...args: unknown[]) => fakeFork(...args),
  };
});

vi.mock('vscode', () => {
  class MockEventEmitter<T> {
    private listeners: Array<(event: T) => void> = [];

    event = (listener: (event: T) => void): { dispose: () => void } => {
      this.listeners.push(listener);
      return {
        dispose: () => {
          this.listeners = this.listeners.filter(existing => existing !== listener);
        },
      };
    };

    fire(event: T): void {
      for (const listener of this.listeners) {
        listener(event);
      }
    }

    dispose(): void {
      this.listeners = [];
    }
  }

  return {
    window: {
      showInformationMessage: vi.fn(),
      showErrorMessage: vi.fn(),
      showQuickPick: vi.fn(),
      showInputBox: vi.fn(),
      showOpenDialog: vi.fn(),
      createOutputChannel: vi.fn(() => ({ appendLine: vi.fn() })),
    },
    workspace: {
      workspaceFolders: [],
    },
    EventEmitter: MockEventEmitter,
  };
});

import { RunnerClient } from '@huckleberry/extension/runner/runnerClient';
import { RunnerRequest, RunnerResponse } from '@huckleberry/extension/runner/types';

class FakeChildProcess extends EventEmitter {
  connected = true;

  send(request: RunnerRequest): boolean {
    const response: RunnerResponse =
      request.type === 'start'
        ? {
            type: 'ack',
            requestId: request.requestId,
            payload: {
              ok: true,
              runId: 'run-1',
            },
          }
        : request.type === 'listRuns'
          ? {
              type: 'runs',
              requestId: request.requestId,
              payload: {
                runs: [
                  {
                    runId: 'run-1',
                    loopId: 'lint',
                    loopFilePath: '/workspace/.huckleberry/loops/lint.yaml',
                    status: 'succeeded',
                    startedAt: Date.now(),
                    updatedAt: Date.now(),
                    completedAt: Date.now(),
                  },
                ],
              },
            }
        : request.type === 'events'
          ? {
              type: 'events',
              requestId: request.requestId,
              payload: {
                events: [
                  {
                    runId: request.payload.runId,
                    loopId: 'lint',
                    loopFilePath: '/workspace/.huckleberry/loops/lint.yaml',
                    status: 'running',
                    eventType: 'step-started',
                    timestamp: Date.now(),
                    message: 'step started',
                  },
                ],
              },
            }
          : request.type === 'summary'
            ? {
                type: 'summary',
                requestId: request.requestId,
                payload: {
                  artifacts: {
                    summary: {
                      runId: request.payload.runId,
                      loopId: 'lint',
                      status: 'failed',
                      startedAt: 100,
                      updatedAt: 200,
                      completedAt: 200,
                      eventCount: 4,
                      terminalEventType: 'step-failed',
                      stopReasonCode: 'STEP_EXIT_NON_ZERO',
                      stopReason: 'Step failed.',
                      attempts: [{ stepId: 'lint', attempts: 2 }],
                      attemptTotal: 2,
                      keyEvidence: [],
                      unresolvedItems: [],
                    },
                    jsonPath: '/workspace/.huckleberry/runs/run-1/summary.json',
                    markdownPath: '/workspace/.huckleberry/runs/run-1/summary.md',
                  },
                },
              }
          : request.type === 'approvalAction'
            ? {
                type: 'ack',
                requestId: request.requestId,
                payload: {
                  ok: true,
                  runId: request.payload.runId,
                },
              }
        : {
            type: 'status',
            requestId: request.requestId,
            payload: {
              run: {
                runId: 'run-1',
                loopId: 'lint',
                loopFilePath: '/workspace/.huckleberry/loops/lint.yaml',
                status: 'running',
                startedAt: Date.now(),
                updatedAt: Date.now(),
              },
            },
          };

    setTimeout(() => {
      this.emit('message', response);
    }, 0);

    return true;
  }

  kill(): void {
    this.connected = false;
  }
}

describe('RunnerClient', () => {
  let client: RunnerClient;

  beforeEach(() => {
    fakeFork.mockReturnValue(new FakeChildProcess());
    client = new RunnerClient();
  });

  afterEach(() => {
    client.dispose();
    vi.clearAllMocks();
  });

  it('starts run through IPC and returns run id', async () => {
    const runId = await client.startRun('lint', '/workspace/.huckleberry/loops/lint.yaml');
    expect(runId).toBe('run-1');
    expect(fakeFork).toHaveBeenCalledTimes(1);
  });

  it('strips inspect flags from the runner subprocess exec arguments', async () => {
    const originalExecArgv = process.execArgv;
    process.execArgv = ['--inspect-brk=9229', '--trace-warnings'];

    try {
      await client.startRun('lint', '/workspace/.huckleberry/loops/lint.yaml');

      expect(fakeFork).toHaveBeenCalledWith(
        expect.any(String),
        [],
        expect.objectContaining({
          execArgv: ['--trace-warnings'],
        }),
      );
    } finally {
      process.execArgv = originalExecArgv;
    }
  });

  it('queries run status through IPC', async () => {
    const status = await client.getStatus('run-1');
    expect(status?.runId).toBe('run-1');
    expect(status?.status).toBe('running');
  });

  it('lists persisted runs through IPC', async () => {
    const runs = await client.listRuns();
    expect(runs).toHaveLength(1);
    expect(runs[0].status).toBe('succeeded');
  });

  it('fetches run events through IPC', async () => {
    const events = await client.getRunEvents('run-1');
    expect(events).toHaveLength(1);
    expect(events[0].eventType).toBe('step-started');
  });

  it('fetches run summary artifacts through IPC', async () => {
    const artifacts = await client.getRunSummary('run-1');
    expect(artifacts?.summary.runId).toBe('run-1');
    expect(artifacts?.summary.status).toBe('failed');
    expect(artifacts?.markdownPath).toContain('summary.md');
  });

  it('submits approval actions through IPC', async () => {
    await expect(
      client.submitApprovalAction('run-1', 'approve', 'alice', 'Alice', 'Looks good'),
    ).resolves.toBeUndefined();
  });

  it('recovers by respawning runner process after unexpected exit', async () => {
    class CrashingChildProcess extends EventEmitter {
      connected = true;

      send(): boolean {
        return true;
      }

      kill(): void {
        this.connected = false;
      }
    }

    const firstChild = new CrashingChildProcess();
    const secondChild = new FakeChildProcess();
    fakeFork
      .mockImplementationOnce(() => firstChild)
      .mockImplementationOnce(() => secondChild);

    const recoveryClient = new RunnerClient();

    const pendingStatus = recoveryClient.getStatus('run-before-crash');
    firstChild.emit('exit', 1);

    await expect(pendingStatus).rejects.toThrow(/Runner process exited unexpectedly/);

    const recoveredStatus = await recoveryClient.getStatus('run-after-restart');
    expect(recoveredStatus?.runId).toBe('run-1');
    expect(fakeFork).toHaveBeenCalledTimes(2);

    recoveryClient.dispose();
  });
});
