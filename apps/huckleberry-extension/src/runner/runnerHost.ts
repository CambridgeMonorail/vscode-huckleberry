import { randomUUID } from 'crypto';
import { loadWorkflowDefinition } from './workflowLoader';
import { runStateMachine } from './stateMachine';
import { RunnerEvent, RunnerRequest, RunnerResponse, RunnerRunRecord, RunnerRunStatus, RunnerTransition } from './types';

type Reply = (response: RunnerResponse) => void;
type EmitEvent = (response: RunnerResponse) => void;

const RUN_TRANSITION_DELAY_MS = 20;

/**
 * Hosts in-memory run lifecycle state for the lightweight command-only runner process.
 */
export class RunnerHost {
  private readonly runs = new Map<string, RunnerRunRecord>();
  private readonly runTimers = new Map<string, NodeJS.Timeout>();

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
    for (const timer of this.runTimers.values()) {
      clearTimeout(timer);
    }
    this.runTimers.clear();
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

    const stateMachineResult = runStateMachine(workflow, message.payload.execution);
    this.scheduleTransitions(runRecord, stateMachineResult.transitions, stateMachineResult.stopReason, emitEvent);
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

    if (this.runTimers.has(run.runId)) {
      clearTimeout(this.runTimers.get(run.runId));
      this.runTimers.delete(run.runId);
    }

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
  ): void {
    const event: RunnerEvent = {
      runId: run.runId,
      loopId: run.loopId,
      status,
      eventType,
      message,
      timestamp: Date.now(),
      transition,
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

  private scheduleTransitions(
    run: RunnerRunRecord,
    transitions: RunnerTransition[],
    stopReason: string | undefined,
    emitEvent: EmitEvent,
  ): void {
    const queue = [...transitions];

    const tick = (): void => {
      const currentRun = this.runs.get(run.runId);
      if (!currentRun || currentRun.status === 'cancelled') {
        this.runTimers.delete(run.runId);
        return;
      }

      const transition = queue.shift();
      if (!transition) {
        this.runTimers.delete(run.runId);
        return;
      }

      const eventType = transition.reason ?? `transition-${transition.to}`;
      this.updateRunStatus(
        currentRun,
        transition.to,
        transition.to === 'failed' || transition.to === 'cancelled' || transition.to === 'exhausted'
          ? (stopReason ?? transition.reason)
          : undefined,
      );

      this.emitRunEvent(
        currentRun,
        transition.to,
        eventType,
        `State transition ${transition.from} -> ${transition.to}`,
        emitEvent,
        transition,
      );

      const timer = setTimeout(tick, RUN_TRANSITION_DELAY_MS);
      this.runTimers.set(run.runId, timer);
    };

    const initialTimer = setTimeout(tick, RUN_TRANSITION_DELAY_MS);
    this.runTimers.set(run.runId, initialTimer);
  }
}
