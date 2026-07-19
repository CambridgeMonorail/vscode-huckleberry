import { describe, expect, it } from 'vitest';
import { WorkflowDefinition, validateWorkflowDefinition } from '@huckleberry/extension/workflows';

function createBaseWorkflow(): WorkflowDefinition {
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
        id: 'typecheck',
        type: 'command',
        command: 'pnpm typecheck:affected',
      },
      {
        id: 'tests',
        type: 'command',
        command: 'pnpm test:affected',
      },
    ],
  };
}

describe('validateWorkflowDefinition', () => {
  it('returns valid for a structurally and semantically valid workflow', () => {
    const workflow = createBaseWorkflow();

    const result = validateWorkflowDefinition(workflow);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('rejects malformed workflow id', () => {
    const workflow = {
      ...createBaseWorkflow(),
      id: 'Invalid Workflow Id',
    };

    const result = validateWorkflowDefinition(workflow);

    expect(result.valid).toBe(false);
    expect(result.errors.some(error => error.code === 'WORKFLOW_ID_INVALID')).toBe(true);
  });

  it('rejects malformed and duplicated step ids', () => {
    const workflow: WorkflowDefinition = {
      ...createBaseWorkflow(),
      steps: [
        {
          id: 'lint',
          type: 'command',
          command: 'pnpm lint:affected',
        },
        {
          id: 'lint',
          type: 'command',
          command: 'pnpm typecheck:affected',
        },
        {
          id: 'BAD Step',
          type: 'command',
          command: 'pnpm test:affected',
        },
      ],
    };

    const result = validateWorkflowDefinition(workflow);

    expect(result.valid).toBe(false);
    expect(result.errors.some(error => error.code === 'STEP_ID_DUPLICATE')).toBe(true);
    expect(result.errors.some(error => error.code === 'STEP_ID_INVALID')).toBe(true);
  });

  it('rejects condition steps that reference unknown step ids', () => {
    const workflow: WorkflowDefinition = {
      schemaVersion: 1,
      id: 'conditional-flow',
      name: 'Conditional Flow',
      steps: [
        {
          id: 'start',
          type: 'command',
          command: 'echo start',
        },
        {
          id: 'branch',
          type: 'condition',
          expression: 'success() ',
          true: 'success-step',
          false: 'failure-step',
        },
      ],
    };

    const result = validateWorkflowDefinition(workflow);

    expect(result.valid).toBe(false);
    expect(result.errors.filter(error => error.code === 'STEP_REF_MISSING')).toHaveLength(2);
  });
});
