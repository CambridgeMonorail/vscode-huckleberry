import * as vscode from 'vscode';
import { logWithChannel, LogLevel } from '../utils';
import { LoopExplorerProvider, LoopViewItemModel } from '../providers/LoopExplorerProvider';
import { RunExplorerProvider } from '../providers/RunExplorerProvider';
import { WorkflowTemplateService } from '../services';

/**
 * Registers shell tree views and commands for the Loops and Runs explorers.
 */
export function registerShellViews(context: vscode.ExtensionContext): void {
  const loopExplorerProvider = new LoopExplorerProvider();
  const runExplorerProvider = new RunExplorerProvider();
  const workflowTemplateService = new WorkflowTemplateService();

  const loopsTreeView = vscode.window.createTreeView('huckleberryLoopsView', {
    treeDataProvider: loopExplorerProvider,
    showCollapseAll: false,
  });

  const runsTreeView = vscode.window.createTreeView('huckleberryRunsView', {
    treeDataProvider: runExplorerProvider,
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

  context.subscriptions.push(loopExplorerProvider, loopsTreeView, runsTreeView, ...viewCommands);
}
