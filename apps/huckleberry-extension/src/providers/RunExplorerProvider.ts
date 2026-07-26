import * as vscode from 'vscode';
import { RunnerClient, RunnerEvent, RunnerRunRecord } from '../runner';
import {
  buildTimelineLabel,
  buildTimelineTooltip,
  type RunTimelinePresentationModel,
} from './runTimelinePresentation';
import { buildRunIsolationPresentation } from './runIsolationPresentation';

export interface RunTimelineNodeModel extends RunTimelinePresentationModel {
  runId: string;
}

interface RunTreeNodeModel {
  run: RunnerRunRecord;
  timeline: RunTimelineNodeModel[];
}

class RunTreeItem extends vscode.TreeItem {
  constructor(public readonly node: RunTreeNodeModel) {
    const run = node.run;
    super(`${run.loopId} (${run.status})`, vscode.TreeItemCollapsibleState.Collapsed);
    this.description = this.buildDescription(run);
    this.tooltip = this.buildTooltip(run, node.timeline.length);
    const mode = run.executionContext?.mode ?? 'unknown';
    this.contextValue = `run-${run.status}-${mode}`;
    this.iconPath = this.getIconForStatus(run.status);
  }

  private buildDescription(run: RunnerRunRecord): string {
    const completedSuffix = run.completedAt ? ` in ${formatDuration(run.completedAt - run.startedAt)}` : '';
    const modeLabel = run.executionContext?.mode ?? 'unknown';
    return `${run.runId} • ${modeLabel}${completedSuffix}`;
  }

  private buildTooltip(run: RunnerRunRecord, timelineCount: number): string {
    const isolation = buildRunIsolationPresentation(run);
    const lines: string[] = [
      `Run ID: ${run.runId}`,
      `Loop: ${run.loopId}`,
      `Status: ${run.status}`,
      `Isolation mode: ${isolation.modeLabel}`,
      `Started: ${formatTimestamp(run.startedAt)}`,
      `Updated: ${formatTimestamp(run.updatedAt)}`,
      `Events: ${timelineCount}`,
      `Path: ${run.loopFilePath}`,
    ];

    if (isolation.details.length > 0) {
      lines.push('Isolation details:');
      for (const detail of isolation.details) {
        lines.push(`  ${detail}`);
      }
    }

    if (isolation.warnings.length > 0) {
      lines.push('Isolation warnings:');
      for (const warning of isolation.warnings) {
        lines.push(`  ${warning}`);
      }
    }

    if (run.completedAt) {
      lines.push(`Completed: ${formatTimestamp(run.completedAt)}`);
      lines.push(`Duration: ${formatDuration(run.completedAt - run.startedAt)}`);
    }

    if (run.stopReason) {
      lines.push(`Stop reason: ${run.stopReason}`);
    }

    if (run.stopReasonCode) {
      lines.push(`Stop reason code: ${run.stopReasonCode}`);
    }

    return lines.join('\n');
  }

  private getIconForStatus(status: RunnerRunRecord['status']): vscode.ThemeIcon {
    switch (status) {
      case 'queued':
        return new vscode.ThemeIcon('clock');
      case 'running':
        return new vscode.ThemeIcon('loading~spin');
      case 'succeeded':
        return new vscode.ThemeIcon('pass');
      case 'cancelled':
      case 'failed':
      case 'exhausted':
        return new vscode.ThemeIcon('warning');
      case 'paused':
        return new vscode.ThemeIcon('debug-pause');
      default:
        return new vscode.ThemeIcon('circle-outline');
    }
  }
}

class RunTimelineTreeItem extends vscode.TreeItem {
  constructor(public readonly timeline: RunTimelineNodeModel) {
    super(buildTimelineLabel(timeline), vscode.TreeItemCollapsibleState.None);

    this.description = `${formatTimestamp(timeline.timestamp)}${timeline.durationMs !== undefined ? ` • ${formatDuration(timeline.durationMs)}` : ''}`;
    this.tooltip = buildTimelineTooltip(timeline);
    this.contextValue = timeline.deepLinks && timeline.deepLinks.length > 0
      ? 'run-step-with-deep-links'
      : timeline.stepResult
        ? 'run-step-with-evidence'
        : timeline.agentClaim
          ? 'run-step-with-claim'
          : 'run-step';
    this.iconPath = getTimelineIcon(timeline);

    if (timeline.stepResult) {
      this.command = {
        command: 'vscode-copilot-huckleberry.runs.openStepEvidence',
        title: 'Open Step Evidence',
        arguments: [timeline],
      };
    }
  }
}

