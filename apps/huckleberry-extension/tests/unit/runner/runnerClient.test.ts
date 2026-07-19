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

  it('queries run status through IPC', async () => {
    const status = await client.getStatus('run-1');
    expect(status?.runId).toBe('run-1');
    expect(status?.status).toBe('running');
  });
});
