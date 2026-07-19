import { RunnerAgentClaim, RunnerApprovalDecision, RunnerDeepLink, RunnerRunRecord, RunnerStepResult } from '../runner';

export interface RunTimelinePresentationModel {
  stepId: string;
  eventType: string;
  timestamp: number;
  message?: string;
  stopReasonCode?: string;
  stopReasonMessage?: string;
  status: RunnerRunRecord['status'];
  attempt?: number;
  durationMs?: number;
  agentClaim?: RunnerAgentClaim;
  approvalDecision?: RunnerApprovalDecision;
  deepLinks?: RunnerDeepLink[];
  stepResult?: RunnerStepResult;
}

function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toLocaleString();
}

function formatDuration(durationMs: number): string {
  if (durationMs < 1_000) {
    return `${durationMs}ms`;
  }

  const seconds = durationMs / 1_000;
  if (seconds < 60) {
    return `${seconds.toFixed(1)}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainder = Math.floor(seconds % 60);
  return `${minutes}m ${remainder}s`;
}

export function buildTimelineLabel(timeline: RunTimelinePresentationModel): string {
  const kindPrefix = timeline.agentClaim ? '[Claim] ' : timeline.stepResult ? '[Evidence] ' : '';
  const base = timeline.stepId
    ? `${kindPrefix}${timeline.stepId} • ${timeline.eventType}`
    : `${kindPrefix}${timeline.eventType}`;

  if (timeline.attempt !== undefined) {
    return `${base} (attempt ${timeline.attempt})`;
  }

  return base;
}

export function buildTimelineTooltip(timeline: RunTimelinePresentationModel): string {
  const lines: string[] = [
    `Event: ${timeline.eventType}`,
    `Status: ${timeline.status}`,
    `Timestamp: ${formatTimestamp(timeline.timestamp)}`,
  ];

  if (timeline.stepId) {
    lines.push(`Step: ${timeline.stepId}`);
  }

  if (timeline.attempt !== undefined) {
    lines.push(`Attempt: ${timeline.attempt}`);
  }

  if (timeline.durationMs !== undefined) {
    lines.push(`Duration: ${formatDuration(timeline.durationMs)}`);
  }

  if (timeline.message) {
    lines.push(`Message: ${timeline.message}`);
  }

  if (timeline.agentClaim) {
    lines.push('Claim (agent):');
    lines.push(`  Source: ${timeline.agentClaim.adapterId ?? 'agent-adapter'}`);
    lines.push(`  Statement: ${timeline.agentClaim.summary}`);
  }

  if (timeline.approvalDecision) {
    lines.push('Approval decision:');
    lines.push(`  Action: ${timeline.approvalDecision.action}`);
    lines.push(`  Actor: ${timeline.approvalDecision.actorName ?? timeline.approvalDecision.actorId}`);
    if (timeline.approvalDecision.note) {
      lines.push(`  Note: ${timeline.approvalDecision.note}`);
    }
  }

  if (timeline.stopReasonCode) {
    lines.push(`Stop reason code: ${timeline.stopReasonCode}`);
  }

  if (timeline.stopReasonMessage) {
    lines.push(`Stop reason: ${timeline.stopReasonMessage}`);
  }

  if (timeline.stepResult) {
    lines.push('Evidence (deterministic):');
    lines.push(`Exit code: ${timeline.stepResult.exitCode}`);
    lines.push(`Stdout: ${timeline.stepResult.stdoutArtifactPath}`);
    lines.push(`Stderr: ${timeline.stepResult.stderrArtifactPath}`);
    lines.push(`Metadata: ${timeline.stepResult.metadataArtifactPath}`);
  }

  if (timeline.deepLinks && timeline.deepLinks.length > 0) {
    lines.push('Deep links:');
    for (const deepLink of timeline.deepLinks) {
      lines.push(`- ${deepLink.label}${deepLink.target ? ` -> ${deepLink.target}` : ''}`);
    }
  }

  return lines.join('\n');
}
