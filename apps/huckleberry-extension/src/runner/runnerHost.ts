import { randomUUID } from 'crypto';
import * as path from 'path';
import { executeCommandStep } from './commandExecutor';
import { persistStepEvidence } from './evidenceStore';
import { loadWorkflowDefinition } from './workflowLoader';
import { WorkflowDefinition, WorkflowStep } from '../workflows';
import {
  RunnerEvent,
  RunnerExecutionOptions,
  RunnerRequest,
  RunnerResponse,
  RunnerRunRecord,
  RunnerRunStatus,
  RunnerStepResult,
  RunnerTransition,
} from './types';

type Reply = (response: RunnerResponse) => void;
type EmitEvent = (response: RunnerResponse) => void;

/**
 * Hosts in-memory run lifecycle state for the lightweight command-only runner process.
 */
export class RunnerHost {
  private readonly runs = new Map<string, RunnerRunRecord>();
  private readonly cancellationRequests = new Set<string>();

  handleMessage(message: RunnerRequest, reply: Reply, emitEvent: EmitEvent): void {
    switch (message.type) {
      case 'start':
        void this.handleStart(message, reply, emitEvent);
        return;
      case 'status':
        this.handleStatus(message, reply);
        return;
      case 'cancel':
        this.handleCancel(message, reply, emitEvent);
        return;
      case 'ping':
        reply({
          type: 'ack',
          requestId: message.requestId,
          payload: { ok: true },
        });
        return;
      default:
        this.handleUnknown(message, reply);
    }
  }

  dispose(): void {
    this.cancellationRequests.clear();
  }

  private async handleStart(
    message: Extract<RunnerRequest, { type: 'start' }>,
    reply: Reply,
    emitEvent: EmitEvent,
  ): Promise<void> {
    const now = Date.now();
    const runId = randomUUID();

    let workflow = message.payload.workflow;
    try {
      workflow = workflow ?? await loadWorkflowDefinition(message.payload.loopFilePath);
    } catch (error) {
      reply({
        type: 'error',
        requestId: message.requestId,
        payload: {
          code: 'WORKFLOW_LOAD_FAILED',
          message: error instanceof Error ? error.message : String(error),
        },
      });
      return;
    }

    const runRecord: RunnerRunRecord = {
      runId,
      loopId: message.payload.loopId,
      loopFilePath: message.payload.loopFilePath,
      status: 'queued',
      startedAt: now,
      updatedAt: now,
    };

    this.runs.set(runId, runRecord);
    this.emitRunEvent(runRecord, 'queued', 'run-queued', 'Run queued by extension request.', emitEvent);

    reply({
      type: 'ack',
      requestId: message.requestId,
      payload: {
        runId,
        ok: true,
      },
    });

    void this.executeWorkflow(runRecord, workflow, message.payload.execution, emitEvent);
  }

  private handleStatus(message: Extract<RunnerRequest, { type: 'status' }>, reply: Reply): void {
    reply({
      type: 'status',
      requestId: message.requestId,
      payload: {
        run: this.runs.get(message.payload.runId),
      },
    });
  }

  private handleCancel(
    message: Extract<RunnerRequest, { type: 'cancel' }>,
    reply: Reply,
    emitEvent: EmitEvent,
  ): void {
    const run = this.runs.get(message.payload.runId);

    if (!run) {
      reply({
        type: 'error',
        requestId: message.requestId,
        payload: {
          code: 'RUN_NOT_FOUND',
          message: `Run '${message.payload.runId}' was not found.`,
        },
      });
      return;
    }

    this.cancellationRequests.add(run.runId);

    this.updateRunStatus(run, 'cancelled', 'Cancelled by extension request.');
    this.emitRunEvent(run, 'cancelled', 'run-cancelled', 'Run cancelled.', emitEvent);

    reply({
      type: 'ack',
      requestId: message.requestId,
      payload: {
        runId: run.runId,
        ok: true,
      },
    });
  }

  private handleUnknown(message: never, reply: Reply): void {
    reply({
      type: 'error',
      requestId: (message as { requestId: string }).requestId,
      payload: {
        code: 'UNKNOWN_REQUEST',
        message: 'Unknown runner request type.',
      },
    });
  }

  private emitRunEvent(
    run: RunnerRunRecord,
    status: RunnerRunStatus,
    eventType: string,
    message: string,
    emitEvent: EmitEvent,
    transition?: RunnerTransition,
    stepResult?: RunnerStepResult,
  ): void {
    const event: RunnerEvent = {
      runId: run.runId,
      loopId: run.loopId,
      status,
      eventType,
      message,
      timestamp: Date.now(),
      transition,
      stepResult,
    };

    emitEvent({
      type: 'event',
      payload: event,
    });
  }

  private updateRunStatus(run: RunnerRunRecord, status: RunnerRunStatus, stopReason?: string): void {
    run.status = status;
    run.updatedAt = Date.now();

    if (status === 'succeeded' || status === 'failed' || status === 'cancelled' || status === 'exhausted') {
      run.completedAt = run.updatedAt;
      run.stopReason = stopReason;
    }
  }

