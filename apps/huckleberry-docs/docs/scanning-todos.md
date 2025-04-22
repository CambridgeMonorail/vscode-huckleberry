---
sidebar_position: 11
---

# Scanning TODOs

One of Huckleberry's most powerful features is its ability to scan your codebase for TODOs and convert them into trackable tasks automatically.

## How TODO Scanning Works

When you ask Huckleberry to scan for TODOs, it:

1. Searches through files in your workspace for specific comment patterns
2. Automatically respects .gitignore patterns to exclude ignored files
3. Extracts the TODO comments along with their context
4. Creates a task for each unique TODO
5. Includes file location information in the task
6. Adds appropriate links between the task and the code

## Basic Usage

To scan your entire workspace for TODOs:

```
@Huckleberry Scan for TODOs in the codebase
```

To scan a specific subset of files using a glob pattern:

```
@Huckleberry Scan for TODOs in **/*.ts
```

## Supported TODO Formats

By default, Huckleberry recognizes the following comment patterns:

- `// TODO: Implement feature X`
- `// FIXME: This is broken`
- `// BUG: Needs to be fixed`

These patterns can be customized through settings (see [Settings](./settings.md)).

## Examples

### JavaScript/TypeScript

```javascript
// TODO: Add validation for email addresses
function validateForm() {
  // ...
}

// FIXME: This function has a memory leak
function processData() {
  // ...
}
```

### Python

```python
# TODO: Refactor to use the new API
def get_user_data():
    # ...
    
# BUG: Fails with non-ASCII input
def process_name(name):
    # ...
```

### HTML/XML

```html
<!-- TODO: Add responsive styling for mobile -->
<div class="container">
  <!-- ... -->
</div>
```

### CSS/SCSS

```css
/* TODO: Update colors to match new brand guidelines */
.header {
  background-color: #333;
  /* ... */
}
```

## Task Creation from TODOs

When Huckleberry finds a TODO, it creates a task with:

- **Title**: The text following the TODO keyword
- **Description**: Includes the source file and line number
- **Priority**: Medium (by default, can be customized)
- **Status**: Todo

For example:

```
✅ Created task TASK-005: Add validation for email addresses

Priority: Medium
Status: Todo
Location: src/forms/validation.js:12
Created: 2025-04-19
```

## Customizing TODO Detection

You can customize which patterns Huckleberry recognizes as TODOs via settings:

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

## Advanced Options

### .gitignore Integration

Huckleberry automatically respects patterns defined in your project's `.gitignore` file when scanning for TODOs. This means:

- Files and directories excluded by .gitignore rules are skipped during scanning
- Build artifacts, dependency folders, and other ignored files won't generate TODO tasks
- Scanning is more efficient and produces cleaner results focused on your actual source code

This integration works automatically when a `.gitignore` file is present in your workspace root directory, with no additional configuration required.

### Automatic Scanning

You can configure Huckleberry to automatically scan for TODOs when initializing task tracking:

```json
{
  "huckleberry.taskmanager.autoScanTodos": true
}
```

### TODO Tagging

You can add priority information to your TODOs that Huckleberry will recognize:

```javascript
// TODO(high): Implement security checks
// TODO(low): Add more detailed error messages
```

Huckleberry will set the task priority accordingly.

### TODO Categories

You can categorize TODOs by adding tags:

```javascript
// TODO(security): Add input validation
// TODO(performance): Optimize database query
```

Huckleberry will include these categories in the created tasks.

## Task Updates from Code Changes

When you change or remove a TODO comment that has been converted to a task:

1. **Removing the TODO**: The next time you scan, Huckleberry will suggest marking the associated task as complete
2. **Changing the TODO**: The task description will be updated to reflect the new content

## Best Practices

### Effective TODO Comments

For the best results with Huckleberry's scanning:

- Be specific and actionable in your TODO descriptions
- Include enough context to understand what needs to be done
- Consider adding priority or category tags for better organization
- Keep TODOs updated as you work on the code

### Regular Scanning

To keep your task list in sync with your code:

- Scan for TODOs regularly during development
- Consider scanning before team meetings to discuss outstanding work
- Scan after pulling changes from version control to see what others have marked as TODOs

### Task Follow-up

After scanning for TODOs:

- Review the created tasks and adjust priorities if needed
- Consider breaking down larger TODOs into subtasks
- Assign due dates to critical TODOs

## Troubleshooting

### TODOs Not Being Detected

If Huckleberry isn't finding your TODOs:

1. Check that your TODO format matches a recognized pattern
2. Verify that you're scanning the right files (check your glob pattern)
3. Make sure there's a space between the TODO keyword and the colon (e.g., `TODO: ` not `TODO:`)
4. Confirm that your files aren't being excluded by patterns in your `.gitignore` file

### File Access Issues

If you see errors about file access:

1. Verify that VS Code has access permissions to the files you're trying to scan
2. Check if the files are excluded in your `.gitignore` or VS Code's `files.exclude` setting
3. For files explicitly excluded by `.gitignore` that you want to scan, use a targeted glob pattern

### Performance Issues

For large codebases:

1. Use specific glob patterns to limit scanning to relevant files
2. Take advantage of the automatic `.gitignore` integration to exclude build artifacts and dependencies
3. Increase the timeout setting if scans are timing out