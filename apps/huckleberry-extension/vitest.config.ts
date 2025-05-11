import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.ts'],
    globals: true,
    coverage: { 
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      exclude: ['**/node_modules/**', '**/tests/**'],
    },
    deps: { fallbackCJS: true },
    alias: {
      vscode: resolve(__dirname, './tests/__mocks__/vscode.ts'),
    },
  },
});
