---
sidebar_position: 7
---

# Task Storage

Huckleberry uses a file-based task storage system that keeps all your task data local to your workspace. This approach has several advantages:

- Tasks are stored alongside your code
- Task data can be version controlled
- Team members can share and collaborate on tasks
- No dependency on external services

## Storage Structure

When you initialize task tracking, Huckleberry creates the following structure in your workspace:

```
your-workspace/
├── tasks.json       # Master task index file
└── tasks/           # Directory for individual task files
    ├── TASK-001.md  # Detailed task file
    ├── TASK-002.md  # Detailed task file
    └── ...
```

## Master Task Index

The `tasks.json` file serves as the main registry for all tasks in your project. It contains a JSON object with basic metadata for each task:

```json
{
  "tasks": [
    {
      "id": "TASK-001",
      "title": "Implement user authentication",
      "priority": "high",
      "status": "todo",
      "createdAt": "2025-04-18T10:15:32.000Z",
      "updatedAt": "2025-04-18T10:15:32.000Z"
    },
    {
      "id": "TASK-002",
      "title": "Fix security vulnerability in authentication flow",
      "priority": "high",
      "status": "in-progress",
      "createdAt": "2025-04-15T09:30:22.000Z",
      "updatedAt": "2025-04-17T14:25:12.000Z"
    }
  ],
  "settings": {
    "nextTaskId": 3
  }
}
```

## Individual Task Files

For each task, Huckleberry creates a separate Markdown file in the `tasks/` directory. These files contain more detailed information about the task:

```markdown
# TASK-001: Implement user authentication

**Priority**: High  
**Status**: Todo  
**Created**: 2025-04-18  
**Updated**: 2025-04-18  

## Description

Create a user authentication system with login, registration, and password reset functionality.

## Details

Should include:
- Email/password authentication
- OAuth integration
- Password reset flow
- Security best practices

## Notes

- Added on 2025-04-18 from chat interaction
- Related to security requirements document
```

This provides a rich text format for storing detailed task information, supporting markdown formatting, bullet points, and other structure.

## Version Control

Since tasks are stored as plain text files, they integrate naturally with version control systems:

- Task changes appear in your git diffs
- Task history can be traced through commits
- Team members can see task updates in pull requests
- Conflicts can be resolved using standard git workflow

## File Formats

Huckleberry uses standard, widely-supported file formats:

- **JSON** for the task index, which is easy to parse and manipulate programmatically
- **Markdown** for individual task files, which is human-readable and well-supported by editors

## Customizing Storage

You can customize where and how Huckleberry stores tasks through VS Code settings:

| Setting | Description | Default |
|---------|-------------|---------|
| `huckleberry.taskmanager.defaultTasksLocation` | Path where tasks are stored | `"tasks"` |
| `huckleberry.taskmanager.taskFileTemplate` | Format for task files | `"markdown"` |

## Data Security & Privacy

Since all task data is stored locally in your workspace, you maintain complete control over your task information:

- No data is sent to external servers
- Privacy is maintained for sensitive project tasks
- Security is provided by your existing workspace security measures

## Backup & Migration

Task data can be backed up and migrated along with your code:

- Tasks are included in regular source code backups
- Task data can be moved between workspaces
- Importing/exporting is as simple as copying files

## Performance Considerations

The file-based storage approach is designed to be lightweight and performant:

- Task files are only loaded when needed
- The system scales well for projects with many tasks
- Changes are persisted asynchronously to avoid blocking operations