import * as vscode from 'vscode';

/**
 * Minimal run explorer provider used by the shell conversion stage.
 * It intentionally returns no items so the welcome view is shown.
 */
export class RunExplorerProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
  private readonly onDidChangeEmitter = new vscode.EventEmitter<vscode.TreeItem | undefined | void>();

  readonly onDidChangeTreeData = this.onDidChangeEmitter.event;

  getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(): vscode.ProviderResult<vscode.TreeItem[]> {
    return [];
  }

  refresh(): void {
    this.onDidChangeEmitter.fire();
  }
}
