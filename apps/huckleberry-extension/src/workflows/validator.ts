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
  const stepRecordsById = new Map<string, { index: number; step: Record<string, unknown> }>();

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
    stepRecordsById.set(stepId, { index, step: stepRecord });
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

    if (stepType === 'artifact') {
      errors.push({
        code: 'STEP_TYPE_UNSUPPORTED_RUNTIME',
        message: 'Artifact steps are not executable in the current runner stage.',
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

    if (stepType === 'command') {
      errors.push(...validateCommandStep(stepRecord, index));
      continue;
    }

    if (stepType === 'approval') {
      errors.push(...validateApprovalStep(stepRecord, index, stepIds));
    }
  }

  errors.push(...validateRepairLoops(stepRecordsById));

  return errors;
}

function validateApprovalStep(
  step: Record<string, unknown>,
  index: number,
  stepIds: Set<string>,
): WorkflowValidationError[] {
  const errors: WorkflowValidationError[] = [];
  const stepId = typeof step['id'] === 'string' ? step['id'] : '(unknown-step)';

  errors.push(...validateApprovalBranchReference(stepId, step, index, 'onApprove', stepIds));
  errors.push(...validateApprovalBranchReference(stepId, step, index, 'onReject', stepIds));
  errors.push(...validateApprovalBranchReference(stepId, step, index, 'onDefer', stepIds));

  return errors;
}

function validateApprovalBranchReference(
  stepId: string,
  step: Record<string, unknown>,
  index: number,
  key: 'onApprove' | 'onReject' | 'onDefer',
  stepIds: Set<string>,
): WorkflowValidationError[] {
  const value = step[key];
  if (value === undefined) {
    return [];
  }

  if (typeof value !== 'string' || value.trim().length === 0) {
    return [{
      code: 'APPROVAL_BRANCH_INVALID',
      message: `Approval step '${stepId}' ${key} must be a non-empty step id string when provided.`,
      path: `steps[${index}].${key}`,
    }];
  }

  if (!stepIds.has(value)) {
    return [{
      code: 'APPROVAL_BRANCH_MISSING',
      message: `Approval step '${stepId}' ${key} references missing step '${value}'.`,
      path: `steps[${index}].${key}`,
    }];
  }

  return [];
}

function validateCommandStep(
  step: Record<string, unknown>,
  index: number,
): WorkflowValidationError[] {
  const errors: WorkflowValidationError[] = [];
  const stepId = typeof step['id'] === 'string' ? step['id'] : '(unknown-step)';

  if (typeof step['command'] !== 'string' || step['command'].trim().length === 0) {
    errors.push({
      code: 'STEP_COMMAND_INVALID',
      message: `Command step '${stepId}' must define a non-empty command string.`,
      path: `steps[${index}].command`,
    });
  }

  if (step['onFailure'] !== undefined && typeof step['onFailure'] !== 'string') {
    errors.push({
      code: 'STEP_ON_FAILURE_INVALID',
      message: `Command step '${stepId}' onFailure must be a string when provided.`,
      path: `steps[${index}].onFailure`,
    });
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

  const retry = asRecord(step['retry']);
  if (step['retry'] !== undefined && !retry) {
    errors.push({
      code: 'AGENT_RETRY_INVALID',
      message: `Agent step '${stepId}' retry must be an object when provided.`,
      path: `steps[${index}].retry`,
    });
  }

  if (retry) {
    if (typeof retry['target'] !== 'string' || retry['target'].trim().length === 0) {
      errors.push({
        code: 'AGENT_RETRY_TARGET_INVALID',
        message: `Agent step '${stepId}' retry target must be a non-empty string.`,
        path: `steps[${index}].retry.target`,
      });
    }

    if (!isPositiveInteger(retry['maxAttempts'])) {
      errors.push({
        code: 'AGENT_RETRY_MAX_ATTEMPTS_INVALID',
        message: `Agent step '${stepId}' retry maxAttempts must be a positive integer.`,
        path: `steps[${index}].retry.maxAttempts`,
      });
    }
  }

  return errors;
}

function validateRepairLoops(
  stepRecordsById: Map<string, { index: number; step: Record<string, unknown> }>,
): WorkflowValidationError[] {
  const errors: WorkflowValidationError[] = [];

  for (const [stepId, { index, step }] of stepRecordsById) {
    if (step['type'] !== 'command') {
      continue;
    }

    const onFailure = step['onFailure'];
    if (typeof onFailure !== 'string') {
      continue;
    }

    const targetEntry = stepRecordsById.get(onFailure);
    if (!targetEntry) {
      errors.push({
        code: 'STEP_ON_FAILURE_TARGET_MISSING',
        message: `Command step '${stepId}' references missing onFailure target '${onFailure}'.`,
        path: `steps[${index}].onFailure`,
      });
      continue;
    }

    if (targetEntry.step['type'] !== 'agent') {
      errors.push({
        code: 'STEP_ON_FAILURE_TARGET_INVALID',
        message: `Command step '${stepId}' onFailure target '${onFailure}' must reference an agent step.`,
        path: `steps[${index}].onFailure`,
      });
      continue;
    }

    const retry = asRecord(targetEntry.step['retry']);
    if (!retry) {
      errors.push({
        code: 'AGENT_RETRY_MISSING',
        message: `Agent step '${onFailure}' must define retry policy when referenced by onFailure.`,
        path: `steps[${targetEntry.index}].retry`,
      });
      continue;
    }

    if (retry['target'] !== stepId) {
      errors.push({
        code: 'AGENT_RETRY_TARGET_MISMATCH',
        message: `Agent step '${onFailure}' retry target must be '${stepId}'.`,
        path: `steps[${targetEntry.index}].retry.target`,
      });
    }
  }

  return errors;
}

function isPositiveInteger(value: unknown): boolean {
  return typeof value === 'number' && Number.isInteger(value) && value > 0;
}

function validateExecutionOptions(workflowRecord: Record<string, unknown>): WorkflowValidationError[] {
  const execution = workflowRecord['execution'];
  if (execution === undefined) {
    return [];
  }

  const executionRecord = asRecord(execution);
  if (!executionRecord) {
    return [{
      code: 'EXECUTION_INVALID',
      message: 'Workflow execution must be an object when provided.',
      path: 'execution',
    }];
  }

  const isolation = executionRecord['isolation'];
  if (isolation !== undefined && isolation !== 'workspace' && isolation !== 'worktree') {
    return [{
      code: 'EXECUTION_ISOLATION_INVALID',
      message: 'Workflow execution isolation must be \'workspace\' or \'worktree\'.',
      path: 'execution.isolation',
    }];
  }

  return [];
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

  errors.push(...validateExecutionOptions(workflowRecord));

  return {
    valid: errors.length === 0,
    errors,
  };
}
