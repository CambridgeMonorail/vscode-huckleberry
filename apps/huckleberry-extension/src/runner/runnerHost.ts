import { randomUUID } from 'crypto';
import { RunnerEvent, RunnerRequest, RunnerResponse, RunnerRunRecord, RunnerRunStatus } from './types';

type Reply = (response: RunnerResponse) => void;
type EmitEvent = (response: RunnerResponse) => void;

const RUN_SETTLE_DELAY_MS = 300;

/**
 * Hosts in-memory run lifecycle state for the lightweight command-only runner process.
 */
export class RunnerHost {
  private readonly runs = new Map<string, RunnerRunRecord>();
  private readonly runTimers = new Map<string, NodeJS.Timeout>();

  handleMessage(message: RunnerRequest, reply: Reply, emitEvent: EmitEvent): void {
    switch (message.type) {
      case 'start':
        this.handleStart(message, reply, emitEvent);
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

  private handleStart(message: Extract<RunnerRequest, { type: 'start' }>, reply: Reply, emitEvent: EmitEvent): void {
    const now = Date.now();
    const runId = randomUUID();

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

    const runTimer = setTimeout(() => {
      const latestRun = this.runs.get(runId);
      if (!latestRun || latestRun.status === 'cancelled') {
        return;
      }

      this.updateRunStatus(latestRun, 'running');
      this.emitRunEvent(latestRun, 'running', 'run-started', 'Run started.', emitEvent);

      const completeTimer = setTimeout(() => {
        const currentRun = this.runs.get(runId);
        if (!currentRun || currentRun.status === 'cancelled') {
          return;
        }

        this.updateRunStatus(currentRun, 'succeeded', 'Command-only runner handshake completed.');
        this.emitRunEvent(currentRun, 'succeeded', 'run-succeeded', 'Run completed successfully.', emitEvent);
        this.runTimers.delete(runId);
      }, RUN_SETTLE_DELAY_MS);

      this.runTimers.set(runId, completeTimer);
    }, 10);

    this.runTimers.set(runId, runTimer);
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
  ): void {
    const event: RunnerEvent = {
      runId: run.runId,
      loopId: run.loopId,
      status,
      eventType,
      message,
      timestamp: Date.now(),
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
}