  private async executeWorkflow(
    run: RunnerRunRecord,
    workflow: WorkflowDefinition,
    execution: RunnerExecutionOptions | undefined,
    emitEvent: EmitEvent,
  ): Promise<void> {
    const stepById = new Map(workflow.steps.map(step => [step.id, step]));
    const stepAttempts = new Map<string, number>();
    const maxStepRetries = execution?.maxStepRetries ?? 0;
    const stepTimeoutMs = execution?.stepTimeoutMs ?? 5_000;
    const conditionInputs = execution?.conditionInputs ?? {};

    this.updateRunStatus(run, 'running');
    this.emitRunEvent(
      run,
      'running',
      'run-started',
      'Run started.',
      emitEvent,
      { from: 'queued', to: 'running', reason: 'run-started' },
    );

    let currentStep: WorkflowStep | undefined = workflow.steps[0];

    while (currentStep) {
      if (this.cancellationRequests.has(run.runId)) {
        this.cancellationRequests.delete(run.runId);
        this.finishRun(run, 'cancelled', 'run-cancelled', 'Run cancelled.', 'Cancelled by extension request.', emitEvent);
        return;
      }

      const attempt = (stepAttempts.get(currentStep.id) ?? 0) + 1;
      stepAttempts.set(currentStep.id, attempt);

      if (currentStep.type === 'condition') {
        const nextId = this.evaluateCondition(currentStep.expression, conditionInputs)
          ? currentStep.true
          : currentStep.false;
        this.emitRunEvent(
          run,
          'running',
          'step-succeeded:condition',
          `Condition step ${currentStep.id} routed to ${nextId}.`,
          emitEvent,
          { from: 'running', to: 'running', stepId: currentStep.id, attempt, reason: 'step-succeeded:condition' },
        );
        currentStep = stepById.get(nextId);
        continue;
      }

      if (currentStep.type === 'approval') {
        this.emitRunEvent(
          run,
          'running',
          'step-succeeded:approval',
          `Approval step ${currentStep.id} auto-completed in command-only mode.`,
          emitEvent,
          { from: 'running', to: 'running', stepId: currentStep.id, attempt, reason: 'step-succeeded:approval' },
        );
        currentStep = this.getNextSequentialStep(workflow.steps, currentStep.id);
        continue;
      }

      const command = currentStep.command;
      const cwd = execution?.workingDirectory ?? path.dirname(run.loopFilePath);

      this.emitRunEvent(
        run,
        'running',
        'step-started',
        `Executing step ${currentStep.id}.`,
        emitEvent,
        { from: 'running', to: 'running', stepId: currentStep.id, attempt, reason: 'step-started' },
      );

      let stepResult: RunnerStepResult;
      try {
        const commandResult = await executeCommandStep({
          command,
          cwd,
          timeoutMs: stepTimeoutMs,
          env: execution?.env,
          shell: execution?.shell,
        });

        stepResult = await persistStepEvidence({
          runId: run.runId,
          stepId: currentStep.id,
          attempt,
          command,
          cwd,
          startedAt: commandResult.startedAt,
          completedAt: commandResult.completedAt,
          durationMs: commandResult.durationMs,
          exitCode: commandResult.exitCode,
          timedOut: commandResult.timedOut,
          stdout: commandResult.stdout,
          stderr: commandResult.stderr,
        });
      } catch (error) {
        this.finishRun(
          run,
          'failed',
          'step-failed:executor-error',
          `Step ${currentStep.id} failed to execute.`,
          error instanceof Error ? error.message : String(error),
          emitEvent,
        );
        return;
      }

      const stepFailed = stepResult.timedOut || stepResult.exitCode !== 0;
      if (!stepFailed) {
        this.emitRunEvent(
          run,
          'running',
          'step-succeeded:command',
          `Step ${currentStep.id} completed.`,
          emitEvent,
          { from: 'running', to: 'running', stepId: currentStep.id, attempt, reason: 'step-succeeded:command' },
          stepResult,
        );
        currentStep = this.getNextSequentialStep(workflow.steps, currentStep.id);
        continue;
      }

      if (attempt <= maxStepRetries) {
        this.emitRunEvent(
          run,
          'running',
          'step-retry',
          `Retrying step ${currentStep.id} (attempt ${attempt + 1}).`,
          emitEvent,
          { from: 'running', to: 'running', stepId: currentStep.id, attempt, reason: 'step-retry' },
          stepResult,
        );
        continue;
      }

      const stopReason = stepResult.timedOut
        ? `Step '${currentStep.id}' timed out after ${stepTimeoutMs}ms.`
        : `Step '${currentStep.id}' exited with code ${stepResult.exitCode ?? 'unknown'}.`;

      this.finishRun(
        run,
        'failed',
        stepResult.timedOut ? 'step-timeout' : 'step-failed',
        `Step ${currentStep.id} failed.`,
        stopReason,
        emitEvent,
        stepResult,
      );
      return;
    }

    this.finishRun(run, 'succeeded', 'all-steps-succeeded', 'Run completed successfully.', undefined, emitEvent);
  }

  private finishRun(
    run: RunnerRunRecord,
    status: Extract<RunnerRunStatus, 'succeeded' | 'failed' | 'cancelled' | 'exhausted'>,
    reason: string,
    message: string,
    stopReason: string | undefined,
    emitEvent: EmitEvent,
    stepResult?: RunnerStepResult,
  ): void {
    const fromStatus = run.status;
    this.updateRunStatus(run, status, stopReason);
    this.emitRunEvent(
      run,
      status,
      reason,
      message,
      emitEvent,
      { from: fromStatus, to: status, reason },
      stepResult,
    );
  }

  private getNextSequentialStep(steps: WorkflowStep[], stepId: string): WorkflowStep | undefined {
    const currentIndex = steps.findIndex(step => step.id === stepId);
    if (currentIndex < 0) {
      return undefined;
    }

    return steps[currentIndex + 1];
  }

  private evaluateCondition(expression: string, conditionInputs: Record<string, boolean>): boolean {
    const normalized = expression.trim();

    if (normalized === 'true') {
      return true;
    }

    if (normalized === 'false') {
      return false;
    }

    return conditionInputs[normalized] ?? false;
  }
}
