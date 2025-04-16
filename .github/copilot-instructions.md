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
