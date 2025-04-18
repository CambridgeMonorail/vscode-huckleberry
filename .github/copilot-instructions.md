# Huckleberry Project - Development Guidelines

## Project Overview

This is a nrwl nx monorepo for the Huckleberry Task Manager VS Code extension and its supporting applications.

The repository is structured as follows:

- `/apps/huckleberry-extension`: VS Code extension (TypeScript)
- `/demo-site`: React SPA for demonstration purposes (React, TypeScript, Vite)
- `/docs`: Project documentation
- `/assets`: Shared assets like images and icons

When making changes always check the editor for typescript errors before assuming the code is complete or trying to run it.

## Coding Standards

### TypeScript

- Use TypeScript strict mode for all code
- Follow the principle of explicit typing whenever possible
- Use interfaces for object shapes and types for unions and primitives
- Prefer functional programming patterns where appropriate
- Use async/await over Promise chains
- Document all public functions, classes, interfaces with JSDoc comments

```typescript
/**
 * Processes task data and returns a formatted result
 * @param taskData The raw task data to process
 * @returns The processed task format
 */
function processTask<T extends Task>(taskData: T): ProcessedTask {
  // Implementation
}
```

### React (demo-site)

- Use functional components with hooks
- Implement proper state management (React Context or Redux)
- Follow component-based architecture
- Use Tailwind CSS for styling
- Implement responsive design principles

### VS Code Extension

- Follow VS Code Extension API best practices
- Use proper activation events to minimize startup impact
- Implement proper error handling for all commands and operations
- Use message localization for user-facing strings
- Keep extension lightweight by minimizing dependencies

## Project Structure

### Nx Workspace

This project uses Nx for monorepo management:

- Use proper project references and dependencies
- Leverage Nx caching for faster builds
- Follow the Nx project structure and conventions
- Use Nx generators for creating new components/files

### Git Workflow

- Use feature branches for development
- Write descriptive commit messages using conventional commits
- Squash commits before merging pull requests
- Keep pull requests focused on a single feature or fix

## Commit Message Guidelines

All commit messages MUST follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Commit Types

- `feat`: A new feature (minor version bump)
- `fix`: A bug fix (patch version bump)
- `docs`: Documentation only changes
- `style`: Changes that do not affect the meaning of the code (white-space, formatting, etc)
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `perf`: A code change that improves performance
- `test`: Adding missing tests or correcting existing tests
- `build`: Changes that affect the build system or external dependencies
- `ci`: Changes to CI configuration files and scripts
- `chore`: Other changes that don't modify src or test files

### Breaking Changes

Breaking changes MUST be indicated in the commit message with a `!` after the type/scope, or by including `BREAKING CHANGE:` in the footer.

Example:
```
feat(api)!: change authentication API

BREAKING CHANGE: The authentication API has been completely redesigned.
```

### Commit Description

- Use the imperative, present tense: "change" not "changed" nor "changes"
- Don't capitalize the first letter
- No dot (.) at the end
- Limit the first line to 72 characters or less
- Describe what was done, not why it was done

### Examples

```
feat(extension): add task filtering capability
fix(ui): correct task status display
docs(readme): update installation instructions
test(api): add unit tests for task service
refactor(tools): simplify read file tool implementation
```

## Libraries and Frameworks

### Core Technologies

- **TypeScript**: For type-safe JavaScript development
- **ESLint**: For code quality and consistency
- **Nx**: For monorepo management

### Extension-specific

- **VS Code API**: For extension functionality
- **@vscode/chat-extension-utils**: For chat participant implementation

### Demo Site

- **React**: For UI development
- **Vite**: For fast development and builds
- **Tailwind CSS**: For utility-first styling

## Development Workflow

1. **Setup**: Run `pnpm install` to install all dependencies
2. **Development**:
   - Extension: Use `pnpm exec nx build huckleberry-extension --watch` for continuous builds
   - Demo site: Use `pnpm exec nx serve demo-site` to start the development server
3. **Testing**: Run `pnpm exec nx test [project]` to execute tests
4. **Building**: Run `pnpm exec nx build [project]` to build a specific project
5. **Packaging**: Run `pnpm exec nx package huckleberry-extension` to create a VSIX file

## Documentation Guidelines

- Keep code well-documented with JSDoc comments
- Update README.md when adding new features
- Document any non-obvious code patterns
- Maintain up-to-date API documentation
