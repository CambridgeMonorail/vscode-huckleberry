import {
  WorkflowValidationError,
  WorkflowValidationResult,
} from './types';

const WORKFLOW_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SUPPORTED_STEP_TYPES = new Set(['command', 'condition', 'approval', 'agent', 'artifact']);

function asRecord(value: unknown): Record<string, unknown> | undefined {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return undefined;
}

function validateWorkflowId(workflowId: string): WorkflowValidationError[] {
  if (WORKFLOW_ID_PATTERN.test(workflowId)) {
    return [];
  }

  return [
    {
      code: 'WORKFLOW_ID_INVALID',
      message: 'Workflow id must be kebab-case using lowercase letters and digits.',
      path: 'id',
    },
  ];
}

function validateWorkflowSteps(steps: unknown[]): WorkflowValidationError[] {
  const errors: WorkflowValidationError[] = [];

  if (steps.length === 0) {
    errors.push({
      code: 'STEPS_EMPTY',
      message: 'Workflow must include at least one step.',
      path: 'steps',
    });
    return errors;
  }

  const stepIds = new Set<string>();

  for (let index = 0; index < steps.length; index += 1) {
    const stepRecord = asRecord(steps[index]);
    if (!stepRecord) {
      errors.push({
        code: 'STEP_INVALID',
        message: 'Step entry must be an object.',
        path: `steps[${index}]`,
      });
      continue;
    }

    const stepId = stepRecord['id'];
    if (typeof stepId !== 'string') {
      errors.push({
        code: 'STEP_ID_MISSING',
        message: 'Step id is required and must be a string.',
        path: `steps[${index}].id`,
      });
      continue;
    }

    if (!WORKFLOW_ID_PATTERN.test(stepId)) {
      errors.push({
        code: 'STEP_ID_INVALID',
        message: `Step id '${stepId}' must be kebab-case using lowercase letters and digits.`,
        path: `steps[${index}].id`,
      });
    }

    if (stepIds.has(stepId)) {
      errors.push({
        code: 'STEP_ID_DUPLICATE',
        message: `Step id '${stepId}' is duplicated. Step ids must be unique.`,
        path: `steps[${index}].id`,
      });
    }

    stepIds.add(stepId);
  }

  for (let index = 0; index < steps.length; index += 1) {
    const stepRecord = asRecord(steps[index]);
    if (!stepRecord) {
      continue;
    }

    const stepType = stepRecord['type'];
    if (typeof stepType !== 'string' || !SUPPORTED_STEP_TYPES.has(stepType)) {
      errors.push({
        code: 'STEP_TYPE_INVALID',
        message: `Step type '${String(stepType)}' is not supported.`,
        path: `steps[${index}].type`,
      });
      continue;
    }

    if (stepType === 'condition') {
      errors.push(...validateConditionStepReferences(stepRecord, index, stepIds));
      continue;
    }

    if (stepType === 'agent') {
      errors.push(...validateAgentStep(stepRecord, index));
    }
  }

  return errors;
}

function validateAgentStep(
  step: Record<string, unknown>,
  index: number,
): WorkflowValidationError[] {
  const errors: WorkflowValidationError[] = [];
  const stepId = typeof step['id'] === 'string' ? step['id'] : '(unknown-step)';

  if (typeof step['prompt'] !== 'string' || step['prompt'].trim().length === 0) {
    errors.push({
      code: 'AGENT_PROMPT_INVALID',
      message: `Agent step '${stepId}' must define a non-empty prompt string.`,
      path: `steps[${index}].prompt`,
    });
  }

  const allowedPaths = step['allowedPaths'];
  if (!Array.isArray(allowedPaths) || allowedPaths.length === 0) {
    errors.push({
      code: 'AGENT_ALLOWED_PATHS_INVALID',
      message: `Agent step '${stepId}' must define at least one allowed path.`,
      path: `steps[${index}].allowedPaths`,
    });
  } else {
    for (let pathIndex = 0; pathIndex < allowedPaths.length; pathIndex += 1) {
      const allowedPath = allowedPaths[pathIndex];
      if (typeof allowedPath !== 'string' || allowedPath.trim().length === 0) {
        errors.push({
          code: 'AGENT_ALLOWED_PATH_INVALID',
          message: `Agent step '${stepId}' contains an invalid allowed path entry.`,
          path: `steps[${index}].allowedPaths[${pathIndex}]`,
        });
      }
    }
  }

  if (!isPositiveInteger(step['maxFilesChanged'])) {
    errors.push({
      code: 'AGENT_MAX_FILES_CHANGED_INVALID',
      message: `Agent step '${stepId}' must define a positive integer maxFilesChanged value.`,
      path: `steps[${index}].maxFilesChanged`,
    });
  }

  if (!isPositiveInteger(step['maxTurns'])) {
    errors.push({
      code: 'AGENT_MAX_TURNS_INVALID',
      message: `Agent step '${stepId}' must define a positive integer maxTurns value.`,
      path: `steps[${index}].maxTurns`,
    });
  }

  if (step['adapter'] !== undefined && typeof step['adapter'] !== 'string') {
    errors.push({
      code: 'AGENT_ADAPTER_INVALID',
      message: `Agent step '${stepId}' adapter must be a string when provided.`,
      path: `steps[${index}].adapter`,
    });
  }

  return errors;
}

