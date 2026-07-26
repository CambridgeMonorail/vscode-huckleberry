import { describe, expect, it, vi, beforeEach } from 'vitest';

const selectChatModelsMock = vi.fn();
const sendRequestMock = vi.fn();

vi.mock('vscode', () => {
  class MockCancellationTokenSource {
    token = {};
  }

  class MockLanguageModelError extends Error {}

  return {
    lm: {
      selectChatModels: (...args: unknown[]) => selectChatModelsMock(...args),
    },
    LanguageModelChatMessage: {
      Assistant: (content: string) => ({ role: 'assistant', content }),
      User: (content: string) => ({ role: 'user', content }),
    },
    CancellationTokenSource: MockCancellationTokenSource,
    LanguageModelError: MockLanguageModelError,
  };
});

import { CopilotAgentAdapter } from '../../../src/runner/copilotAgentAdapter';

describe('CopilotAgentAdapter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('reports unavailable when explicitly disabled', async () => {
    const adapter = new CopilotAgentAdapter({ enabled: false });

    const availability = await adapter.isAvailable();

    expect(availability.available).toBe(false);
    expect(availability.reason).toContain('disabled');
  });

  it('reports unavailable when no models are returned', async () => {
    selectChatModelsMock.mockResolvedValue([]);
    const adapter = new CopilotAgentAdapter();

    const availability = await adapter.isAvailable();

    expect(availability.available).toBe(false);
    expect(availability.reason).toContain('No compatible Copilot chat model');
  });

  it('executes an agent step through the selected model', async () => {
    sendRequestMock.mockResolvedValue({
      text: (async function* (): AsyncGenerator<string> {
        yield 'Applied the requested fix.';
      })(),
    });
    selectChatModelsMock.mockResolvedValue([
      {
        sendRequest: sendRequestMock,
      },
    ]);

    const adapter = new CopilotAgentAdapter();
    const result = await adapter.executeAgentStep({
      runId: 'run-1',
      loopId: 'loop-1',
      stepId: 'repair',
      prompt: 'Fix the failing test.',
      cwd: '/workspace',
      attempt: 1,
      allowedPaths: ['src'],
      maxFilesChanged: 2,
      maxTurns: 3,
    });

    expect(sendRequestMock).toHaveBeenCalledTimes(1);
    expect(result.summary).toContain('Applied the requested fix.');
    expect(result.turnsUsed).toBe(1);
    expect(result.changedFiles).toEqual([]);
    expect(result.adapterId).toBe('copilot');
  });

  it('maps provider runtime failures to explicit adapter errors', async () => {
    sendRequestMock.mockRejectedValue(new Error('provider offline'));
    selectChatModelsMock.mockResolvedValue([
      {
        sendRequest: sendRequestMock,
      },
    ]);

    const adapter = new CopilotAgentAdapter();

    await expect(
      adapter.executeAgentStep({
        runId: 'run-1',
        loopId: 'loop-1',
        stepId: 'repair',
        prompt: 'Fix the failing test.',
        cwd: '/workspace',
        attempt: 1,
        allowedPaths: ['src'],
        maxFilesChanged: 2,
        maxTurns: 3,
      }),
    ).rejects.toThrow('Copilot agent step execution failed. provider offline');
  });
});