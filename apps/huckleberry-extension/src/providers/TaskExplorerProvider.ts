/**
 * TreeDataProvider implementation for visualizing tasks in a hierarchical view
 */
import * as vscode from 'vscode';
import { Task, TaskPriority, TaskStatus } from '../types';
import { readTasksJson, getWorkspacePaths } from '../handlers/tasks/taskUtils';
import { priorityEmoji } from '../lib/tasks/taskUtils.lib';
import { ToolManager } from '../services/toolManager';
import { logWithChannel, LogLevel } from '../utils/debugUtils';

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
export class TaskExplorerProvider implements vscode.TreeDataProvider<TaskTreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<TaskTreeItem | undefined | null | void> = new vscode.EventEmitter<TaskTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<TaskTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

  private _sortByPriority = false;
  private _showCompleted = false;
  private _filterPriority?: TaskPriority;
  private _filterStatus?: TaskStatus;
  private _directoryStructureReady = false;  // Flag to track if directory structure is ready
  
  constructor(private readonly toolManager: ToolManager) {
    // Explicitly set context variables for correct viewsWelcome visibility
    // We need to be explicit about the state to avoid welcome view problems
    vscode.commands.executeCommand('setContext', 'huckleberry.isInitialized', false);
    vscode.commands.executeCommand('setContext', 'huckleberry.hasTaskData', false);
    
    // Log initial context state
    logWithChannel(LogLevel.INFO, '🔍 Initial context state set to false/false for viewsWelcome visibility');
    
    // Watch for changes to the tasks.json file and check directory structure
    this.setupFileWatcher();
    
    // Check for existing directory structure
    this.checkDirectoryStructure().then(isReady => {
      // The checkDirectoryStructure method already updates context state
      logWithChannel(LogLevel.INFO, `Task explorer initialized with isReady=${isReady}`);
    }).catch(error => {
      logWithChannel(LogLevel.ERROR, 'Error checking task directory structure:', error);
      this.updateContextState(false, false);
    });
  }

  /**
   * Updates VS Code context variables to control welcome view visibility
   * @param isInitialized Whether the task system is initialized
   * @param hasData Whether there are any tasks available
   */
  private updateContextState(isInitialized: boolean, hasData?: boolean): void {
    // Set context explicitly to control welcome view visibility
    vscode.commands.executeCommand('setContext', 'huckleberry.isInitialized', isInitialized);
    
    // Only update hasData if it's provided, otherwise leave it as is
    if (hasData !== undefined) {
      vscode.commands.executeCommand('setContext', 'huckleberry.hasTaskData', hasData);
    }
    
    // Log this with higher visibility to debug welcome view issues
    logWithChannel(LogLevel.INFO, `🔍 Updated context state: isInitialized=${isInitialized}, hasData=${hasData !== undefined ? hasData : '(unchanged)'}`);
  }

  /**
   * Sets up file watchers for task-related files
   */
  private async setupFileWatcher(): Promise<void> {
    try {
      const { tasksJsonPath, tasksDir } = await getWorkspacePaths();

      // Create file watchers for both tasks.json and the tasks directory
      logWithChannel(LogLevel.DEBUG, `Setting up file watcher for tasks.json at ${tasksJsonPath}`);
      const tasksJsonWatcher = vscode.workspace.createFileSystemWatcher(tasksJsonPath);
      const tasksDirWatcher = vscode.workspace.createFileSystemWatcher(`${tasksDir}/**`);

      // Watch for tasks.json file changes
      tasksJsonWatcher.onDidChange(() => {
        logWithChannel(LogLevel.DEBUG, 'tasks.json changed, refreshing task explorer');
        this.refresh();
      });
      
      tasksJsonWatcher.onDidCreate(() => {
        logWithChannel(LogLevel.INFO, 'tasks.json created, initializing task explorer');
        this._directoryStructureReady = true;
        this.updateContextState(true, false); // Initially no tasks
        this.refresh();
      });

      tasksJsonWatcher.onDidDelete(() => {
        logWithChannel(LogLevel.WARN, 'tasks.json deleted, marking directory structure as not ready');
        this._directoryStructureReady = false;
        this.updateContextState(false, false);
        this.refresh();
      });

      // Watch for changes in the tasks directory
      tasksDirWatcher.onDidCreate(uri => {
        if (uri.fsPath === tasksJsonPath) {
          logWithChannel(LogLevel.INFO, 'tasks.json created in tasks directory, initializing task explorer');
          this._directoryStructureReady = true;
          this.refresh();
        }
      });
    } catch (error) {
      logWithChannel(LogLevel.ERROR, 'Error setting up task file watcher:', error);
    }
  }
  
  /**
   * Checks if the directory structure for tasks is properly set up
   * @returns Promise resolving to true if directory structure is ready
   */
  private async checkDirectoryStructure(): Promise<boolean> {
    try {
      const { tasksDir, tasksJsonPath } = await getWorkspacePaths();
      let directoryExists = false;
      let fileExists = false;      // Log detailed diagnostic information
      logWithChannel(LogLevel.INFO, '🔍 Checking task directory structure', {
        tasksDir,
        tasksJsonPath,
      });

      // Check if the tasks directory exists
      try {
        await vscode.workspace.fs.stat(vscode.Uri.file(tasksDir));
        logWithChannel(LogLevel.DEBUG, `Tasks directory exists at ${tasksDir}`);
        directoryExists = true;
      } catch {
        // Error means directory doesn't exist
        logWithChannel(LogLevel.INFO, `Tasks directory does not exist at ${tasksDir}`);
        directoryExists = false;
      }

      // Check if the tasks.json file exists
      try {
        await vscode.workspace.fs.stat(vscode.Uri.file(tasksJsonPath));
        logWithChannel(LogLevel.DEBUG, `tasks.json exists at ${tasksJsonPath}`);
        fileExists = true;
      } catch {
        // Error means file doesn't exist
        logWithChannel(LogLevel.INFO, `tasks.json does not exist at ${tasksJsonPath}`);
        fileExists = false;
      }

      // Determine initialization state based on both directory and file
      if (directoryExists && fileExists) {
        this._directoryStructureReady = true;

        // Check if there are any tasks
        const tasksData = await readTasksJson(this.toolManager, tasksJsonPath);
        const hasTasks = !!(tasksData.tasks && tasksData.tasks.length > 0);
        this.updateContextState(true, hasTasks);
        logWithChannel(LogLevel.INFO, `🧩 Tasks found: ${hasTasks ? 'Yes' : 'No'}, displaying appropriate view`);

        return true;
      } else {
        // Not initialized - directory or file missing
        this._directoryStructureReady = false;
        this.updateContextState(false, false);
        logWithChannel(LogLevel.INFO, `⚠️ Task structure incomplete: directory=${directoryExists}, file=${fileExists}`);
        return false;
      }
    } catch (error) {
      logWithChannel(LogLevel.ERROR, '❌ Error checking task directory structure:', error);
      this._directoryStructureReady = false;
      this.updateContextState(false, false);
      return false;
    }
  }

  /**
   * Checks if the tasks system is initialized with proper files
   */
  private async isInitialized(): Promise<boolean> {
    if (this._directoryStructureReady) {
      return true;
    }

    // Check the structure if we haven't confirmed it yet
    return await this.checkDirectoryStructure();
  }

  /**
   * Debug method to analyze why welcome view isn't showing
   * This method logs detailed information about the current state
   * and tries to fix welcome view visibility
   */
  async debugWelcomeView(): Promise<void> {
    const initialized = await this.isInitialized();
    
    // Log current state
    logWithChannel(LogLevel.INFO, '🔍 DEBUG WELCOME VIEW STATE:', {
      isInitialized: initialized,
      directoryStructureReady: this._directoryStructureReady,
      contextValues: {
        isInitializedContext: 'Check with "Developer: Inspect Context Keys" for huckleberry.isInitialized',
        hasTaskDataContext: 'Check with "Developer: Inspect Context Keys" for huckleberry.hasTaskData',
      },
      whenClauseForEmptyState: 'view == huckleberryTaskExplorer && huckleberry.isInitialized == false',
      whenClauseForNoTasksState: 'view == huckleberryTaskExplorer && huckleberry.isInitialized == true && huckleberry.hasTaskData == false',
    });
    
    // Try to fix context values for welcome view
    if (!initialized) {
      vscode.commands.executeCommand('setContext', 'huckleberry.isInitialized', false);
      vscode.commands.executeCommand('setContext', 'huckleberry.hasTaskData', false);
      
      logWithChannel(LogLevel.INFO, '🔧 Context values explicitly reset for welcome view visibility');
      
      // Force treeview refresh
      this._onDidChangeTreeData.fire();
      
      // Open the Command Palette for manually running commands
      vscode.window.showInformationMessage('Debug: Welcome view should appear. Try the initialize command:', 'Initialize Task Tracking')
        .then(selection => {
          if (selection === 'Initialize Task Tracking') {
            vscode.commands.executeCommand('vscode-copilot-huckleberry.initializeTaskTracking');
          }
        });
    } else {
      // Check if there are any tasks
      try {
        const { tasksJsonPath } = await getWorkspacePaths();
        try {
          await vscode.workspace.fs.stat(vscode.Uri.file(tasksJsonPath));
          const tasksData = await readTasksJson(this.toolManager, tasksJsonPath);
          const hasTasks = !!(tasksData.tasks && tasksData.tasks.length > 0);
          vscode.commands.executeCommand('setContext', 'huckleberry.isInitialized', true);
          vscode.commands.executeCommand('setContext', 'huckleberry.hasTaskData', hasTasks);
          logWithChannel(LogLevel.INFO, `🔧 Context values reset for ${hasTasks ? 'has tasks' : 'no tasks'} state`);
        } catch {
          vscode.commands.executeCommand('setContext', 'huckleberry.isInitialized', true);
          vscode.commands.executeCommand('setContext', 'huckleberry.hasTaskData', false);
          logWithChannel(LogLevel.INFO, '🔧 Context values reset for initialized but no tasks.json');
        }
      } catch (error) {
        logWithChannel(LogLevel.ERROR, '❌ Error during debug:', error);
      }
    }

    // Force-refresh tree
    this._onDidChangeTreeData.fire();
    
    // Help message with additional diagnostics
    vscode.window.showInformationMessage(
      'Debug: Check VS Code output for detailed diagnostics.',
    );
  }

  refresh(): void {
    // First, check if initialization state has changed
    this.isInitialized().then(initialized => {
      // Always emit the change event to refresh the tree view
      this._onDidChangeTreeData.fire();
      
      if (!initialized) {
        // Force context update with false/false to ensure welcome view conditions are met
        this.updateContextState(false, false);
        logWithChannel(LogLevel.INFO, '🔄 Refresh: Task explorer not initialized, ensuring welcome view visibility');
      }
    }).catch(error => {
      // Even if there's an error, fire the data change event
      this._onDidChangeTreeData.fire();
      logWithChannel(LogLevel.ERROR, 'Error during refresh:', error);
    });
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

  getTreeItem(element: TaskTreeItem): vscode.TreeItem {
    return element;
  }

  public async getChildren(element?: TaskTreeItem): Promise<TaskTreeItem[]> {
    logWithChannel(LogLevel.INFO, '🌲 Getting children for TaskExplorer element:', element ? 'TaskTreeItem' : 'undefined');

    // Check if the tasks system is initialized
    const initialized = await this.isInitialized();

    if (!initialized) {
      logWithChannel(LogLevel.INFO, '⚠️ Task directory structure not ready. Showing "Initialize" welcome view.');
      
      // CRITICAL: Always update context with false/false when not initialized
      // This ensures the welcome view conditions are correctly met
      this.updateContextState(false, false);
      
      // Log detailed context information
      logWithChannel(LogLevel.INFO, '🔍 Context values during getChildren when not initialized:', {
        currentContext_huckleberry_isInitialized: false,
        currentContext_huckleberry_hasTaskData: false,
        elementType: element ? 'TaskTreeItem' : 'undefined',
        whenClauseUsed: 'view == huckleberryTaskExplorer && huckleberry.isInitialized == false',
      });
      
      // IMPORTANT: Always return [] not undefined for empty state to work properly
      return [];
    }

    // If this is a subtask request, handle it with existing logic
    if (element instanceof TaskTreeItem) {
      return this.getTaskChildren(element);
    }

    // Tasks are initialized, get the regular task list
    return this.getTaskChildren();
  }

  private async getTaskChildren(element?: TaskTreeItem): Promise<TaskTreeItem[]> {
    try {
      const { tasksJsonPath } = await getWorkspacePaths();

      // Check if tasks.json exists
      try {
        await vscode.workspace.fs.stat(vscode.Uri.file(tasksJsonPath));
      } catch {
        logWithChannel(LogLevel.INFO, `tasks.json does not exist at ${tasksJsonPath}`);
        this._directoryStructureReady = false;
        this.updateContextState(false, false); // Not initialized, explicitly set context
        // IMPORTANT: Always return [] not undefined for empty state
        return [];
      }

      // Read the task data
      const tasksData = await readTasksJson(this.toolManager, tasksJsonPath);

      // Check if we have any tasks
      if (!tasksData.tasks || tasksData.tasks.length === 0) {
        logWithChannel(LogLevel.INFO, '📋 No tasks found in tasks.json - showing "Create Task" welcome view');
        this.updateContextState(true, false); // Initialized but no tasks - will show the "Create Task" welcome view
        // IMPORTANT: Always return [] not undefined for empty state
        return [];
      }

      // We have tasks, update context
      logWithChannel(LogLevel.DEBUG, `📋 Found ${tasksData.tasks.length} tasks in tasks.json`);
      this.updateContextState(true, true);

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
          const priorityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
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