function isPositiveInteger(value: unknown): boolean {
  return typeof value === 'number' && Number.isInteger(value) && value > 0;
}

function validateConditionStepReferences(
  step: Record<string, unknown>,
  index: number,
  stepIds: Set<string>,
): WorkflowValidationError[] {
  const errors: WorkflowValidationError[] = [];
  const stepId = typeof step['id'] === 'string' ? step['id'] : '(unknown-step)';

  const trueStep = step['true'];
  const falseStep = step['false'];

  if (typeof trueStep !== 'string') {
    errors.push({
      code: 'STEP_REF_INVALID',
      message: `Condition step '${stepId}' must define a string true branch reference.`,
      path: `steps[${index}].true`,
    });
  } else if (!stepIds.has(trueStep)) {
    errors.push({
      code: 'STEP_REF_MISSING',
      message: `Condition step '${stepId}' references missing true branch step '${trueStep}'.`,
      path: `steps[${index}].true`,
    });
  }

  if (typeof falseStep !== 'string') {
    errors.push({
      code: 'STEP_REF_INVALID',
      message: `Condition step '${stepId}' must define a string false branch reference.`,
      path: `steps[${index}].false`,
    });
  } else if (!stepIds.has(falseStep)) {
    errors.push({
      code: 'STEP_REF_MISSING',
      message: `Condition step '${stepId}' references missing false branch step '${falseStep}'.`,
      path: `steps[${index}].false`,
    });
  }

  return errors;
}

/**
 * Validates a workflow definition against structural and semantic rules used by shell and runner stages.
 */
export function validateWorkflowDefinition(
  workflow: unknown,
): WorkflowValidationResult {
  const errors: WorkflowValidationError[] = [];
  const workflowRecord = asRecord(workflow);

  if (!workflowRecord) {
    return {
      valid: false,
      errors: [
        {
          code: 'WORKFLOW_INVALID',
          message: 'Workflow definition must be an object.',
          path: '$',
        },
      ],
    };
  }

  if (workflowRecord['schemaVersion'] !== 1) {
    errors.push({
      code: 'SCHEMA_VERSION_INVALID',
      message: 'Workflow schemaVersion must be 1.',
      path: 'schemaVersion',
    });
  }

  if (typeof workflowRecord['id'] === 'string') {
    errors.push(...validateWorkflowId(workflowRecord['id']));
  } else {
    errors.push({
      code: 'WORKFLOW_ID_MISSING',
      message: 'Workflow id is required and must be a string.',
      path: 'id',
    });
  }

  if (typeof workflowRecord['name'] !== 'string' || workflowRecord['name'].trim().length === 0) {
    errors.push({
      code: 'WORKFLOW_NAME_INVALID',
      message: 'Workflow name is required and must be a non-empty string.',
      path: 'name',
    });
  }

  if (Array.isArray(workflowRecord['steps'])) {
    errors.push(...validateWorkflowSteps(workflowRecord['steps']));
  } else {
    errors.push({
      code: 'STEPS_INVALID',
      message: 'Workflow steps must be an array.',
      path: 'steps',
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
