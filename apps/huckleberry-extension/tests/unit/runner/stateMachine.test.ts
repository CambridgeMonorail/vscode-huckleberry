import { describe, expect, it } from 'vitest';
import { runStateMachine } from '@huckleberry/extension/runner';
import { WorkflowDefinition } from '@huckleberry/extension/workflows';

function createWorkflow(): WorkflowDefinition {
  return {
    schemaVersion: 1,
    id: 'validate-affected',
    name: 'Validate Affected',
    steps: [
      {
        id: 'lint',
        type: 'command',
        command: 'pnpm lint:affected',
      },
      {
        id: 'branch',
        type: 'condition',
        expression: 'shouldRunTests',
        true: 'tests',
        false: 'done',
      },
      {
        id: 'tests',
        type: 'command',
        command: 'pnpm test:affected',
      },
      {
        id: 'done',
        type: 'approval',
      },
    ],
  };
}

describe('runStateMachine', () => {
  it('produces deterministic transitions for identical inputs', () => {
    const workflow = createWorkflow();

    const first = runStateMachine(workflow, {
      conditionInputs: {
        shouldRunTests: true,
      },
    });

    const second = runStateMachine(workflow, {
      conditionInputs: {
        shouldRunTests: true,
      },
    });

    expect(first).toEqual(second);
  });

  it('enforces retry limits and returns failed terminal state when retries are exhausted', () => {
    const workflow = createWorkflow();

    const result = runStateMachine(workflow, {
      failStepIds: ['tests'],
      maxStepRetries: 1,
      conditionInputs: {
        shouldRunTests: true,
      },
    });

    expect(result.finalStatus).toBe('failed');
    const retryTransitions = result.transitions.filter(transition => transition.reason === 'step-retry');
    expect(retryTransitions).toHaveLength(1);
  });

  it('enforces timeout budget and fails timed-out steps', () => {
    const workflow = createWorkflow();

    const result = runStateMachine(workflow, {
      stepTimeoutMs: 10,
      simulatedStepDurationMs: 100,
    });

    expect(result.finalStatus).toBe('failed');
    expect(result.stopReason).toBe('step-timeout');
  });
});
