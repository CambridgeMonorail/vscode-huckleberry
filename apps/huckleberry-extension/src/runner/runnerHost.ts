import { randomUUID } from 'crypto';
import * as path from 'path';
import { AgentAdapterRegistry, AgentStepExecutionResult } from './agentAdapter';
import { executeCommandStep } from './commandExecutor';
import { persistStepEvidence } from './evidenceStore';
import { appendEvidenceIndex, appendRunEvent, getRunEvents, reconstructRunsFromEvents } from './runEventStore';
import { loadWorkflowDefinition } from './workflowLoader';
import { AgentStep, CommandStep, WorkflowDefinition, WorkflowStep } from '../workflows';
import {
  RunnerEvent,
  RunnerExecutionOptions,
  RunnerAgentClaim,
  RunnerRequest,
  RunnerResponse,
  RunnerRunRecord,
  RunnerRunStatus,
  RunnerStopReason,
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
  private readonly activeStepAbortControllers = new Map<string, AbortController>();
  private readonly persistenceQueue = new Map<string, Promise<void>>();
  private hydrationPromise?: Promise<void>;

  constructor(private readonly agentAdapterRegistry: AgentAdapterRegistry = new AgentAdapterRegistry()) {}

  handleMessage(message: RunnerRequest, reply: Reply, emitEvent: EmitEvent): void {
    switch (message.type) {
      case 'start':
        void this.handleStart(message, reply, emitEvent);
        return;
      case 'status':
        void this.handleStatus(message, reply);
        return;
      case 'listRuns':
        void this.handleListRuns(message, reply);
        return;
      case 'events':
        void this.handleEvents(message, reply);
        return;
      case 'cancel':
        void this.handleCancel(message, reply, emitEvent);
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
    for (const controller of this.activeStepAbortControllers.values()) {
      controller.abort();
    }
    this.activeStepAbortControllers.clear();
    this.cancellationRequests.clear();
    this.agentAdapterRegistry.dispose();
  }

  private async handleStart(
    message: Extract<RunnerRequest, { type: 'start' }>,
    reply: Reply,
    emitEvent: EmitEvent,
  ): Promise<void> {
    await this.ensureHydrated();

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

  private async handleStatus(message: Extract<RunnerRequest, { type: 'status' }>, reply: Reply): Promise<void> {
    await this.ensureHydrated();

    reply({
      type: 'status',
      requestId: message.requestId,
      payload: {
        run: this.runs.get(message.payload.runId),
      },
    });
  }

  private async handleListRuns(message: Extract<RunnerRequest, { type: 'listRuns' }>, reply: Reply): Promise<void> {
    await this.ensureHydrated();

    reply({
      type: 'runs',
      requestId: message.requestId,
      payload: {
        runs: [...this.runs.values()].sort((left, right) => right.startedAt - left.startedAt),
      },
    });
  }

  private async handleEvents(message: Extract<RunnerRequest, { type: 'events' }>, reply: Reply): Promise<void> {
    await this.ensureHydrated();

    reply({
      type: 'events',
      requestId: message.requestId,
      payload: {
        events: await getRunEvents(message.payload.runId),
      },
    });
  }

  private async handleCancel(
    message: Extract<RunnerRequest, { type: 'cancel' }>,
    reply: Reply,
    emitEvent: EmitEvent,
  ): Promise<void> {
    await this.ensureHydrated();

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

    if (run.status === 'queued') {
      this.cancellationRequests.delete(run.runId);
      this.finishRun(
        run,
        'cancelled',
        'run-cancelled',
        'Run cancelled.',
        {
          code: 'CANCELLED_BY_USER',
          message: 'Run cancelled by extension request.',
        },
        emitEvent,
      );
    } else if (run.status === 'running') {
      this.activeStepAbortControllers.get(run.runId)?.abort();
      this.emitRunEvent(
        run,
        'running',
        'run-cancel-requested',
        'Cancellation requested. Waiting for running step to stop.',
        emitEvent,
      );
    }

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
    agentClaim?: RunnerAgentClaim,
    stepResult?: RunnerStepResult,
    stopReason?: RunnerStopReason,
  ): void {
    const event: RunnerEvent = {
      runId: run.runId,
      loopId: run.loopId,
      loopFilePath: run.loopFilePath,
      status,
      eventType,
      message,
      timestamp: Date.now(),
      transition,
      agentClaim,
      stepResult,
      stopReason,
    };

    emitEvent({
      type: 'event',
      payload: event,
    });

    this.queuePersistence(run.runId, async () => {
      await appendRunEvent(event);
      if (stepResult) {
        await appendEvidenceIndex(run.runId, stepResult);
      }
    });
  }

  private updateRunStatus(run: RunnerRunRecord, status: RunnerRunStatus, stopReason?: RunnerStopReason): void {
    run.status = status;
    run.updatedAt = Date.now();

    if (status === 'succeeded' || status === 'failed' || status === 'cancelled' || status === 'exhausted') {
      run.completedAt = run.updatedAt;
      run.stopReason = stopReason?.message;
      run.stopReasonCode = stopReason?.code;
    }
  }

  private async executeWorkflow(
    run: RunnerRunRecord,
    workflow: WorkflowDefinition,
    execution: RunnerExecutionOptions | undefined,
    emitEvent: EmitEvent,
  ): Promise<void> {
    const runtimeSteps = workflow.steps;
    const stepById = new Map(runtimeSteps.map(step => [step.id, step]));
    const stepAttempts = new Map<string, number>();
    const repairAttempts = new Map<string, number>();
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

    let currentStep: WorkflowStep | undefined = runtimeSteps[0];

    while (currentStep) {
      if (this.cancellationRequests.has(run.runId)) {
        this.cancellationRequests.delete(run.runId);
        this.finishRun(
          run,
          'cancelled',
          'run-cancelled',
          'Run cancelled.',
          {
            code: 'CANCELLED_BY_USER',
            message: 'Run cancelled by extension request.',
          },
          emitEvent,
        );
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
        currentStep = this.getNextSequentialStep(runtimeSteps, currentStep.id);
        continue;
      }

      if (this.isAgentStep(currentStep)) {
        const agentExecution = await this.executeAgentStep(run, currentStep, attempt, emitEvent);
        if (!agentExecution.ok) {
          return;
        }

        this.emitRunEvent(
          run,
          'running',
          'step-succeeded:agent',
          agentExecution.result.summary,
          emitEvent,
          { from: 'running', to: 'running', stepId: currentStep.id, attempt, reason: 'step-succeeded:agent' },
          {
            stepId: currentStep.id,
            attempt,
            source: 'agent',
            summary: agentExecution.result.summary,
            adapterId: agentExecution.result.adapterId,
          },
        );

        const retryPolicy = currentStep.retry;
        if (retryPolicy) {
          this.emitRunEvent(
            run,
            'running',
            'repair-recheck-scheduled',
            `Repair step ${currentStep.id} scheduled deterministic re-check of ${retryPolicy.target}.`,
            emitEvent,
            {
              from: 'running',
              to: 'running',
              stepId: retryPolicy.target,
              attempt: repairAttempts.get(retryPolicy.target) ?? attempt,
              reason: 'repair-recheck-scheduled',
            },
          );

          const retryTargetStep = stepById.get(retryPolicy.target);
          if (!this.isCommandStep(retryTargetStep)) {
            this.finishRun(
              run,
              'failed',
              'repair-target-missing',
              `Repair step ${currentStep.id} references a missing deterministic re-check target.`,
              {
                code: 'REPAIR_TARGET_INVALID',
                message: `Repair step '${currentStep.id}' target '${retryPolicy.target}' is invalid.`,
              },
              emitEvent,
            );
            return;
          }

          currentStep = retryTargetStep;
          continue;
        }

        currentStep = this.getNextSequentialStep(runtimeSteps, currentStep.id);
        continue;
      }

      if (!this.isCommandStep(currentStep)) {
        this.finishRun(
          run,
          'failed',
          'step-type-invalid',
          `Step ${currentStep.id} is not executable in runner mode.`,
          {
            code: 'STEP_TYPE_UNSUPPORTED',
            message: `Step '${currentStep.id}' has unsupported type '${(currentStep as WorkflowStep).type}'.`,
          },
          emitEvent,
        );
        return;
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
      const stepAbortController = new AbortController();
      this.activeStepAbortControllers.set(run.runId, stepAbortController);
      try {
        const commandResult = await executeCommandStep({
          command,
          cwd,
          timeoutMs: stepTimeoutMs,
          env: execution?.env,
          shell: execution?.shell,
          abortSignal: stepAbortController.signal,
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
          cancelled: commandResult.cancelled,
          stdout: commandResult.stdout,
          stderr: commandResult.stderr,
        });
      } catch (error) {
        this.activeStepAbortControllers.delete(run.runId);
        this.finishRun(
          run,
          'failed',
          'step-failed:executor-error',
          `Step ${currentStep.id} failed to execute.`,
          {
            code: 'STEP_EXECUTOR_ERROR',
            message: error instanceof Error ? error.message : String(error),
          },
          emitEvent,
        );
        return;
      }
      this.activeStepAbortControllers.delete(run.runId);

      if (stepResult.cancelled || this.cancellationRequests.has(run.runId)) {
        this.cancellationRequests.delete(run.runId);
        this.finishRun(
          run,
          'cancelled',
          'run-cancelled',
          'Run cancelled.',
          {
            code: 'CANCELLED_BY_USER',
            message: `Run cancelled while executing step '${currentStep.id}'.`,
          },
          emitEvent,
          stepResult,
        );
        return;
      }

      const stepFailed = stepResult.timedOut || stepResult.exitCode !== 0;
      if (!stepFailed) {
        let nextStep = this.getNextSequentialStep(runtimeSteps, currentStep.id);
        if (currentStep.onFailure && nextStep && nextStep.id === currentStep.onFailure) {
          nextStep = this.getNextSequentialStep(runtimeSteps, nextStep.id);
        }

        this.emitRunEvent(
          run,
          'running',
          'step-succeeded:command',
          `Step ${currentStep.id} completed.`,
          emitEvent,
          { from: 'running', to: 'running', stepId: currentStep.id, attempt, reason: 'step-succeeded:command' },
          undefined,
          stepResult,
        );
        currentStep = nextStep;
        continue;
      }

      const repairDecision = this.resolveRepairStep(currentStep, stepById);
      if (repairDecision) {
        const repairAttempt = (repairAttempts.get(currentStep.id) ?? 0) + 1;
        repairAttempts.set(currentStep.id, repairAttempt);

        if (repairAttempt <= repairDecision.maxAttempts) {
          this.emitRunEvent(
            run,
            'running',
            'repair-attempt',
            `Deterministic check ${currentStep.id} failed. Starting repair step ${repairDecision.step.id} (repair attempt ${repairAttempt}/${repairDecision.maxAttempts}).`,
            emitEvent,
            {
              from: 'running',
              to: 'running',
              stepId: currentStep.id,
              attempt: repairAttempt,
              reason: 'repair-attempt',
            },
            undefined,
            stepResult,
          );
          currentStep = repairDecision.step;
          continue;
        }

        this.finishRun(
          run,
          'exhausted',
          'repair-attempts-exhausted',
          `Repair attempts exhausted for deterministic check ${currentStep.id}.`,
          {
            code: 'REPAIR_ATTEMPTS_EXHAUSTED',
            message: `Step '${currentStep.id}' exhausted repair attempts (${repairDecision.maxAttempts}).`,
          },
          emitEvent,
          stepResult,
        );
        return;
      }

      if (attempt <= maxStepRetries) {
        this.emitRunEvent(
          run,
          'running',
          'step-retry',
          `Retrying step ${currentStep.id} (attempt ${attempt + 1}).`,
          emitEvent,
          { from: 'running', to: 'running', stepId: currentStep.id, attempt, reason: 'step-retry' },
          undefined,
          stepResult,
        );
        continue;
      }

      const stopReason = stepResult.timedOut
        ? {
          code: 'STEP_TIMEOUT',
          message: `Step '${currentStep.id}' timed out after ${stepTimeoutMs}ms.`,
        }
        : {
          code: 'STEP_EXIT_NON_ZERO',
          message: `Step '${currentStep.id}' exited with code ${stepResult.exitCode ?? 'unknown'}.`,
        };

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
    stopReason: RunnerStopReason | undefined,
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
      undefined,
      stepResult,
      stopReason,
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

  private isAgentStep(step: WorkflowStep): step is AgentStep {
    return step.type === 'agent';
  }

  private isCommandStep(step: WorkflowStep | undefined): step is CommandStep {
    return step?.type === 'command';
  }

  private resolveRepairStep(
    step: CommandStep,
    stepById: Map<string, WorkflowStep>,
  ): { step: AgentStep; maxAttempts: number } | undefined {
    if (!step.onFailure) {
      return undefined;
    }

    const repairStep = stepById.get(step.onFailure);
    if (!repairStep || !this.isAgentStep(repairStep) || !repairStep.retry) {
      return undefined;
    }

    if (repairStep.retry.target !== step.id || repairStep.retry.maxAttempts <= 0) {
      return undefined;
    }

    return {
      step: repairStep,
      maxAttempts: repairStep.retry.maxAttempts,
    };
  }

  private async executeAgentStep(
    run: RunnerRunRecord,
    step: AgentStep,
    attempt: number,
    emitEvent: EmitEvent,
  ): Promise<{ ok: true; result: AgentStepExecutionResult } | { ok: false }> {
    this.emitRunEvent(
      run,
      'running',
      'step-started:agent',
      `Executing agent step ${step.id}.`,
      emitEvent,
      { from: 'running', to: 'running', stepId: step.id, attempt, reason: 'step-started:agent' },
    );

    const resolution = await this.agentAdapterRegistry.resolveAvailableAdapter(step.adapter);
    if (!resolution.adapter) {
      this.finishRun(
        run,
        'failed',
        'step-failed:agent-adapter-unavailable',
        `Agent step ${step.id} could not start.`,
        {
          code: 'AGENT_ADAPTER_UNAVAILABLE',
          message: resolution.availability.reason ?? 'No agent adapter is available.',
        },
        emitEvent,
      );
      return { ok: false };
    }

    try {
      const result = await resolution.adapter.executeAgentStep({
        runId: run.runId,
        loopId: run.loopId,
        stepId: step.id,
        prompt: step.prompt,
        cwd: path.dirname(run.loopFilePath),
        attempt,
        allowedPaths: step.allowedPaths,
        maxFilesChanged: step.maxFilesChanged,
        maxTurns: step.maxTurns,
      });

      const normalizedResult: AgentStepExecutionResult = {
        ...result,
        adapterId: result.adapterId ?? resolution.adapter.id,
      };

      const constraintViolation = this.getAgentConstraintViolation(run.loopFilePath, step, normalizedResult);
      if (constraintViolation) {
        this.finishRun(
          run,
          'failed',
          'step-failed:agent-constraint',
          `Agent step ${step.id} violated execution constraints.`,
          constraintViolation,
          emitEvent,
        );
        return { ok: false };
      }

      return { ok: true, result: normalizedResult };
    } catch (error) {
      this.finishRun(
        run,
        'failed',
        'step-failed:agent-adapter-error',
        `Agent step ${step.id} failed.`,
        {
          code: 'AGENT_ADAPTER_FAILED',
          message: error instanceof Error ? error.message : String(error),
        },
        emitEvent,
      );
      return { ok: false };
    }
  }

  private getAgentConstraintViolation(
    loopFilePath: string,
    step: AgentStep,
    result: AgentStepExecutionResult,
  ): RunnerStopReason | undefined {
    if (result.turnsUsed > step.maxTurns) {
      return {
        code: 'AGENT_MAX_TURNS_EXCEEDED',
        message: `Agent step '${step.id}' used ${result.turnsUsed} turns, exceeding maxTurns ${step.maxTurns}.`,
      };
    }

    if (result.changedFiles.length > step.maxFilesChanged) {
      return {
        code: 'AGENT_MAX_FILES_CHANGED_EXCEEDED',
        message: `Agent step '${step.id}' changed ${result.changedFiles.length} files, exceeding maxFilesChanged ${step.maxFilesChanged}.`,
      };
    }

    const cwd = path.dirname(loopFilePath);
    const normalizedAllowedPaths = step.allowedPaths.map((allowedPath: string) => this.normalizeConstraintPath(cwd, allowedPath));
    for (const changedFile of result.changedFiles) {
      const normalizedChangedFile = this.normalizeConstraintPath(cwd, changedFile);
      const allowed = normalizedAllowedPaths.some((allowedPath: string) => {
        return normalizedChangedFile === allowedPath || normalizedChangedFile.startsWith(`${allowedPath}/`);
      });

      if (!allowed) {
        return {
          code: 'AGENT_PATH_SCOPE_VIOLATION',
          message: `Agent step '${step.id}' changed '${changedFile}', which is outside allowed paths: ${step.allowedPaths.join(', ')}.`,
        };
      }
    }

    return undefined;
  }

  private normalizeConstraintPath(cwd: string, inputPath: string): string {
    const absolutePath = path.isAbsolute(inputPath) ? inputPath : path.resolve(cwd, inputPath);
    return absolutePath.replace(/\\/g, '/');
  }

  private async ensureHydrated(): Promise<void> {
    if (!this.hydrationPromise) {
      this.hydrationPromise = (async () => {
        const reconstructed = await reconstructRunsFromEvents();
        for (const run of reconstructed) {
          this.runs.set(run.runId, run);
        }
      })();
    }

    await this.hydrationPromise;
  }

  private queuePersistence(runId: string, action: () => Promise<void>): void {
    const pending = this.persistenceQueue.get(runId) ?? Promise.resolve();

    const next = pending
      .then(action)
      .catch(() => {
        // Persistence failures are intentionally swallowed to keep runner execution alive.
      });

    this.persistenceQueue.set(runId, next);
  }
}
