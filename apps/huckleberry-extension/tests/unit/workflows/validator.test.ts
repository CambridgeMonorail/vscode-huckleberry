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

  it('accepts agent steps with explicit constraints', () => {
    const workflow: WorkflowDefinition = {
      schemaVersion: 1,
      id: 'agent-flow',
      name: 'Agent Flow',
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
    };

    const result = validateWorkflowDefinition(workflow);

    expect(result.valid).toBe(true);
  });

  it('rejects agent steps missing explicit constraints', () => {
    const workflow = {
      schemaVersion: 1,
      id: 'agent-flow',
      name: 'Agent Flow',
      steps: [
        {
          id: 'repair',
          type: 'agent',
          prompt: '',
          allowedPaths: [],
          maxFilesChanged: 0,
          maxTurns: 0,
        },
      ],
    };

    const result = validateWorkflowDefinition(workflow);

    expect(result.valid).toBe(false);
    expect(result.errors.some(error => error.code === 'AGENT_PROMPT_INVALID')).toBe(true);
    expect(result.errors.some(error => error.code === 'AGENT_ALLOWED_PATHS_INVALID')).toBe(true);
    expect(result.errors.some(error => error.code === 'AGENT_MAX_FILES_CHANGED_INVALID')).toBe(true);
    expect(result.errors.some(error => error.code === 'AGENT_MAX_TURNS_INVALID')).toBe(true);
  });

  it('accepts valid command onFailure and agent retry wiring', () => {
    const workflow: WorkflowDefinition = {
      schemaVersion: 1,
      id: 'repair-flow',
      name: 'Repair Flow',
      steps: [
        {
          id: 'typecheck',
          type: 'command',
          command: 'pnpm typecheck:affected',
          onFailure: 'repair-typecheck',
        },
        {
          id: 'repair-typecheck',
          type: 'agent',
          prompt: 'Fix typecheck failures.',
          allowedPaths: ['src'],
          maxFilesChanged: 5,
          maxTurns: 4,
          retry: {
            target: 'typecheck',
            maxAttempts: 2,
          },
        },
      ],
    };

    const result = validateWorkflowDefinition(workflow);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('rejects command onFailure links that are not valid repair loops', () => {
    const workflow = {
      schemaVersion: 1,
      id: 'invalid-repair-flow',
      name: 'Invalid Repair Flow',
      steps: [
        {
          id: 'typecheck',
          type: 'command',
          command: 'pnpm typecheck:affected',
          onFailure: 'repair-typecheck',
        },
        {
          id: 'repair-typecheck',
          type: 'agent',
          prompt: 'Fix typecheck failures.',
          allowedPaths: ['src'],
          maxFilesChanged: 5,
          maxTurns: 4,
          retry: {
            target: 'lint',
            maxAttempts: 0,
          },
        },
      ],
    };

    const result = validateWorkflowDefinition(workflow);

    expect(result.valid).toBe(false);
    expect(result.errors.some(error => error.code === 'AGENT_RETRY_MAX_ATTEMPTS_INVALID')).toBe(true);
    expect(result.errors.some(error => error.code === 'AGENT_RETRY_TARGET_MISMATCH')).toBe(true);
  });

  it('accepts approval steps with valid branch semantics', () => {
    const workflow: WorkflowDefinition = {
      schemaVersion: 1,
      id: 'approval-flow',
      name: 'Approval Flow',
      steps: [
        {
          id: 'gate',
          type: 'approval',
          onApprove: 'tests',
          onReject: 'notify',
          onDefer: 'notify',
        },
        {
          id: 'tests',
          type: 'command',
          command: 'pnpm test:affected',
        },
        {
          id: 'notify',
          type: 'command',
          command: 'echo waiting',
        },
      ],
    };

    const result = validateWorkflowDefinition(workflow);

    expect(result.valid).toBe(true);
  });

  it('rejects approval branches that reference missing steps', () => {
    const workflow = {
      schemaVersion: 1,
      id: 'approval-flow',
      name: 'Approval Flow',
      steps: [
        {
          id: 'gate',
          type: 'approval',
          onApprove: 'missing-step',
        },
      ],
    };

    const result = validateWorkflowDefinition(workflow);

    expect(result.valid).toBe(false);
    expect(result.errors.some(error => error.code === 'APPROVAL_BRANCH_MISSING')).toBe(true);
  });

  it('accepts execution isolation mode when set to worktree', () => {
    const workflow: WorkflowDefinition = {
      ...createBaseWorkflow(),
      execution: {
        isolation: 'worktree',
      },
    };

    const result = validateWorkflowDefinition(workflow);

    expect(result.valid).toBe(true);
  });

  it('rejects invalid execution isolation mode values', () => {
    const workflow = {
      ...createBaseWorkflow(),
      execution: {
        isolation: 'sandbox',
      },
    };

    const result = validateWorkflowDefinition(workflow);

    expect(result.valid).toBe(false);
    expect(result.errors.some(error => error.code === 'EXECUTION_ISOLATION_INVALID')).toBe(true);
  });
});
