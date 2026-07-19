import { WorkflowDefinition } from '../workflows';

export interface RunnerExecutionOptions {
  maxStepRetries?: number;
  stepTimeoutMs?: number;
  simulatedStepDurationMs?: number;
  failStepIds?: string[];
  conditionInputs?: Record<string, boolean>;
  workingDirectory?: string;
  env?: Record<string, string>;
  shell?: boolean;
}

export interface RunnerStepResult {
  runId: string;
  stepId: string;
  attempt: number;
  command: string;
  cwd: string;
  startedAt: number;
  completedAt: number;
  durationMs: number;
  exitCode: number | null;
  timedOut: boolean;
  stdoutArtifactPath: string;
  stderrArtifactPath: string;
  metadataArtifactPath: string;
}

export type RunnerRequest =
  | {
      type: 'start';
      requestId: string;
      payload: {
        loopId: string;
        loopFilePath: string;
        workflow?: WorkflowDefinition;
        execution?: RunnerExecutionOptions;
      };
    }
  | {
      type: 'status';
      requestId: string;
      payload: {
        runId: string;
      };
    }
  | {
      type: 'cancel';
      requestId: string;
      payload: {
        runId: string;
      };
    }
  | {
      type: 'ping';
      requestId: string;
      payload: Record<string, never>;
    };

export type RunnerRunStatus =
  | 'queued'
  | 'running'
  | 'paused'
  | 'succeeded'
  | 'failed'
  | 'cancelled'
  | 'exhausted';

export interface RunnerRunRecord {
  runId: string;
  loopId: string;
  loopFilePath: string;
  status: RunnerRunStatus;
  startedAt: number;
  updatedAt: number;
  completedAt?: number;
  stopReason?: string;
}

export interface RunnerEvent {
  runId: string;
  loopId: string;
  status: RunnerRunStatus;
  timestamp: number;
  eventType: string;
  message?: string;
  transition?: RunnerTransition;
  stepResult?: RunnerStepResult;
}

export interface RunnerTransition {
  from: RunnerRunStatus;
  to: RunnerRunStatus;
  stepId?: string;
  attempt?: number;
  reason?: string;
}

export type RunnerResponse =
  | {
      type: 'ack';
      requestId: string;
      payload: {
        runId?: string;
        ok: true;
      };
    }
  | {
      type: 'status';
      requestId: string;
      payload: {
        run?: RunnerRunRecord;
      };
    }
  | {
      type: 'event';
      payload: RunnerEvent;
    }
  | {
      type: 'error';
      requestId: string;
      payload: {
        code: string;
        message: string;
      };
    };
