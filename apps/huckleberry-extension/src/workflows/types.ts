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
  steps: WorkflowStep[];
}

interface StepBase {
  id: string;
  name?: string;
  description?: string;
}

export interface RepairRetryPolicy {
  target: string;
  maxAttempts: number;
}

export interface CommandStep extends StepBase {
  type: 'command';
  command: string;
  onFailure?: string;
}

export interface ConditionStep extends StepBase {
  type: 'condition';
  expression: string;
  true: string;
  false: string;
}

export interface ApprovalStep extends StepBase {
  type: 'approval';
  onApprove?: string;
  onReject?: string;
  onDefer?: string;
}

export interface AgentStep extends StepBase {
  type: 'agent';
  prompt: string;
  adapter?: string;
  allowedPaths: string[];
  maxFilesChanged: number;
  maxTurns: number;
  retry?: RepairRetryPolicy;
}

export interface ArtifactStep extends StepBase {
  type: 'artifact';
  command: string;
}

export type WorkflowStep = CommandStep | ConditionStep | ApprovalStep | AgentStep | ArtifactStep;

export interface WorkflowValidationError {
  code: string;
  message: string;
  path: string;
}

export interface WorkflowValidationResult {
  valid: boolean;
  errors: WorkflowValidationError[];
}
