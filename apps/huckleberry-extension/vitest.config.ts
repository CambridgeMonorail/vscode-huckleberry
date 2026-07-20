import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: __dirname,
  resolve: {
    alias: {
      '@huckleberry/extension': resolve(__dirname, 'src'),
      'vscode': resolve(__dirname, './tests/__mocks__/vscode.ts'),
    },
  },
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.ts'],
    globals: true,
    coverage: { 
      provider: 'v8', // Using v8 provider as it's the current recommended provider in Vitest 3.x
      reporter: ['text', 'html', 'lcov'],
      exclude: ['**/node_modules/**', '**/tests/**'],
      thresholds: {
        'src/runner/runnerHost.ts': {
          statements: 75,
          branches: 70,
          functions: 80,
          lines: 75,
        },
        'src/runner/runEventStore.ts': {
          statements: 90,
          branches: 70,
          functions: 90,
          lines: 90,
        },
        'src/runner/stateMachine.ts': {
          statements: 85,
          branches: 75,
          functions: 95,
          lines: 85,
        },
        'src/runner/worktreeLifecycleService.ts': {
          statements: 75,
          branches: 55,
          functions: 75,
          lines: 75,
        },
      },
    },
    deps: { fallbackCJS: true },
    alias: {
      vscode: resolve(__dirname, './tests/__mocks__/vscode.ts'),
    },
  },
});
