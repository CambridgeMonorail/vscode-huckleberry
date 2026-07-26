import { WorkflowDefinition } from '../workflows';

export interface RunnerExecutionOptions {
  maxStepRetries?: number;
  stepTimeoutMs?: number;
  simulatedStepDurationMs?: number;
  failStepIds?: string[];
  conditionInputs?: Record<string, boolean>;
  workingDirectory?: string;
  isolationMode?: 'workspace' | 'worktree';
  worktreeBaseRef?: string;
  reuseWorktree?: boolean;
  env?: Record<string, string>;
  shell?: boolean;
  commandPolicy?: RunnerCommandPolicy;
}

export interface RunnerCommandPolicy {
  allowHighRiskCommands?: boolean;
  blockedCommandPatterns?: string[];
}

export interface RunnerExecutionContext {
  mode: 'workspace' | 'worktree';
  workspaceRoot: string;
  workingDirectory: string;
  worktreePath?: string;
  baseRef?: string;
  reusedWorktree?: boolean;
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
  cancelled?: boolean;
  executionContext?: RunnerExecutionContext;
  stdoutArtifactPath: string;
  stderrArtifactPath: string;
  metadataArtifactPath: string;
}

export interface RunnerStopReason {
  code: string;
  message: string;
}

export interface RunnerAgentClaim {
  stepId: string;
  attempt: number;
  source: 'agent';
  summary: string;
  adapterId?: string;
}

export type RunnerApprovalAction = 'approve' | 'reject' | 'defer';

export interface RunnerApprovalDecision {
  stepId: string;
  attempt: number;
  action: RunnerApprovalAction;
  actorId: string;
  actorName?: string;
  note?: string;
  decidedAt: number;
}

export type RunnerDeepLinkKind = 'problems' | 'tests' | 'diff' | 'logs';

export interface RunnerDeepLink {
  kind: RunnerDeepLinkKind;
  label: string;
  target?: string;
  description?: string;
}

export interface RunnerSummaryStepAttempt {
  stepId: string;
  attempts: number;
}

export interface RunnerSummaryEvidenceRef {
  stepId: string;
  attempt: number;
  kind: 'stdout' | 'stderr' | 'metadata';
  path: string;
}

export interface RunnerUnresolvedItem {
  code: string;
  message: string;
  stepId?: string;
  eventType?: string;
  timestamp: number;
}

export interface RunnerRunSummary {
  runId: string;
  loopId: string;
  status: RunnerRunStatus;
  startedAt: number;
  updatedAt: number;
  completedAt?: number;
  eventCount: number;
  terminalEventType: string;
  stopReasonCode?: string;
  stopReason?: string;
  attempts: RunnerSummaryStepAttempt[];
  attemptTotal: number;
  keyEvidence: RunnerSummaryEvidenceRef[];
  unresolvedItems: RunnerUnresolvedItem[];
}

export interface RunnerSummaryArtifacts {
  summary: RunnerRunSummary;
  jsonPath: string;
  markdownPath: string;
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
      type: 'listRuns';
      requestId: string;
      payload: Record<string, never>;
    }
  | {
      type: 'events';
      requestId: string;
      payload: {
        runId: string;
      };
    }
  | {
      type: 'summary';
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
      type: 'approvalAction';
      requestId: string;
      payload: {
        runId: string;
        action: RunnerApprovalAction;
        actorId: string;
        actorName?: string;
        note?: string;
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
  executionContext?: RunnerExecutionContext;
  stopReasonCode?: string;
  stopReason?: string;
}

export interface RunnerEvent {
  runId: string;
  loopId: string;
  loopFilePath?: string;
  status: RunnerRunStatus;
  timestamp: number;
  eventType: string;
  message?: string;
  executionContext?: RunnerExecutionContext;
  transition?: RunnerTransition;
  agentClaim?: RunnerAgentClaim;
  approvalDecision?: RunnerApprovalDecision;
  deepLinks?: RunnerDeepLink[];
  stepResult?: RunnerStepResult;
  stopReason?: RunnerStopReason;
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
      type: 'runs';
      requestId: string;
      payload: {
        runs: RunnerRunRecord[];
      };
    }
  | {
      type: 'events';
      requestId: string;
      payload: {
        events: RunnerEvent[];
      };
    }
  | {
      type: 'summary';
      requestId: string;
      payload: {
        artifacts?: RunnerSummaryArtifacts;
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
