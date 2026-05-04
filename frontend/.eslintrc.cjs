// Frontend ESLint configuration for MegaLinter v8 (ESLint v8 legacy config)
// Local dev can use ESLint v9 flat config later
// AGENT-DECISION: arch — T-098

'use strict';

module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'sonarjs', 'react-hooks'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  env: {
    browser: true,
    es2022: true,
  },
  ignorePatterns: ['dist/**', '*.js', '*.cjs', '*.mjs'],
  rules: {
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    // AGENT-DECISION: arch — T-098
    // Cognitive complexity analysis: warn at 15 (default threshold).
    // Detects control flow complexity that can make functions hard to understand and maintain.
    'sonarjs/cognitive-complexity': ['warn', 15],
    // React Hooks rules — enforce proper usage of hooks to prevent runtime errors
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
};
