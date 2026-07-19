export type RunStatus =
  | 'queued'
  | 'running'
  | 'paused'
  | 'succeeded'
  | 'failed'
  | 'cancelled'
  | 'exhausted';

export interface WorkflowDefinition {
  schemaVersion: 1;
  id: string;
  name: string;
  description?: string;
  inputs?: Record<string, InputDefinition>;
  execution?: ExecutionOptions;
  steps: WorkflowStep[];
  stop?: StopPolicy;
  metadata?: Record<string, unknown>;
}

export interface InputDefinition {
  type: 'string' | 'number' | 'boolean' | 'file' | 'enum';
  description?: string;
  default?: unknown;
  required?: boolean;
  enumValues?: string[];
}

export interface ExecutionOptions {
  isolation?: 'workspace' | 'worktree';
  timeoutMinutes?: number;
  maxRunAttempts?: number;
}

export interface RetryPolicy {
  maxAttempts: number;
  backoffSeconds?: number;
}

export interface StepBase {
  id: string;
  name?: string;
  description?: string;
  timeoutSeconds?: number;
  retry?: RetryPolicy;
}

export interface CommandStep extends StepBase {
  type: 'command';
  command: string;
  capture?: {
    stdout?: string;
    stderr?: string;
  };
}

export interface AgentStep extends StepBase {
  type: 'agent';
  agent?: string;
  goal: string;
  constraints?: {
    paths?: string[];
    maxFilesChanged?: number;
    maxTurns?: number;
  };
}

export interface ConditionStep extends StepBase {
  type: 'condition';
  expression: string;
  true: string;
  false: string;
}

export interface ApprovalStep extends StepBase {
  type: 'approval';
  evidence?: string[];
}

export interface ArtifactStep extends StepBase {
  type: 'artifact';
  command: string;
  outputs?: string[];
}

export interface SubloopStep extends StepBase {
  type: 'subloop';
  uses: string;
}

export type WorkflowStep =
  | CommandStep
  | AgentStep
  | ConditionStep
  | ApprovalStep
  | ArtifactStep
  | SubloopStep;

export interface StopPolicy {
  success?: string;
  failure?: string[];
}

export interface StopReason {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}
