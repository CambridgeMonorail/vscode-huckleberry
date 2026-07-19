import * as vscode from 'vscode';
import { RunnerClient, RunnerRunRecord } from '../runner';

class RunTreeItem extends vscode.TreeItem {
  constructor(public readonly run: RunnerRunRecord) {
    super(`${run.loopId} (${run.status})`, vscode.TreeItemCollapsibleState.None);
    this.description = run.runId;
    this.tooltip = `${run.loopFilePath}\nStatus: ${run.status}\nRun ID: ${run.runId}`;
    this.contextValue = `run-${run.status}`;
    this.iconPath = this.getIconForStatus(run.status);
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

/**
 * Run explorer provider backed by runner events.
 */
export class RunExplorerProvider implements vscode.TreeDataProvider<vscode.TreeItem>, vscode.Disposable {
  private readonly onDidChangeEmitter = new vscode.EventEmitter<vscode.TreeItem | undefined | void>();
  private readonly runs = new Map<string, RunnerRunRecord>();
  private readonly runnerEventSubscription: vscode.Disposable;

  constructor(private readonly runnerClient: RunnerClient) {
    void this.hydrateRuns();

    this.runnerEventSubscription = this.runnerClient.onRunEvent(async event => {
      const latestStatus = await this.runnerClient.getStatus(event.runId);
      if (latestStatus) {
        this.runs.set(event.runId, latestStatus);
        this.refresh();
      }
    });
  }

  readonly onDidChangeTreeData = this.onDidChangeEmitter.event;

  getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(): vscode.ProviderResult<vscode.TreeItem[]> {
    return [...this.runs.values()]
      .sort((left, right) => right.startedAt - left.startedAt)
      .map(run => new RunTreeItem(run));
  }

  refresh(): void {
    this.onDidChangeEmitter.fire();
  }

  private async hydrateRuns(): Promise<void> {
    try {
      const runs = await this.runnerClient.listRuns();
      for (const run of runs) {
        this.runs.set(run.runId, run);
      }
      this.refresh();
    } catch {
      // Ignore hydration failures. Live events will still populate the view.
    }
  }

  dispose(): void {
    this.runnerEventSubscription.dispose();
    this.onDidChangeEmitter.dispose();
  }
}
