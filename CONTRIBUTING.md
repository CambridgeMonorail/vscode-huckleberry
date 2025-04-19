# Contributing to Huckleberry

Thanks for taking an interest in Huckleberry. Whether you’ve spotted a bug, want to suggest a feature, or just enjoy improving things, we’d love to have you involved.

This guide covers how to get started, what to expect when contributing, and how to keep things running smoothly.

## Contents

- [Code of Conduct](#code-of-conduct)  
- [Getting Started](#getting-started)  
  - [Setting Up Your Environment](#setting-up-your-environment)  
  - [Project Structure](#project-structure)  
- [How to Contribute](#how-to-contribute)  
  - [Finding or Raising an Issue](#finding-or-raising-an-issue)  
  - [Making Changes](#making-changes)  
  - [Opening a Pull Request](#opening-a-pull-request)  
- [Development Guidelines](#development-guidelines)  
  - [Coding Standards](#coding-standards)  
  - [Commit Messages](#commit-messages)  
  - [Testing](#testing)  
  - [Docs](#docs)  
- [Releases](#releases)  
- [Getting Help](#getting-help)  
- [Reporting Issues](#reporting-issues)

---

## Code of Conduct

By contributing to this project, you agree to follow our [Code of Conduct](CODE_OF_CONDUCT.md). In short: be kind, stay constructive, and assume good intent.

---

## Getting Started

### Setting Up Your Environment

1. **Fork the repo** using the "Fork" button on GitHub  
2. **Clone your fork**:

   ```bash
   git clone https://github.com/YOUR-USERNAME/vscode-huckleberry.git
   cd vscode-huckleberry
   ```

3. **Install dependencies**:

   ```bash
   pnpm install
   ```

4. **Open in VS Code**  
   - Install the recommended extensions when prompted  
   - Follow any setup notes in [docs/workspace-setup.md](docs/workspace-setup.md)

### Project Structure

This is an Nx monorepo with a few moving parts:

- `apps/huckleberry-extension`: The main extension  
- `apps/huckleberry-docs`: The documentation site  
- `assets`: Shared assets  
- `docs`: Developer notes and guides

---

## How to Contribute

### Finding or Raising an Issue

Before diving in:

1. **Check existing issues** to see if it’s already been raised:  
   [GitHub Issues](https://github.com/CambridgeMonorail/vscode-huckleberry/issues)

2. **Raise a new one** if not:  
   - Use the appropriate template (bug, feature, docs)  
   - Be specific and include useful context  
   - See the [Reporting Issues guide](REPORTING_ISSUES.md)

3. **Leave a comment** if you plan to work on it, so others know what’s in progress.

### Making Changes

1. **Create a branch** from `main`:

   ```bash
   git checkout -b feature/my-feature
   ```

2. **Make your changes**  
   - Stick to one topic per pull request  
   - Run TypeScript checks as you go

3. **Development tips**  
   To build and watch the extension:

   ```bash
   pnpm exec nx build huckleberry-extension --watch
   ```

   Or use the VS Code task: `watch-extension`

   To run tests:

   ```bash
   pnpm exec nx test huckleberry-extension
   ```

4. **Write good commit messages**  
   Follow [Conventional Commits](https://www.conventionalcommits.org/).

### Opening a Pull Request

1. **Push to your fork**:

   ```bash
   git push origin my-feature
   ```

2. **Open a pull request**  
   - Fill in the template  
   - Reference the issue if applicable  
   - Keep the description clear and relevant

3. **Respond to feedback**  
   - Maintainers may ask for changes  
   - Push updates as needed  
   - Make sure CI checks pass

4. **Done?**  
   Once approved, we’ll handle the merge. Feel free to delete your branch afterwards.

---

## Development Guidelines

### Coding Standards

**TypeScript:**

- Use strict mode  
- Prefer explicit types  
- Use interfaces for objects  
- Use `async/await` rather than `then` chains  
- Write JSDoc comments for public methods and types

```ts
/**
 * Gets a formatted list of tasks
 * @param tasks The tasks to format
 */
function formatTasks(tasks: Task[]): string[] {
  // implementation
}
```

**VS Code Extension:**

- Follow the VS Code Extension API  
- Keep startup lightweight  
- Use localisation for anything user-facing  
- Handle errors properly  
- Minimise dependencies

### Commit Messages

Use [Conventional Commits](https://www.conventionalcommits.org/):

Examples:

```
feat(extension): add task filtering
fix(ui): fix task display bug
docs(readme): update install guide
```

If a change breaks backwards compatibility, use `!` or add `BREAKING CHANGE:` in the footer.

---

### Testing

- Write tests for features and fixes  
- Use descriptive test names  
- Cover edge cases

---

### Docs

- Keep the README and developer docs updated  
- Use JSDoc for public APIs  
- Explain anything that isn’t obvious

---

## Releases

Releases are handled by maintainers. See [docs/release-process.md](docs/release-process.md) for the details.

---

## Getting Help

If you get stuck:

- Comment on the relevant GitHub issue  
- Join the GitHub Discussions  
- Reach out to the maintainers

---

## Reporting Issues

Bugs, features, and anything in between should go through our [Reporting Issues](REPORTING_ISSUES.md) guide. It’ll help us help you faster.

---

Thanks for contributing to Huckleberry. We really do appreciate it.