function getTimelineIcon(timeline: RunTimelineNodeModel): vscode.ThemeIcon {
  if (timeline.eventType.startsWith('step-failed') || timeline.eventType === 'step-timeout') {
    return new vscode.ThemeIcon('warning');
  }

  if (timeline.eventType === 'step-retry') {
    return new vscode.ThemeIcon('history');
  }

  if (timeline.eventType.startsWith('step-started')) {
    return new vscode.ThemeIcon('loading~spin');
  }

  if (timeline.eventType.startsWith('step-succeeded')) {
    return new vscode.ThemeIcon('pass');
  }

  switch (timeline.status) {
    case 'queued':
      return new vscode.ThemeIcon('clock');
    case 'running':
      return new vscode.ThemeIcon('loading~spin');
    case 'succeeded':
      return new vscode.ThemeIcon('pass');
    case 'cancelled':
    case 'failed':
    case 'exhausted':
      return new vscode.ThemeIcon('warning');
    case 'paused':
      return new vscode.ThemeIcon('debug-pause');
    default:
      return new vscode.ThemeIcon('circle-outline');
  }
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

/**
 * Run explorer provider backed by runner events.
 */
export class RunExplorerProvider implements vscode.TreeDataProvider<vscode.TreeItem>, vscode.Disposable {
  private readonly onDidChangeEmitter = new vscode.EventEmitter<vscode.TreeItem | undefined | void>();
  private readonly runs = new Map<string, RunTreeNodeModel>();
  private readonly runnerEventSubscription: vscode.Disposable;

  constructor(private readonly runnerClient: RunnerClient) {
    void this.hydrateRuns();

    this.runnerEventSubscription = this.runnerClient.onRunEvent(async event => {
      await this.upsertRunNode(event.runId, event);
      this.refresh();
    });
  }

  readonly onDidChangeTreeData = this.onDidChangeEmitter.event;

  getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: vscode.TreeItem): vscode.ProviderResult<vscode.TreeItem[]> {
    if (element instanceof RunTreeItem) {
      return element.node.timeline.map(entry => new RunTimelineTreeItem(entry));
    }

    return [...this.runs.values()]
      .sort((left, right) => right.run.startedAt - left.run.startedAt)
      .map(node => new RunTreeItem(node));
  }

  refresh(): void {
    this.onDidChangeEmitter.fire();
  }

  private async hydrateRuns(): Promise<void> {
    try {
      const runs = await this.runnerClient.listRuns();
      for (const run of runs) {
        const events = await this.runnerClient.getRunEvents(run.runId);
        this.runs.set(run.runId, {
          run,
          timeline: events.map(toTimelineNode),
        });
      }
      this.refresh();
    } catch {
      // Ignore hydration failures. Live events will still populate the view.
    }
  }

  private async upsertRunNode(runId: string, event?: RunnerEvent): Promise<void> {
    const [latestStatus, events] = await Promise.all([
      this.runnerClient.getStatus(runId),
      this.runnerClient.getRunEvents(runId),
    ]);

    if (!latestStatus) {
      if (event) {
        const existing = this.runs.get(runId);
        const fallbackRun: RunnerRunRecord = existing?.run ?? {
          runId: event.runId,
          loopId: event.loopId,
          loopFilePath: event.loopFilePath ?? '',
          status: event.status,
          startedAt: event.timestamp,
          updatedAt: event.timestamp,
          completedAt: undefined,
        };

        fallbackRun.status = event.status;
        fallbackRun.updatedAt = event.timestamp;
        if (event.status === 'succeeded' || event.status === 'failed' || event.status === 'cancelled' || event.status === 'exhausted') {
          fallbackRun.completedAt = event.timestamp;
          fallbackRun.stopReason = event.message;
        }

        this.runs.set(runId, {
          run: fallbackRun,
          timeline: [...(existing?.timeline ?? []), toTimelineNode(event)],
        });
      }

      return;
    }

    this.runs.set(runId, {
      run: latestStatus,
      timeline: events.map(toTimelineNode),
    });
  }

  dispose(): void {
    this.runnerEventSubscription.dispose();
    this.onDidChangeEmitter.dispose();
  }
}

function toTimelineNode(event: RunnerEvent): RunTimelineNodeModel {
  return {
    runId: event.runId,
    stepId: event.transition?.stepId ?? '',
    eventType: event.eventType,
    timestamp: event.timestamp,
    message: event.message,
    stopReasonCode: event.stopReason?.code,
    stopReasonMessage: event.stopReason?.message,
    status: event.status,
    attempt: event.transition?.attempt,
    durationMs: event.stepResult?.durationMs,
    agentClaim: event.agentClaim,
    approvalDecision: event.approvalDecision,
    stepResult: event.stepResult,
    deepLinks: event.deepLinks,
    executionContext: event.executionContext,
  };
}
