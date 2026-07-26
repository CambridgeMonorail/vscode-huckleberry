import * as vscode from 'vscode';
import { LoopDiscoveryService, DiscoveredLoopFile } from '../services/loopDiscoveryService';
import { WorkflowValidationService, LoopValidationResult } from '../services/workflowValidationService';

export interface LoopViewItemModel {
  loopFile: DiscoveredLoopFile;
  validation: LoopValidationResult;
}

export interface LoopRefreshSummary {
  discoveredCount: number;
  validCount: number;
  invalidCount: number;
}

/**
 * Tree item representing a discovered workflow loop file.
 */
class LoopTreeItem extends vscode.TreeItem {
  constructor(public readonly loopItem: LoopViewItemModel) {
    const item = loopItem;
    super(item.loopFile.id, vscode.TreeItemCollapsibleState.None);
    const statusText = item.validation.valid ? 'valid' : `invalid (${item.validation.errors.length})`;

    this.description = `${statusText} • ${item.loopFile.relativePath}`;
    this.tooltip = item.validation.valid
      ? `${item.loopFile.relativePath}\nValidation: valid`
      : `${item.loopFile.relativePath}\nValidation: invalid\n${item.validation.errors
        .slice(0, 5)
        .map(error => `- ${error.code}: ${error.message}`)
        .join('\n')}`;
    this.contextValue = item.validation.valid ? 'loopValid' : 'loopInvalid';
    this.iconPath = item.validation.valid
      ? new vscode.ThemeIcon('pass')
      : new vscode.ThemeIcon('warning');
    this.command = {
      command: 'vscode-copilot-huckleberry.loops.openLoopDefinition',
      title: 'Open Loop Definition with Validation Summary',
      arguments: [item],
    };
  }
}

/**
 * TreeDataProvider that lists discovered loop definitions.
 */
export class LoopExplorerProvider implements vscode.TreeDataProvider<vscode.TreeItem>, vscode.Disposable {
  private readonly onDidChangeEmitter = new vscode.EventEmitter<vscode.TreeItem | undefined | void>();
  private readonly watcher: vscode.Disposable;
  private loopItems: LoopViewItemModel[] = [];

  constructor(
    private readonly discoveryService: LoopDiscoveryService = new LoopDiscoveryService(),
    private readonly workflowValidationService: WorkflowValidationService = new WorkflowValidationService(),
  ) {
    this.watcher = this.discoveryService.watchLoopFiles(() => {
      void this.refresh();
    });
    void this.refresh();
  }

  readonly onDidChangeTreeData = this.onDidChangeEmitter.event;

  getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(): vscode.ProviderResult<vscode.TreeItem[]> {
    return this.loopItems.map(loopItem => new LoopTreeItem(loopItem));
  }

  getLoopItems(): readonly LoopViewItemModel[] {
    return [...this.loopItems];
  }

  async refresh(): Promise<LoopRefreshSummary> {
    const loopFiles = await this.discoveryService.discoverLoopFiles();
    this.loopItems = await Promise.all(
      loopFiles.map(async loopFile => {
        const validation = await this.workflowValidationService.validateFile(loopFile.uri);
        return {
          loopFile,
          validation,
        };
      }),
    );

    this.onDidChangeEmitter.fire();

    return {
      discoveredCount: this.loopItems.length,
      validCount: this.loopItems.filter(item => item.validation.valid).length,
      invalidCount: this.loopItems.filter(item => !item.validation.valid).length,
    };
  }

  dispose(): void {
    this.watcher.dispose();
    this.onDidChangeEmitter.dispose();
  }
}
