import * as vscode from 'vscode';
import { logWithChannel, LogLevel } from '../utils';
import { EvidenceArtifactNodeModel, EvidenceExplorerProvider } from '../providers/EvidenceExplorerProvider';
import { LoopExplorerProvider, LoopViewItemModel } from '../providers/LoopExplorerProvider';
import { RunExplorerProvider, RunTimelineNodeModel } from '../providers/RunExplorerProvider';
import { WorkflowTemplateService } from '../services';
import { RunnerApprovalAction, RunnerClient } from '../runner';

function extractLoopViewItemModel(input: unknown): LoopViewItemModel | undefined {
  if (input && typeof input === 'object') {
    const value = input as Record<string, unknown>;

    if ('loopFile' in value && 'validation' in value) {
      return input as LoopViewItemModel;
    }

    if ('loopItem' in value && value['loopItem'] && typeof value['loopItem'] === 'object') {
      return value['loopItem'] as LoopViewItemModel;
    }
  }

  return undefined;
}

function extractRunId(input: unknown): string | undefined {
  if (typeof input === 'string') {
    return input;
  }

  if (input && typeof input === 'object') {
    const value = input as Record<string, unknown>;

    if (typeof value['runId'] === 'string') {
      return value['runId'];
    }

    if ('run' in value && value['run'] && typeof value['run'] === 'object') {
      const runRecord = value['run'] as Record<string, unknown>;
      if (typeof runRecord['runId'] === 'string') {
        return runRecord['runId'];
      }
    }

    if (typeof value['description'] === 'string') {
      return value['description'];
    }
  }

  return undefined;
}

function extractTimelineNode(input: unknown): RunTimelineNodeModel | undefined {
  if (input && typeof input === 'object') {
    const value = input as Record<string, unknown>;

    if (typeof value['runId'] === 'string' && typeof value['eventType'] === 'string') {
      return input as RunTimelineNodeModel;
    }

    if ('timeline' in value && value['timeline'] && typeof value['timeline'] === 'object') {
      return value['timeline'] as RunTimelineNodeModel;
    }
  }

  return undefined;
}

function extractEvidenceArtifactNode(input: unknown): EvidenceArtifactNodeModel | undefined {
  if (input && typeof input === 'object') {
    const value = input as Record<string, unknown>;
    if (typeof value['artifactPath'] === 'string' && typeof value['runId'] === 'string' && typeof value['stepId'] === 'string') {
      return input as EvidenceArtifactNodeModel;
    }
  }

  return undefined;
}

/**
 * Registers shell tree views and commands for the Loops and Runs explorers.
 */
