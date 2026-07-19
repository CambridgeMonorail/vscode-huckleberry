import * as path from 'path';
import * as vscode from 'vscode';

const LOOP_ROOT = '.huckleberry/loops';
const SUPPORTED_LOOP_FILE_EXTENSIONS = new Set(['.json', '.yaml', '.yml']);
const FILE_TYPE_FILE = 1;
const FILE_TYPE_DIRECTORY = 2;

export interface DiscoveredLoopFile {
  uri: vscode.Uri;
  id: string;
  relativePath: string;
}

/**
 * Returns true when a file path has an extension supported for loop definitions.
 */
export function isSupportedLoopFilePath(filePath: string): boolean {
  return SUPPORTED_LOOP_FILE_EXTENSIONS.has(path.extname(filePath).toLowerCase());
}

/**
 * Builds a stable loop id from a loop-relative file path.
 */
export function buildLoopId(relativePath: string): string {
  const extension = path.extname(relativePath);
  const noExtension = relativePath.slice(0, relativePath.length - extension.length);
  return noExtension.replace(/\\/g, '/');
}

/**
 * Discovers loop files under .huckleberry/loops and exposes a watcher for change events.
 */
export class LoopDiscoveryService {
  async discoverLoopFiles(): Promise<DiscoveredLoopFile[]> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      return [];
    }

    const workspaceRoot = workspaceFolders[0].uri.fsPath;
    const loopsRoot = path.join(workspaceRoot, LOOP_ROOT);
    const loopsRootUri = vscode.Uri.file(loopsRoot);

    try {
      await vscode.workspace.fs.stat(loopsRootUri);
    } catch {
      return [];
    }

    const collected = await this.walkLoopDirectory(loopsRootUri, loopsRootUri);
    return collected.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
  }

  watchLoopFiles(onChanged: () => void): vscode.Disposable {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      return new vscode.Disposable(() => undefined);
    }

    const workspaceRoot = workspaceFolders[0].uri.fsPath;
    const pattern = path.join(workspaceRoot, LOOP_ROOT, '**', '*');
    const watcher = vscode.workspace.createFileSystemWatcher(pattern);

    watcher.onDidCreate(uri => {
      if (isSupportedLoopFilePath(uri.fsPath)) {
        onChanged();
      }
    });
    watcher.onDidChange(uri => {
      if (isSupportedLoopFilePath(uri.fsPath)) {
        onChanged();
      }
    });
    watcher.onDidDelete(uri => {
      if (isSupportedLoopFilePath(uri.fsPath)) {
        onChanged();
      }
    });

    return watcher;
  }

  private async walkLoopDirectory(
    rootUri: vscode.Uri,
    currentUri: vscode.Uri,
  ): Promise<DiscoveredLoopFile[]> {
    const entries = await vscode.workspace.fs.readDirectory(currentUri);
    const discovered: DiscoveredLoopFile[] = [];

    for (const [name, entryType] of entries) {
      const entryUri = vscode.Uri.file(path.join(currentUri.fsPath, name));

      if (entryType === FILE_TYPE_DIRECTORY) {
        const nested = await this.walkLoopDirectory(rootUri, entryUri);
        discovered.push(...nested);
        continue;
      }

      if (entryType !== FILE_TYPE_FILE) {
        continue;
      }

      if (!isSupportedLoopFilePath(name)) {
        continue;
      }

      const relativePath = path.relative(rootUri.fsPath, entryUri.fsPath).replace(/\\/g, '/');
      discovered.push({
        uri: entryUri,
        id: buildLoopId(relativePath),
        relativePath,
      });
    }

    return discovered;
  }
}
