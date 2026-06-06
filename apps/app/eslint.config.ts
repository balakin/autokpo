import { resolve } from 'node:path';

import baseConfig, { eslintConfigPrettier } from '@autokpo/eslint-config/base';
import reactX from '@eslint-react/eslint-plugin';
import { defineConfig, globalIgnores } from 'eslint/config';
import betterTailwindcss from 'eslint-plugin-better-tailwindcss';
import pluginLingui from 'eslint-plugin-lingui';
import reactRefresh from 'eslint-plugin-react-refresh';
import testingLibrary from 'eslint-plugin-testing-library';

export default defineConfig([
  ...baseConfig,

  globalIgnores(['**/dist', '**/public', 'worker-configuration.d.ts']),

  // App source — React, hooks, react-refresh, lingui.
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/**/*.spec.{ts,tsx}'],
    extends: [
      reactX.configs['recommended-type-checked'],
      reactRefresh.configs.vite,
      pluginLingui.configs['flat/recommended'],
    ],
    rules: {
      'lingui/consistent-plural-format': 'warn',
      'lingui/no-plural-inside-trans': 'warn',
    },
  },

  // App tests — React + testing-library.
  {
    files: ['tests/app/**/*.{ts,tsx}', 'src/**/*.spec.{ts,tsx}'],
    extends: [
      reactX.configs['recommended-type-checked'],
      testingLibrary.configs['flat/react'],
    ],
    rules: {
      '@typescript-eslint/no-unsafe-call': 'off',
    },
  },

  // Worker tests — vitest-pool-workers.
  {
    files: ['worker/**/*.spec.ts', 'tests/worker/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-unsafe-call': 'off',
    },
  },

  // Restrict direct Yjs imports outside the crdt module.
  {
    files: ['**/*.{ts,tsx}'],
    ignores: ['src/crdt/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['yjs', 'y-*'],
              message: 'Import from the crdt module instead of yjs directly.',
            },
          ],
        },
      ],
    },
  },

  // Tailwind class correctness and canonicalization.
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      'better-tailwindcss': betterTailwindcss,
    },
    settings: {
      'better-tailwindcss': {
        cwd: import.meta.dirname,
        entryPoint: resolve(import.meta.dirname, 'src/index.css'),
      },
    },
    rules: {
      'better-tailwindcss/no-unknown-classes': 'error',
      'better-tailwindcss/no-conflicting-classes': 'error',
      'better-tailwindcss/no-duplicate-classes': 'error',
      'better-tailwindcss/no-deprecated-classes': 'error',
      'better-tailwindcss/enforce-canonical-classes': 'warn',
      'better-tailwindcss/enforce-shorthand-classes': 'warn',
      'better-tailwindcss/enforce-consistent-class-order': 'warn',
      'better-tailwindcss/enforce-consistent-variant-order': 'warn',
      'better-tailwindcss/enforce-consistent-variable-syntax': 'warn',
      'better-tailwindcss/enforce-consistent-important-position': 'warn',
    },
  },

  eslintConfigPrettier,
]);