export function registerShellViews(context: vscode.ExtensionContext): void {
  const runnerClient = new RunnerClient();
  const loopExplorerProvider = new LoopExplorerProvider();
  const runExplorerProvider = new RunExplorerProvider(runnerClient);
  const evidenceExplorerProvider = new EvidenceExplorerProvider(runnerClient);
  const workflowTemplateService = new WorkflowTemplateService();

  const loopsTreeView = vscode.window.createTreeView('huckleberryLoopsView', {
    treeDataProvider: loopExplorerProvider,
    showCollapseAll: false,
  });

  const runsTreeView = vscode.window.createTreeView('huckleberryRunsView', {
    treeDataProvider: runExplorerProvider,
    showCollapseAll: false,
  });

  const evidenceTreeView = vscode.window.createTreeView('huckleberryEvidenceView', {
    treeDataProvider: evidenceExplorerProvider,
    showCollapseAll: false,
  });

  const viewCommands = [
    vscode.commands.registerCommand('vscode-copilot-huckleberry.loops.refresh', async () => {
      await loopExplorerProvider.refresh();
      logWithChannel(LogLevel.DEBUG, 'Loops view refreshed');
      return Promise.resolve();
    }),
    vscode.commands.registerCommand('vscode-copilot-huckleberry.runs.refresh', () => {
      runExplorerProvider.refresh();
      logWithChannel(LogLevel.DEBUG, 'Runs view refreshed');
      return Promise.resolve();
    }),
    vscode.commands.registerCommand('vscode-copilot-huckleberry.evidence.refresh', async () => {
      await evidenceExplorerProvider.refresh();
      logWithChannel(LogLevel.DEBUG, 'Evidence view refreshed');
      return Promise.resolve();
    }),
    vscode.commands.registerCommand('vscode-copilot-huckleberry.runs.getStatus', async (runInput: unknown) => {
      const runId = extractRunId(runInput);
      if (!runId) {
        vscode.window.showWarningMessage('Run ID is required to query status.');
        return Promise.resolve();
      }

      const runStatus = await runnerClient.getStatus(runId);
      if (!runStatus) {
        vscode.window.showWarningMessage(`Run '${runId}' was not found.`);
        return Promise.resolve();
      }

      vscode.window.showInformationMessage(
        `Run '${runStatus.runId}' for loop '${runStatus.loopId}' is currently '${runStatus.status}'.`,
      );
      return Promise.resolve();
    }),
    vscode.commands.registerCommand('vscode-copilot-huckleberry.runs.cancel', async (runInput: unknown) => {
      const runId = extractRunId(runInput);
      if (!runId) {
        vscode.window.showWarningMessage('Run ID is required to cancel a run.');
        return Promise.resolve();
      }

      await runnerClient.cancelRun(runId);
      vscode.window.showInformationMessage(`Cancellation requested for run '${runId}'.`);
      return Promise.resolve();
    }),
    vscode.commands.registerCommand('vscode-copilot-huckleberry.runs.approvalAction', async (runInput: unknown) => {
      const runId = extractRunId(runInput);
      if (!runId) {
        vscode.window.showWarningMessage('Run ID is required to submit an approval decision.');
        return Promise.resolve();
      }

      const actionPick = await vscode.window.showQuickPick(
        [
          { label: 'Approve', action: 'approve' as RunnerApprovalAction },
          { label: 'Reject', action: 'reject' as RunnerApprovalAction },
          { label: 'Defer', action: 'defer' as RunnerApprovalAction },
        ],
        {
          title: `Approval decision for run ${runId}`,
          placeHolder: 'Select an approval action',
        },
      );

      if (!actionPick) {
        return Promise.resolve();
      }

      const note = await vscode.window.showInputBox({
        title: `Optional note for ${actionPick.label.toLowerCase()}`,
        placeHolder: 'Add an auditable note (optional)',
      });

      const actorId = process.env['USERNAME'] ?? process.env['USER'] ?? 'unknown-actor';
      await runnerClient.submitApprovalAction(runId, actionPick.action, actorId, actorId, note);
      vscode.window.showInformationMessage(`Submitted ${actionPick.label.toLowerCase()} decision for run '${runId}'.`);
      return Promise.resolve();
    }),
    vscode.commands.registerCommand('vscode-copilot-huckleberry.runs.openStepEvidence', async (input: unknown) => {
      const timelineNode = extractTimelineNode(input);
      if (!timelineNode || !timelineNode.stepResult) {
        vscode.window.showWarningMessage('No step evidence is available for this timeline entry.');
        return Promise.resolve();
      }

      const quickPick = await vscode.window.showQuickPick(
        [
          {
            label: 'Stdout',
            description: timelineNode.stepResult.stdoutArtifactPath,
            path: timelineNode.stepResult.stdoutArtifactPath,
          },
          {
            label: 'Stderr',
            description: timelineNode.stepResult.stderrArtifactPath,
            path: timelineNode.stepResult.stderrArtifactPath,
          },
          {
            label: 'Metadata',
            description: timelineNode.stepResult.metadataArtifactPath,
            path: timelineNode.stepResult.metadataArtifactPath,
          },
        ],
        {
          title: `Open evidence for ${timelineNode.stepId || timelineNode.eventType}`,
          placeHolder: 'Select artifact to open',
        },
      );

      if (!quickPick) {
        return Promise.resolve();
      }

      await vscode.commands.executeCommand('vscode.open', vscode.Uri.file(quickPick.path));
      return Promise.resolve();
    }),
    vscode.commands.registerCommand('vscode-copilot-huckleberry.evidence.openArtifact', async (input: unknown) => {
      const artifact = extractEvidenceArtifactNode(input);
      if (!artifact) {
        vscode.window.showWarningMessage('No evidence artifact is associated with this item.');
        return Promise.resolve();
      }

      try {
        await vscode.workspace.fs.stat(vscode.Uri.file(artifact.artifactPath));
      } catch {
        vscode.window.showWarningMessage(`Artifact is missing or stale: ${artifact.artifactPath}`);
        return Promise.resolve();
      }

      await vscode.commands.executeCommand('vscode.open', vscode.Uri.file(artifact.artifactPath));
      return Promise.resolve();
    }),
    vscode.commands.registerCommand('vscode-copilot-huckleberry.evidence.revealArtifact', async (input: unknown) => {
      const artifact = extractEvidenceArtifactNode(input);
      if (!artifact) {
        vscode.window.showWarningMessage('No evidence artifact is associated with this item.');
        return Promise.resolve();
      }

      try {
        await vscode.workspace.fs.stat(vscode.Uri.file(artifact.artifactPath));
      } catch {
        vscode.window.showWarningMessage(`Artifact is missing or stale: ${artifact.artifactPath}`);
        return Promise.resolve();
      }

      await vscode.commands.executeCommand('revealFileInOS', vscode.Uri.file(artifact.artifactPath));
      return Promise.resolve();
    }),
    vscode.commands.registerCommand('vscode-copilot-huckleberry.loops.runLoop', async (input: unknown) => {
      const item = extractLoopViewItemModel(input);
      if (!item) {
        vscode.window.showWarningMessage('Loop selection is required to start a run.');
        return Promise.resolve();
      }

      if (!item.validation.valid) {
        vscode.window.showWarningMessage('Only valid loops can be started.');
        return Promise.resolve();
      }

      const runId = await runnerClient.startRun(item.loopFile.id, item.loopFile.uri.fsPath);
      vscode.window.showInformationMessage(`Started run '${runId}' for loop '${item.loopFile.id}'.`);
      return Promise.resolve();
    }),
    vscode.commands.registerCommand(
      'vscode-copilot-huckleberry.loops.createStarterTemplates',
      async () => {
        const result = await workflowTemplateService.createStarterTemplates();
        await loopExplorerProvider.refresh();

        if (result.created.length === 0) {
          vscode.window.showInformationMessage(
            `Starter templates already exist (${result.skipped.join(', ')}).`,
          );
          return Promise.resolve();
        }

        vscode.window.showInformationMessage(
          `Created starter templates: ${result.created.join(', ')}.`,
        );
        return Promise.resolve();
      },
    ),
    vscode.commands.registerCommand(
      'vscode-copilot-huckleberry.loops.openLoopDefinition',
      async (item: LoopViewItemModel) => {
        await vscode.commands.executeCommand('vscode.open', item.loopFile.uri);

        if (item.validation.valid) {
          vscode.window.showInformationMessage(`Loop '${item.loopFile.id}' is valid.`);
          return Promise.resolve();
        }

        const summary = item.validation.errors
          .slice(0, 3)
          .map(error => `${error.code}: ${error.message}`)
          .join(' | ');
        vscode.window.showWarningMessage(
          `Loop '${item.loopFile.id}' has ${item.validation.errors.length} validation issue(s): ${summary}`,
        );
        return Promise.resolve();
      },
    ),
    vscode.commands.registerCommand('vscode-copilot-huckleberry.debugWelcomeView', () => {
      vscode.window.showInformationMessage('Loops and Runs views are active with shell empty states.');
      return Promise.resolve();
    }),
    vscode.commands.registerCommand('vscode-copilot-huckleberry.debugTreeViewProperties', () => {
      vscode.window.showInformationMessage('Use Developer: Inspect Context Keys to inspect Loops/Runs view state.');
      return Promise.resolve();
    }),
  ];

  context.subscriptions.push(
    runnerClient,
    loopExplorerProvider,
    runExplorerProvider,
    evidenceExplorerProvider,
    loopsTreeView,
    runsTreeView,
    evidenceTreeView,
    ...viewCommands,
  );
}
