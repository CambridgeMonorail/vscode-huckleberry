---
sidebar_position: 10
---

# Customization

Huckleberry Task Manager offers multiple ways to customize its behavior and appearance to match your workflow preferences.

## Configuration Options

In addition to the [settings](./settings.md) that control Huckleberry's core functionality, there are several customization options available.

## Custom Task Templates

You can create custom templates for new tasks by defining a task template file in your workspace. Create a file at `.huckleberry/templates/task.md` with your preferred structure:

```markdown
# ${id}: ${title}

**Priority**: ${priority}  
**Status**: ${status}  
**Created**: ${createdAt}  
**Updated**: ${updatedAt}  

## Description

${description}

## Acceptance Criteria

- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

## Notes

${notes}

## Related Tasks

${relatedTasks}
```

When Huckleberry creates new tasks, it will use your custom template and fill in the variables with appropriate values.

## Custom Status Workflows

By default, Huckleberry supports the following task statuses:

- Todo
- In Progress
- Done

You can define a custom workflow with additional statuses by creating a `.huckleberryrc.json` file in your workspace root:

```json
{
  "taskManager": {
    "customStatusFlow": [
      "Backlog",
      "Ready",
      "In Progress",
      "Review",
      "Testing",
      "Done"
    ]
  }
}
```

After setting a custom status flow, you can use these statuses in your commands:

```
@Huckleberry Mark task TASK-001 as Review
```

## Task Categories

To organize tasks into categories, add a `categories` array to your `.huckleberryrc.json` file:

```json
{
  "taskManager": {
    "categories": [
      "Frontend",
      "Backend",
      "Documentation",
      "Testing",
      "DevOps"
    ]
  }
}
```

You can then assign tasks to categories:

```
@Huckleberry Create a Frontend task to implement the login form
```

## Custom Task ID Format

By default, Huckleberry uses the format `TASK-XXX` for task IDs. You can customize this format by setting the `taskIdPrefix` in your `.huckleberryrc.json` file:

```json
{
  "taskManager": {
    "taskIdPrefix": "HB"
  }
}
```

This would create tasks with IDs like `HB-001`, `HB-002`, etc.

## Themeing and Visual Customization

Huckleberry respects VS Code's theming system, so its UI elements will match your chosen theme. No additional configuration is needed.

## Chat Response Formatting

You can customize how Huckleberry formats its responses in chat by adding a `chatFormatting` section to your `.huckleberryrc.json`:

```json
{
  "chatFormatting": {
    "successEmoji": "✅",
    "errorEmoji": "❌",
    "infoEmoji": "ℹ️",
    "warningEmoji": "⚠️",
    "useCodeBlocks": true
  }
}
```

## Command Aliases

To create custom shortcuts for frequently used commands, add an `aliases` section to your `.huckleberryrc.json`:

```json
{
  "aliases": {
    "todo": "Scan for TODOs in the codebase",
    "done": "Mark task ${1} as complete",
    "high": "Mark task ${1} as high priority"
  }
}
```

This allows you to use shorthand commands:

```
@Huckleberry todo
@Huckleberry done TASK-001
@Huckleberry high TASK-002
```

## Keyboard Shortcuts

While Huckleberry doesn't define default keyboard shortcuts, you can set your own through VS Code's keyboard shortcuts settings:

1. Open VS Code's keyboard shortcuts editor: `File > Preferences > Keyboard Shortcuts`
2. Search for "Huckleberry"
3. Find the command you want to assign a shortcut to
4. Click the plus icon and enter your preferred key combination

## Extending Huckleberry

Advanced users can extend Huckleberry's functionality by:

1. **Custom Scripts**: Create scripts that interact with Huckleberry's task files
2. **Integration with VS Code Tasks**: Create VS Code tasks that reference Huckleberry tasks
3. **Git Hooks**: Add Git hooks that update task status based on commits or branches

### Example: Pre-commit Hook

Create a `.git/hooks/pre-commit` script that scans for TODOs before committing:

```bash
#!/bin/bash

# Scan for new TODOs and create tasks for them
code --extensionDevelopmentPath="path/to/huckleberry" --execute-command "huckleberry.scanTodos"

# Prevent commit if there are high priority tasks
HIGH_PRIORITY_TASKS=$(grep -l '"priority": "high"' tasks/*.json | wc -l)
if [ $HIGH_PRIORITY_TASKS -gt 0 ]; then
  echo "Warning: You have $HIGH_PRIORITY_TASKS high priority tasks remaining."
  echo "Run 'code --execute-command \"huckleberry.listTasks\"' to see them."
fi
```

## Best Practices for Customization

1. **Start with defaults**: Use Huckleberry with its default settings initially to understand its workflow
2. **Workspace-specific settings**: Apply customizations at the workspace level to maintain consistency within projects
3. **Document customizations**: If working in a team, document any custom settings in your project README
4. **Version control configuration**: Include your `.huckleberryrc.json` and templates in version control
5. **Consistent categories**: Establish clear naming conventions for task categories