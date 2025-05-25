/**
 * TreeDataProvider implementation for visualizing tasks in a hierarchical view
 */
import * as vscode from 'vscode';
import { Task, TaskPriority, TaskStatus } from '../types';
import { readTasksJson, getWorkspacePaths } from '../handlers/tasks/taskUtils';
import { priorityEmoji } from '../lib/tasks/taskUtils.lib';
import { ToolManager } from '../services/toolManager';
import { logWithChannel, LogLevel } from '../utils/debugUtils';

class WelcomeTreeItem extends vscode.TreeItem {
  constructor() {
    super('Initialize Task Tracking', vscode.TreeItemCollapsibleState.None);
    this.tooltip = 'Click to set up task tracking in your workspace';
    this.iconPath = new vscode.ThemeIcon('gear');
    this.command = {
      title: 'Initialize Task Tracking',
      command: 'vscode-copilot-huckleberry.initializeTaskTracking',
    };
  }
}

/**
 * Represents a task item in the TreeView
 */
export class TaskTreeItem extends vscode.TreeItem {
  constructor(
    public readonly task: Task,
    override readonly collapsibleState: vscode.TreeItemCollapsibleState,
  ) {
    super(task.title, collapsibleState);
    this.tooltip = this.buildTooltip(task);
    this.description = task.id;
    this.contextValue = task.completed ? 'completedTask' : 'incompleteTask';
    this.iconPath = this.getIconPath(task);
  }

  private buildTooltip(task: Task): string {
    const lines: string[] = [
      `ID: ${task.id}`,
      `Status: ${task.status ?? 'Not Set'}`,
      `Priority: ${priorityEmoji[task.priority ?? 'medium']} ${task.priority ?? 'Not Set'}`,
      task.completed ? 'Completed ✓' : '',
      task.description ?? '',
    ];
    return lines.filter(Boolean).join('\n');
  }

  private getIconPath(task: Task): vscode.ThemeIcon {
    if (task.completed) {
      return new vscode.ThemeIcon('check');
    }
    
    switch (task.status) {
      case 'in-progress':
        return new vscode.ThemeIcon('play');
      case 'blocked':
        return new vscode.ThemeIcon('warning');
      case 'review':
        return new vscode.ThemeIcon('eye');
      default:
        return new vscode.ThemeIcon('circle-outline');
    }
  }
}

/**
 * TreeDataProvider for task visualization
 */
export class TaskExplorerProvider implements vscode.TreeDataProvider<TaskTreeItem | WelcomeTreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<TaskTreeItem | WelcomeTreeItem | undefined | null | void> = new vscode.EventEmitter<TaskTreeItem | WelcomeTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<TaskTreeItem | WelcomeTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

  private _sortByPriority = false;
  private _showCompleted = false;
  private _filterPriority?: TaskPriority;
  private _filterStatus?: TaskStatus;

  constructor(private readonly toolManager: ToolManager) {
    // Watch for changes to the tasks.json file
    this.setupFileWatcher();
  }

  private async setupFileWatcher(): Promise<void> {
    try {
      const { tasksJsonPath } = await getWorkspacePaths();
      const watcher = vscode.workspace.createFileSystemWatcher(tasksJsonPath);
      
      watcher.onDidChange(() => this.refresh());
      watcher.onDidCreate(() => this.refresh());
      watcher.onDidDelete(() => this.refresh());
    } catch (error) {
      logWithChannel(LogLevel.ERROR, 'Error setting up task file watcher:', error);
    }
  }

  private async isInitialized(): Promise<boolean> {
    try {
      const { tasksDir, tasksJsonPath } = await getWorkspacePaths();
      
      // Check if the files exist
      try {
        await vscode.workspace.fs.stat(vscode.Uri.file(tasksJsonPath));
        await vscode.workspace.fs.stat(vscode.Uri.file(tasksDir));
        return true;
      } catch {
        return false;
      }
    } catch {
      return false;
    }
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  toggleSortByPriority(): void {
    this._sortByPriority = !this._sortByPriority;
    this.refresh();
  }

  toggleShowCompleted(): void {
    this._showCompleted = !this._showCompleted;
    this.refresh();
  }

  setFilterPriority(priority: TaskPriority | undefined): void {
    this._filterPriority = priority;
    this.refresh();
  }

  setFilterStatus(status: TaskStatus | undefined): void {
    this._filterStatus = status;
    this.refresh();
  }

  getTreeItem(element: TaskTreeItem | WelcomeTreeItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: TaskTreeItem | WelcomeTreeItem): Promise<Array<TaskTreeItem | WelcomeTreeItem>> {
    // If this is a subtask request, handle it with existing logic
    if (element instanceof TaskTreeItem) {
      return this.getTaskChildren(element);
    }

    // For root level, first check if tasks are initialized
    if (!await this.isInitialized()) {
      return [new WelcomeTreeItem()];
    }

    // Tasks are initialized, get the regular task list
    return this.getTaskChildren();
  }

  private async getTaskChildren(element?: TaskTreeItem): Promise<TaskTreeItem[]> {
    try {
      const { tasksJsonPath } = await getWorkspacePaths();
      const tasksData = await readTasksJson(this.toolManager, tasksJsonPath);

      if (!tasksData.tasks || tasksData.tasks.length === 0) {
        return [];
      }

      let tasks = tasksData.tasks;

      if (element) {
        // Return subtasks if this is a parent task
        if (element.task.subtasks) {
          tasks = tasks.filter(t => element.task.subtasks?.includes(t.id));
        } else {
          return [];
        }
      } else {
        // Root level - only show tasks without parents
        tasks = tasks.filter(t => !t.parentTaskId);
      }

      // Apply filters
      if (!this._showCompleted) {
        tasks = tasks.filter(t => !t.completed);
      }

      if (this._filterPriority) {
        tasks = tasks.filter(t => t.priority === this._filterPriority);
      }

      if (this._filterStatus) {
        tasks = tasks.filter(t => t.status === this._filterStatus);
      }

      // Sort tasks
      tasks.sort((a, b) => {
        if (this._sortByPriority) {
          const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
          const aPriority = a.priority ? priorityOrder[a.priority] : 4;
          const bPriority = b.priority ? priorityOrder[b.priority] : 4;
          if (aPriority !== bPriority) {
            return aPriority - bPriority;
          }
        }

        // Secondary sort by ID (which includes creation order)
        return a.id.localeCompare(b.id);
      });

      // Convert to TreeItems
      return tasks.map(task => {
        const hasSubtasks = task.subtasks && task.subtasks.length > 0;
        const state = hasSubtasks ? 
          vscode.TreeItemCollapsibleState.Collapsed : 
          vscode.TreeItemCollapsibleState.None;
        return new TaskTreeItem(task, state);
      });
    } catch (error) {
      logWithChannel(LogLevel.ERROR, 'Error getting tasks for explorer view:', error);
      return [];
    }
  }
}
