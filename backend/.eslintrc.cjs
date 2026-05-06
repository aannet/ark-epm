// MegaLinter compatibility — ESLint v8 (bundled in oxsecurity/megalinter:v8)
// Local dev uses eslint.config.mjs (ESLint v9 flat config, ignored by ESLint v9 automatically)
//
// NOTE: sonarjs plugin is pinned to v1.0.4 in MegaLinter via PRE_COMMANDS in .mega-linter.yml
// This is the last version supporting ESLint v8 legacy config format.
// (sonarjs v4+ requires ESLint v9 flat config only)
'use strict';

module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'sonarjs'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  ignorePatterns: ['dist/**', '*.js', '*.mjs', '*.cjs'],
  rules: {
    '@typescript-eslint/no-explicit-any': 'off',
    // no-floating-promises and no-unsafe-argument require parserOptions.project (type-aware)
    // not enabled here to keep MegaLinter config simple and fast
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    // AGENT-DECISION: arch — T-098
    // Cognitive complexity analysis: warn at 15 (default threshold).
    // This rule detects control flow complexity that can make functions hard to understand and maintain.
    'sonarjs/cognitive-complexity': ['warn', 15],
  },
};
