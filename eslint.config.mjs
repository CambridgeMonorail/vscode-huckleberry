import nx from '@nx/eslint-plugin';
import typescriptESLint from '@typescript-eslint/eslint-plugin';

export default [
  ...nx.configs['flat/base'],
  ...nx.configs['flat/typescript'],
  ...nx.configs['flat/javascript'],
  {
    ignores: [
      '**/dist',
      '**/tmp',
      '**/out-tsc',
      '**/apps/huckleberry-docs/build',
      '**/apps/huckleberry-docs/.docusaurus',
      '**/node_modules',
      '**/.nx/cache',
      '**/.nx/workspace-data',
      '**/vite.config.*.timestamp*',
      '**/vitest.config.*.timestamp*',
      '**/coverage',
      '**/*.vsix',
    ],
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: ['^.*/eslint(\\.base)?\\.config\\.[cm]?js$'],
          depConstraints: [
            {
              sourceTag: '*',
              onlyDependOnLibsWithTags: ['*'],
            },
          ],
        },
      ],
    },
  },
  {
    files: [
      '**/*.ts',
      '**/*.tsx',
      '**/*.cts',
      '**/*.mts',
      '**/*.js',
      '**/*.jsx',
      '**/*.cjs',
      '**/*.mjs',
    ],
    // Enhanced rules for the Huckleberry project
    plugins: {
      '@typescript-eslint': typescriptESLint,
    },
    rules: {
      // Error prevention
      'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
      'no-debugger': 'warn',
      'no-duplicate-imports': 'error',
      'no-unused-vars': 'off', // TypeScript has better unused checks

      // Code style
      'indent': ['error', 2, { 'SwitchCase': 1 }],
      'quotes': ['error', 'single', { 'allowTemplateLiterals': true }],
      'semi': ['error', 'always'],
      'comma-dangle': ['error', 'always-multiline'],
      'arrow-parens': ['error', 'as-needed'],

      // TypeScript specific rules
      '@typescript-eslint/no-unused-vars': ['error', {
        'argsIgnorePattern': '^_',
        'varsIgnorePattern': '^_',
      }],
      '@typescript-eslint/explicit-function-return-type': ['warn', {
        'allowExpressions': true,
        'allowTypedFunctionExpressions': true,
      }],
      '@typescript-eslint/no-explicit-any': 'warn',

      // The problematic rule - checking if it's available
      ...(typescriptESLint.rules['member-delimiter-style'] ? {
        '@typescript-eslint/member-delimiter-style': ['error', {
          'multiline': { 'delimiter': 'semi', 'requireLast': true },
          'singleline': { 'delimiter': 'semi', 'requireLast': false },
        }],
      } : {}),
    },
  },
  {
    // VS Code extension specific rules
    files: ['apps/huckleberry-extension/**/*.ts'],
    rules: {
      'no-console': 'off', // Console is commonly used in VS Code extensions for logging
    },
  },
];
