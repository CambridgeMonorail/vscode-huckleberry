import { WorkflowDefinition, WorkflowStep } from '../workflows';
import { RunnerExecutionOptions, RunnerRunStatus, RunnerTransition } from './types';

export interface RunnerStateMachineResult {
  transitions: RunnerTransition[];
  finalStatus: RunnerRunStatus;
  stopReason?: string;
}

interface StepExecutionOutcome {
  status: RunnerRunStatus;
  reason?: string;
}

const DEFAULT_STEP_TIMEOUT_MS = 5_000;
const DEFAULT_STEP_DURATION_MS = 50;
const DEFAULT_MAX_STEP_RETRIES = 0;
const MAX_TRANSITIONS_GUARD = 10_000;

/**
 * Deterministic command-only state machine engine used by the runner process.
 */
export function runStateMachine(
  workflow: WorkflowDefinition,
  execution?: RunnerExecutionOptions,
): RunnerStateMachineResult {
  const transitions: RunnerTransition[] = [];
  const stepById = new Map(workflow.steps.map(step => [step.id, step]));
  const stepAttempts = new Map<string, number>();

  const maxStepRetries = execution?.maxStepRetries ?? DEFAULT_MAX_STEP_RETRIES;
  const stepTimeoutMs = execution?.stepTimeoutMs ?? DEFAULT_STEP_TIMEOUT_MS;
  const simulatedStepDurationMs = execution?.simulatedStepDurationMs ?? DEFAULT_STEP_DURATION_MS;
  const failStepIds = new Set(execution?.failStepIds ?? []);
  const conditionInputs = execution?.conditionInputs ?? {};

  let currentStatus: RunnerRunStatus = 'queued';
  transitions.push({ from: 'queued', to: 'running', reason: 'run-started' });
  currentStatus = 'running';

  let currentStep: WorkflowStep | undefined = workflow.steps[0];
  let transitionCounter = 0;

  while (currentStep) {
    transitionCounter += 1;
    if (transitionCounter > MAX_TRANSITIONS_GUARD) {
      transitions.push({
        from: currentStatus,
        to: 'failed',
        stepId: currentStep.id,
        reason: 'transition-guard-triggered',
      });
      return {
        transitions,
        finalStatus: 'failed',
        stopReason: 'Transition guard triggered. Potential cyclic workflow detected.',
      };
    }

    const currentAttempt = (stepAttempts.get(currentStep.id) ?? 0) + 1;
    stepAttempts.set(currentStep.id, currentAttempt);

    const outcome = evaluateStepOutcome(
      currentStep,
      {
        stepTimeoutMs,
        simulatedStepDurationMs,
        failStepIds,
        conditionInputs,
      },
    );

    if (outcome.status === 'succeeded') {
      transitions.push({
        from: currentStatus,
        to: 'running',
        stepId: currentStep.id,
        attempt: currentAttempt,
        reason: `step-succeeded:${currentStep.type}`,
      });

      currentStep = resolveNextStep(currentStep, workflow.steps, stepById, conditionInputs);
      continue;
    }

    if (outcome.status === 'failed' && currentAttempt <= maxStepRetries) {
      transitions.push({
        from: currentStatus,
        to: 'running',
        stepId: currentStep.id,
        attempt: currentAttempt,
        reason: 'step-retry',
      });
      continue;
    }

    const terminalStatus = outcome.status === 'cancelled' ? 'cancelled' : 'failed';
    transitions.push({
      from: currentStatus,
      to: terminalStatus,
      stepId: currentStep.id,
      attempt: currentAttempt,
      reason: outcome.reason,
    });

    return {
      transitions,
      finalStatus: terminalStatus,
      stopReason: outcome.reason,
    };
  }

  transitions.push({
    from: currentStatus,
    to: 'succeeded',
    reason: 'all-steps-succeeded',
  });

  return {
    transitions,
    finalStatus: 'succeeded',
  };
}

function evaluateStepOutcome(
  step: WorkflowStep,
  options: {
    stepTimeoutMs: number;
    simulatedStepDurationMs: number;
    failStepIds: Set<string>;
    conditionInputs: Record<string, boolean>;
  },
): StepExecutionOutcome {
  if (step.type === 'condition') {
    const conditionValue = evaluateCondition(step.expression, options.conditionInputs);
    return {
      status: 'succeeded',
      reason: conditionValue ? `condition-true:${step.true}` : `condition-false:${step.false}`,
    };
  }

  if (options.simulatedStepDurationMs > options.stepTimeoutMs) {
    return {
      status: 'failed',
      reason: 'step-timeout',
    };
  }

  if (options.failStepIds.has(step.id)) {
    return {
      status: 'failed',
      reason: 'step-configured-to-fail',
    };
  }

  return {
    status: 'succeeded',
  };
}

function evaluateCondition(expression: string, conditionInputs: Record<string, boolean>): boolean {
  const normalized = expression.trim();

  if (normalized === 'true') {
    return true;
  }

  if (normalized === 'false') {
    return false;
  }

  if (normalized in conditionInputs) {
    return conditionInputs[normalized];
  }

  return false;
}

function resolveNextStep(
  currentStep: WorkflowStep,
  allSteps: WorkflowStep[],
  stepById: Map<string, WorkflowStep>,
  conditionInputs: Record<string, boolean>,
): WorkflowStep | undefined {
  if (currentStep.type === 'condition') {
    const conditionValue = evaluateCondition(currentStep.expression, conditionInputs);
    const nextStepId = conditionValue ? currentStep.true : currentStep.false;
    return stepById.get(nextStepId);
  }

  const currentIndex = allSteps.findIndex(step => step.id === currentStep.id);
  if (currentIndex < 0) {
    return undefined;
  }

  return allSteps[currentIndex + 1];
}
