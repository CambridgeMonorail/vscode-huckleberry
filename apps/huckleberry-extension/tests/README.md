# Huckleberry Extension Tests

This directory contains tests for the Huckleberry VS Code extension. The testing strategy follows a phased approach, starting with pure utility functions and expanding to more complex components.

## Directory Structure

```
tests/
├── __mocks__/           # Mock modules (e.g., VS Code API)
├── stubs/              # Mock implementations of services
├── unit/               # Unit tests organized by module type
│   ├── utils/          # Tests for utility functions
│   ├── handlers/       # Tests for command handlers
│   │   └── tasks/      # Tests for task handlers
│   ├── services/       # Tests for services
│   └── lib/            # Tests for pure logic (future)
└── integration-edh/    # Integration tests with Extension Development Host (future)
```

## Running Tests

You can run tests using VS Code tasks or directly with the following commands:

```sh
# Run all tests
pnpm run test

# Run tests in watch mode during development
pnpm run test:watch

# Run tests with coverage report
pnpm run test:coverage
```

## Test Configuration

The tests use Vitest as the test runner and are configured in `vitest.config.ts`. Key features include:

- Tests run in Node.js environment
- VS Code API is mocked via an alias
- Coverage reports are generated in text, HTML, and LCOV formats

## Test Development Guidelines

1. **Focus on pure functions first**: Start by testing utility functions with minimal dependencies
2. **Mock VS Code API**: Use the provided VS Code API mock for tests
3. **Use descriptive test names**: Tests should clearly indicate what is being tested
4. **Test edge cases**: Include tests for error conditions and edge cases
5. **Keep tests independent**: Tests should not depend on the state from other tests

## VS Code Extensions Testing Resources

- [VS Code Extension Testing](https://code.visualstudio.com/api/working-with-extensions/testing-extension)
- [Vitest Documentation](https://vitest.dev/guide/)
