import { randomUUID } from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';
import { execFile } from 'child_process';
import { AgentAdapterRegistry, AgentStepExecutionResult } from './agentAdapter';
import { executeCommandStep } from './commandExecutor';
import { persistStepEvidence } from './evidenceStore';
import {
  appendEvidenceIndex,
  appendRunEvent,
  getRunEvents,
  getRunSummaryArtifacts,
  reconstructRunsFromEvents,
  writeRunSummaryArtifacts,
} from './runEventStore';
import { WorktreeLifecycleService } from './worktreeLifecycleService';
import { loadWorkflowDefinition } from './workflowLoader';
import { logWithChannel, LogLevel } from './runnerLog';
import { AgentStep, CommandStep, WorkflowDefinition, WorkflowStep } from '../workflows';
import {
  RunnerApprovalDecision,
  RunnerDeepLink,
  RunnerEvent,
  RunnerExecutionContext,
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

interface PausedApprovalState {
  stepId: string;
  attempt: number;
}

interface ActiveRunExecution {
  workflow: WorkflowDefinition;
  execution: RunnerExecutionOptions | undefined;
  executionContext: RunnerExecutionContext;
  runtimeSteps: WorkflowStep[];
  stepById: Map<string, WorkflowStep>;
  stepAttempts: Map<string, number>;
  repairAttempts: Map<string, number>;
  currentStepId?: string;
  pausedApproval?: PausedApprovalState;
}

interface WorktreeLifecycleAdapter {
  provisionWorktree: WorktreeLifecycleService['provisionWorktree'];
  cleanupRunWorktree: WorktreeLifecycleService['cleanupRunWorktree'];
}

interface RunDiffCaptureResult {
  artifactPath: string;
  warningMessage?: string;
}

interface CommandPolicyViolation {
  pattern: string;
  source: 'default' | 'custom';
}

const DEFAULT_BLOCKED_COMMAND_PATTERNS: ReadonlyArray<{ pattern: RegExp; label: string }> = [
  { pattern: /\brm\s+-rf\b/i, label: 'rm -rf' },
  { pattern: /\brmdir\s+\/[sq]+\b/i, label: 'rmdir /s' },
  { pattern: /\bdel\s+\/[sqf]+\b/i, label: 'del /s' },
  { pattern: /\bformat\s+[a-z]:/i, label: 'format drive' },
  { pattern: /\bgit\s+reset\s+--hard\b/i, label: 'git reset --hard' },
  { pattern: /\bgit\s+clean\s+-fdx?\b/i, label: 'git clean -fdx' },
  { pattern: /\bgit\s+push\b[^\n]*--force(?:-with-lease)?\b/i, label: 'git push --force' },
  { pattern: /\bshutdown\b/i, label: 'shutdown' },
  { pattern: /\breboot\b/i, label: 'reboot' },
  { pattern: /\bmkfs\b/i, label: 'mkfs' },
];

type RunDiffGenerator = (run: RunnerRunRecord) => Promise<RunDiffCaptureResult | undefined>;

/**
 * Hosts in-memory run lifecycle state for the lightweight command-only runner process.
 */
export class RunnerHost {
  private readonly runs = new Map<string, RunnerRunRecord>();
  private readonly cancellationRequests = new Set<string>();
  private readonly activeStepAbortControllers = new Map<string, AbortController>();
  private readonly activeRunExecutions = new Map<string, ActiveRunExecution>();
  private readonly persistenceQueue = new Map<string, Promise<void>>();
  private hydrationPromise?: Promise<void>;
  private readonly worktreeLifecycleService: WorktreeLifecycleAdapter;
  private readonly runDiffGenerator: RunDiffGenerator;

  constructor(
    private readonly agentAdapterRegistry: AgentAdapterRegistry = new AgentAdapterRegistry(),
    worktreeLifecycleService: WorktreeLifecycleAdapter = new WorktreeLifecycleService(),
    runDiffGenerator: RunDiffGenerator = generateRunDiffArtifact,
  ) {
    this.worktreeLifecycleService = worktreeLifecycleService;
    this.runDiffGenerator = runDiffGenerator;
  }

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
      case 'summary':
        void this.handleSummary(message, reply);
        return;
      case 'cancel':
        void this.handleCancel(message, reply, emitEvent);
        return;
      case 'approvalAction':
        void this.handleApprovalAction(message, reply, emitEvent);
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
    this.activeRunExecutions.clear();
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

    let executionContext: RunnerExecutionContext;
    try {
      executionContext = await this.resolveExecutionContext(
        runId,
        message.payload.loopId,
        message.payload.loopFilePath,
        workflow,
        message.payload.execution,
      );
    } catch (error) {
      reply({
        type: 'error',
        requestId: message.requestId,
        payload: {
          code: 'EXECUTION_CONTEXT_SETUP_FAILED',
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
      executionContext,
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

    const runtimeSteps = workflow.steps;
    const activeExecution: ActiveRunExecution = {
      workflow,
      execution: message.payload.execution,
      executionContext,
      runtimeSteps,
      stepById: new Map(runtimeSteps.map(step => [step.id, step])),
      stepAttempts: new Map<string, number>(),
      repairAttempts: new Map<string, number>(),
      currentStepId: runtimeSteps[0]?.id,
    };

    this.activeRunExecutions.set(runId, activeExecution);
    void this.executeWorkflow(runRecord, activeExecution, emitEvent);
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

  private async handleSummary(message: Extract<RunnerRequest, { type: 'summary' }>, reply: Reply): Promise<void> {
    await this.ensureHydrated();

    reply({
      type: 'summary',
      requestId: message.requestId,
      payload: {
        artifacts: await getRunSummaryArtifacts(message.payload.runId),
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

  private async handleApprovalAction(
    message: Extract<RunnerRequest, { type: 'approvalAction' }>,
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

    const execution = this.activeRunExecutions.get(run.runId);
    if (!execution?.pausedApproval || run.status !== 'paused') {
      reply({
        type: 'error',
        requestId: message.requestId,
        payload: {
          code: 'APPROVAL_NOT_PENDING',
          message: `Run '${run.runId}' is not waiting for an approval decision.`,
        },
      });
      return;
    }

    const approvalStep = execution.stepById.get(execution.pausedApproval.stepId);
    if (!approvalStep || approvalStep.type !== 'approval') {
      reply({
        type: 'error',
        requestId: message.requestId,
        payload: {
          code: 'APPROVAL_STEP_NOT_FOUND',
          message: `Approval step '${execution.pausedApproval.stepId}' was not found.`,
        },
      });
      return;
    }

    const decision: RunnerApprovalDecision = {
      stepId: execution.pausedApproval.stepId,
      attempt: execution.pausedApproval.attempt,
      action: message.payload.action,
      actorId: message.payload.actorId,
      actorName: message.payload.actorName,
      note: message.payload.note,
      decidedAt: Date.now(),
    };

    this.emitRunEvent(
      run,
      'paused',
      `approval-${message.payload.action}`,
      `Approval ${message.payload.action} recorded for step ${decision.stepId}.`,
      emitEvent,
      { from: 'paused', to: 'paused', stepId: decision.stepId, attempt: decision.attempt, reason: 'approval-decision' },
      undefined,
      undefined,
      undefined,
      decision,
    );

    execution.pausedApproval = undefined;

    if (message.payload.action === 'reject') {
      if (approvalStep.onReject) {
        execution.currentStepId = approvalStep.onReject;
        this.updateRunStatus(run, 'running');
        this.emitRunEvent(
          run,
          'running',
          'run-resumed',
          `Run resumed after rejected approval step ${decision.stepId}.`,
          emitEvent,
          { from: 'paused', to: 'running', stepId: decision.stepId, reason: 'approval-rejected-branch' },
        );
        void this.executeWorkflow(run, execution, emitEvent);
      } else {
        this.finishRun(
          run,
          'failed',
          'approval-rejected',
          `Approval step ${decision.stepId} rejected.`,
          {
            code: 'APPROVAL_REJECTED',
            message: `Run rejected by ${decision.actorName ?? decision.actorId} at approval step '${decision.stepId}'.`,
          },
          emitEvent,
        );
      }
    } else if (message.payload.action === 'approve') {
      const nextStepId = approvalStep.onApprove ?? this.getNextSequentialStep(execution.runtimeSteps, decision.stepId)?.id;
      execution.currentStepId = nextStepId;
      this.updateRunStatus(run, 'running');
      this.emitRunEvent(
        run,
        'running',
        'run-resumed',
        `Run resumed after approval step ${decision.stepId}.`,
        emitEvent,
        { from: 'paused', to: 'running', stepId: decision.stepId, reason: 'approval-approved' },
      );
      void this.executeWorkflow(run, execution, emitEvent);
    } else {
      const deferTargetId = approvalStep.onDefer;
      if (deferTargetId) {
        execution.currentStepId = deferTargetId;
        this.updateRunStatus(run, 'running');
        this.emitRunEvent(
          run,
          'running',
          'run-resumed',
          `Run resumed after deferred approval step ${decision.stepId}.`,
          emitEvent,
          { from: 'paused', to: 'running', stepId: decision.stepId, reason: 'approval-deferred' },
        );
        void this.executeWorkflow(run, execution, emitEvent);
      } else {
        this.updateRunStatus(run, 'paused');
        execution.pausedApproval = {
          stepId: decision.stepId,
          attempt: decision.attempt,
        };
      }
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
    approvalDecision?: RunnerApprovalDecision,
  ): void {
    const event: RunnerEvent = {
      runId: run.runId,
      loopId: run.loopId,
      loopFilePath: run.loopFilePath,
      status,
      eventType,
      message,
      timestamp: Date.now(),
      executionContext: run.executionContext,
      transition,
      agentClaim,
      deepLinks: this.buildDeepLinks(run, status, eventType, stepResult),
      stepResult,
      stopReason,
      approvalDecision,
    };

    this.logLifecycleTelemetry(event);

    emitEvent({
      type: 'event',
      payload: event,
    });

    this.queuePersistence(run.runId, async () => {
      await appendRunEvent(event);
      if (stepResult) {
        await appendEvidenceIndex(run.runId, stepResult);
      }

      if (isTerminalStatus(status)) {
        const diffCapture = await this.runDiffGenerator(run);
        if (diffCapture?.warningMessage) {
          const warningEvent: RunnerEvent = {
            runId: run.runId,
            loopId: run.loopId,
            loopFilePath: run.loopFilePath,
            status,
            eventType: 'run-diff-capture-warning',
            message: diffCapture.warningMessage,
            timestamp: Date.now(),
            executionContext: run.executionContext,
            deepLinks: [
              {
                kind: 'diff',
                label: 'Open run diff artifact',
                target: diffCapture.artifactPath,
              },
            ],
          };

          this.logLifecycleTelemetry(warningEvent);

          emitEvent({
            type: 'event',
            payload: warningEvent,
          });
          await appendRunEvent(warningEvent);
        }

        await writeRunSummaryArtifacts(run.runId);
        await this.cleanupExecutionContext(run);
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
    activeExecution: ActiveRunExecution,
    emitEvent: EmitEvent,
  ): Promise<void> {
    const { runtimeSteps, stepById, stepAttempts, repairAttempts, execution } = activeExecution;
    const maxStepRetries = execution?.maxStepRetries ?? 0;
    const stepTimeoutMs = execution?.stepTimeoutMs ?? 5_000;
    const conditionInputs = execution?.conditionInputs ?? {};

    if (run.status !== 'running') {
      this.updateRunStatus(run, 'running');
      this.emitRunEvent(
        run,
        'running',
        'run-started',
        'Run started.',
        emitEvent,
        { from: 'queued', to: 'running', reason: 'run-started' },
      );
    }

    let currentStep: WorkflowStep | undefined = activeExecution.currentStepId
      ? stepById.get(activeExecution.currentStepId)
      : undefined;

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
      activeExecution.currentStepId = currentStep.id;

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
        activeExecution.currentStepId = currentStep?.id;
        continue;
      }

      if (currentStep.type === 'approval') {
        this.updateRunStatus(run, 'paused');
        this.emitRunEvent(
          run,
          'paused',
          'approval-requested',
          `Approval required at step ${currentStep.id}.`,
          emitEvent,
          { from: 'running', to: 'paused', stepId: currentStep.id, attempt, reason: 'approval-requested' },
        );
        activeExecution.pausedApproval = {
          stepId: currentStep.id,
          attempt,
        };
        activeExecution.currentStepId = currentStep.id;
        return;
      }

      if (this.isAgentStep(currentStep)) {
        const agentExecution = await this.executeAgentStep(run, activeExecution, currentStep, attempt, emitEvent);
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
          activeExecution.currentStepId = currentStep.id;
          continue;
        }

        currentStep = this.getNextSequentialStep(runtimeSteps, currentStep.id);
        activeExecution.currentStepId = currentStep?.id;
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
      const cwd = activeExecution.executionContext.workingDirectory;
      const commandPolicyViolation = this.getCommandPolicyViolation(command, execution);
      if (commandPolicyViolation) {
        this.finishRun(
          run,
          'failed',
          'step-blocked:policy',
          `Step ${currentStep.id} blocked by command policy.`,
          {
            code: 'COMMAND_POLICY_BLOCKED',
            message: `Step '${currentStep.id}' command matched blocked pattern '${commandPolicyViolation.pattern}' (${commandPolicyViolation.source} policy).`,
          },
          emitEvent,
        );
        return;
      }

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
          executionContext: activeExecution.executionContext,
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
        activeExecution.currentStepId = currentStep?.id;
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
          activeExecution.currentStepId = currentStep.id;
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

    this.activeRunExecutions.delete(run.runId);
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
    this.activeRunExecutions.delete(run.runId);
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

  private getCommandPolicyViolation(
    command: string,
    execution: RunnerExecutionOptions | undefined,
  ): CommandPolicyViolation | undefined {
    const commandPolicy = execution?.commandPolicy;
    if (commandPolicy?.allowHighRiskCommands) {
      return undefined;
    }

    for (const blockedPattern of DEFAULT_BLOCKED_COMMAND_PATTERNS) {
      if (blockedPattern.pattern.test(command)) {
        return {
          pattern: blockedPattern.label,
          source: 'default',
        };
      }
    }

    const customPatterns = commandPolicy?.blockedCommandPatterns ?? [];
    for (const customPattern of customPatterns) {
      if (typeof customPattern !== 'string') {
        continue;
      }

      const trimmedPattern = customPattern.trim();
      if (trimmedPattern.length === 0) {
        continue;
      }

      try {
        const compiledPattern = new RegExp(trimmedPattern, 'i');
        if (compiledPattern.test(command)) {
          return {
            pattern: trimmedPattern,
            source: 'custom',
          };
        }
      } catch {
        logWithChannel(LogLevel.WARN, `Ignoring invalid blocked command pattern '${trimmedPattern}'.`, {
          pattern: trimmedPattern,
        });
      }
    }

    return undefined;
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

  private buildDeepLinks(
    run: RunnerRunRecord,
    status: RunnerRunStatus,
    eventType: string,
    stepResult?: RunnerStepResult,
  ): RunnerDeepLink[] | undefined {
    const links: RunnerDeepLink[] = [];

    if (isTerminalStatus(status) && run.executionContext?.mode === 'worktree') {
      links.push({
        kind: 'diff',
        label: 'Open run diff artifact',
        target: getRunDiffArtifactPath(run.runId),
        description: 'Run-level patch generated for isolated execution.',
      });
    }

    if (!stepResult) {
      return links.length > 0 ? links : undefined;
    }

    links.push(
      {
        kind: 'logs',
        label: 'Open stdout log',
        target: stepResult.stdoutArtifactPath,
      },
      {
        kind: 'logs',
        label: 'Open stderr log',
        target: stepResult.stderrArtifactPath,
      },
      {
        kind: 'logs',
        label: 'Open metadata log',
        target: stepResult.metadataArtifactPath,
      },
    );

    const normalizedEvent = eventType.toLowerCase();
    if (normalizedEvent.includes('failed') || normalizedEvent.includes('timeout')) {
      links.push(
        {
          kind: 'problems',
          label: 'Open Problems panel',
        },
        {
          kind: 'tests',
          label: 'Open Test Explorer',
        },
      );

      const runDirectory = path.dirname(stepResult.stdoutArtifactPath);
      const stem = `${stepResult.stepId}.attempt-${stepResult.attempt}`;
      links.push(
        {
          kind: 'diff',
          label: 'Open step diff (.diff)',
          target: path.join(runDirectory, `${stem}.diff`),
          description: 'Shows side-by-side patch artifact when present.',
        },
        {
          kind: 'diff',
          label: 'Open step patch (.patch)',
          target: path.join(runDirectory, `${stem}.patch`),
          description: 'Fallback patch artifact for troubleshooting.',
        },
      );
    }

    return links.length > 0 ? links : undefined;
  }

  private async executeAgentStep(
    run: RunnerRunRecord,
    activeExecution: ActiveRunExecution,
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
        cwd: activeExecution.executionContext.workingDirectory,
        attempt,
        allowedPaths: step.allowedPaths,
        maxFilesChanged: step.maxFilesChanged,
        maxTurns: step.maxTurns,
      });

      const normalizedResult: AgentStepExecutionResult = {
        ...result,
        adapterId: result.adapterId ?? resolution.adapter.id,
      };

      const constraintViolation = this.getAgentConstraintViolation(activeExecution.executionContext.workingDirectory, step, normalizedResult);
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
    workingDirectory: string,
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

    const normalizedAllowedPaths = step.allowedPaths.map((allowedPath: string) => this.normalizeConstraintPath(workingDirectory, allowedPath));
    for (const changedFile of result.changedFiles) {
      const normalizedChangedFile = this.normalizeConstraintPath(workingDirectory, changedFile);
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

  private async resolveExecutionContext(
    runId: string,
    loopId: string,
    loopFilePath: string,
    workflow: WorkflowDefinition,
    execution: RunnerExecutionOptions | undefined,
  ): Promise<RunnerExecutionContext> {
    const workspaceRoot = this.deriveWorkspaceRoot(loopFilePath, execution?.workingDirectory);
    const selectedMode = execution?.isolationMode ?? workflow.execution?.isolation ?? 'workspace';

    if (selectedMode === 'workspace') {
      return {
        mode: 'workspace',
        workspaceRoot,
        workingDirectory: execution?.workingDirectory ?? workspaceRoot,
      };
    }

    const metadata = await this.worktreeLifecycleService.provisionWorktree({
      runId,
      loopId,
      workspaceRoot,
      baseRef: execution?.worktreeBaseRef,
      reuseExisting: execution?.reuseWorktree,
    });

    return {
      mode: 'worktree',
      workspaceRoot,
      workingDirectory: metadata.worktreePath,
      worktreePath: metadata.worktreePath,
      baseRef: metadata.baseRef,
      reusedWorktree: metadata.reused,
    };
  }

  private deriveWorkspaceRoot(loopFilePath: string, explicitWorkingDirectory?: string): string {
    if (explicitWorkingDirectory) {
      return path.resolve(explicitWorkingDirectory);
    }

    const normalizedLoopPath = path.resolve(loopFilePath);
    const marker = `${path.sep}.huckleberry${path.sep}loops${path.sep}`;
    const markerIndex = normalizedLoopPath.lastIndexOf(marker);
    if (markerIndex >= 0) {
      return normalizedLoopPath.slice(0, markerIndex);
    }

    return path.dirname(normalizedLoopPath);
  }

  private async cleanupExecutionContext(run: RunnerRunRecord): Promise<void> {
    if (run.executionContext?.mode !== 'worktree') {
      return;
    }

    try {
      await this.worktreeLifecycleService.cleanupRunWorktree(run.runId, run.executionContext.workspaceRoot);
    } catch {
      // Cleanup errors are non-fatal for run lifecycle; surfaced in later UX stage.
    }
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

  private logLifecycleTelemetry(event: RunnerEvent): void {
    const telemetry = {
      telemetryType: 'runner-lifecycle',
      runId: event.runId,
      loopId: event.loopId,
      status: event.status,
      eventType: event.eventType,
      executionMode: event.executionContext?.mode,
      transitionFrom: event.transition?.from,
      transitionTo: event.transition?.to,
      stepId: event.transition?.stepId ?? event.stepResult?.stepId ?? event.agentClaim?.stepId ?? event.approvalDecision?.stepId,
      attempt: event.transition?.attempt ?? event.stepResult?.attempt ?? event.agentClaim?.attempt ?? event.approvalDecision?.attempt,
      stopReasonCode: event.stopReason?.code,
      terminal: isTerminalStatus(event.status),
      timestamp: event.timestamp,
    };

    const level = event.eventType.includes('failed') || event.eventType.includes('warning')
      ? LogLevel.WARN
      : event.eventType.includes('cancelled') || event.eventType.includes('exhausted')
        ? LogLevel.INFO
        : LogLevel.DEBUG;

    logWithChannel(level, `Runner lifecycle telemetry: ${event.eventType}`, telemetry);
  }
}

function isTerminalStatus(status: RunnerRunStatus): boolean {
  return status === 'succeeded' || status === 'failed' || status === 'cancelled' || status === 'exhausted';
}

function getRunDiffArtifactPath(runId: string): string {
  return path.join(process.cwd(), '.huckleberry', 'runs', runId, 'run.diff.patch');
}

async function generateRunDiffArtifact(run: RunnerRunRecord): Promise<RunDiffCaptureResult | undefined> {
  if (run.executionContext?.mode !== 'worktree') {
    return undefined;
  }

  const artifactPath = getRunDiffArtifactPath(run.runId);
  await fs.mkdir(path.dirname(artifactPath), { recursive: true });

  try {
    const diffOutput = await runGitDiff(run.executionContext.workingDirectory);
    await fs.writeFile(artifactPath, diffOutput, 'utf8');
    return { artifactPath };
  } catch (error) {
    const warningMessage = `Unable to capture isolated run diff for '${run.runId}': ${error instanceof Error ? error.message : String(error)}`;
    await fs.writeFile(
      artifactPath,
      `# Diff capture warning\n${warningMessage}\n`,
      'utf8',
    );

    return {
      artifactPath,
      warningMessage,
    };
  }
}

async function runGitDiff(workingDirectory: string): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile(
      'git',
      ['-C', workingDirectory, 'diff', '--binary', '--no-color'],
      { maxBuffer: 10 * 1024 * 1024 },
      (error, stdout, stderr) => {
        if (error) {
          reject(new Error(stderr.trim() || error.message));
          return;
        }

        resolve(stdout);
      },
    );
  });
}
