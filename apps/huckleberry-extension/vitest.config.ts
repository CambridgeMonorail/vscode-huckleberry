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
    },
    deps: { fallbackCJS: true },
    alias: {
      vscode: resolve(__dirname, './tests/__mocks__/vscode.ts'),
    },
  },
});
