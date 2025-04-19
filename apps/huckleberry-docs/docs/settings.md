---
sidebar_position: 9
---

# Settings

Huckleberry provides several configuration options that can be customized through VS Code's settings interface.

## Accessing Settings

You can access Huckleberry's settings in VS Code through:

1. **Command Palette**: Press `Ctrl+,` (Windows/Linux) or `Cmd+,` (Mac) and search for "Huckleberry"
2. **Settings UI**: Go to File → Preferences → Settings (or Code → Preferences → Settings on Mac) and search for "Huckleberry"
3. **settings.json**: Add settings directly to your `settings.json` file

## Available Settings

### Task Storage

| Setting | Description | Default | Options |
|---------|-------------|---------|---------|
| `huckleberry.taskmanager.defaultTasksLocation` | Directory where tasks are stored | `"tasks"` | Any valid relative path |
| `huckleberry.taskmanager.taskFileTemplate` | Format template for individual task files | `"markdown"` | `"markdown"`, `"json"` |

### Task Defaults

| Setting | Description | Default | Options |
|---------|-------------|---------|---------|
| `huckleberry.taskmanager.defaultTaskPriority` | Default priority for new tasks | `"medium"` | `"low"`, `"medium"`, `"high"` |
| `huckleberry.taskmanager.defaultDueDate` | Default due date setting | `"none"` | `"none"`, `"oneWeek"`, `"twoWeeks"`, `"custom"` |

### Behavior Settings

| Setting | Description | Default | Options |
|---------|-------------|---------|---------|
| `huckleberry.taskmanager.autoScanTodos` | Automatically scan for TODOs when initializing task tracking | `false` | `true`, `false` |
| `huckleberry.taskmanager.todoCommentPatterns` | Patterns to match when scanning for TODOs | `["TODO:", "FIXME:", "BUG:"]` | Array of strings |
| `huckleberry.taskmanager.enableNotifications` | Show notifications for task operations | `true` | `true`, `false` |

## Examples

### Custom Task Location

To change where tasks are stored:

```json
{
  "huckleberry.taskmanager.defaultTasksLocation": ".huckleberry/tasks"
}
```

This would store tasks in a `.huckleberry/tasks` directory in your workspace.

### Custom TODO Patterns

To customize which comment patterns are recognized as TODOs:

```json
{
  "huckleberry.taskmanager.todoCommentPatterns": [
    "TODO:", 
    "FIXME:", 
    "BUG:", 
    "HACK:", 
    "NOTE:"
  ]
}
```

### Setting Default Task Priority

To make all new tasks high priority by default:

```json
{
  "huckleberry.taskmanager.defaultTaskPriority": "high"
}
```

## Settings File Location

Huckleberry settings can be applied at different levels:

- **User Settings**: Apply to all workspaces (stored in your user settings file)
- **Workspace Settings**: Apply only to the current workspace (stored in `.vscode/settings.json`)
- **Folder Settings**: Apply to a specific folder in a multi-root workspace

## Advanced Configuration

For more advanced use cases, you can create a `.huckleberryrc.json` file in your workspace root with the following structure:

```json
{
  "taskManager": {
    "taskIdPrefix": "TASK",
    "categories": [
      "Frontend",
      "Backend",
      "Documentation",
      "Testing",
      "DevOps"
    ],
    "customStatusFlow": [
      "Todo",
      "In Progress",
      "Review",
      "Done"
    ]
  }
}
```

This configuration file allows for more detailed customization of task management features beyond what's available in VS Code settings.