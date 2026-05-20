import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import js from '@eslint/js';
import reactX from '@eslint-react/eslint-plugin';
import { defineConfig, globalIgnores } from 'eslint/config';
import eslintConfigPrettier from 'eslint-config-prettier/flat';
import betterTailwindcss from 'eslint-plugin-better-tailwindcss';
import { importX } from 'eslint-plugin-import-x';
import pluginLingui from 'eslint-plugin-lingui';
import reactRefresh from 'eslint-plugin-react-refresh';
import testingLibrary from 'eslint-plugin-testing-library';
import tseslint from 'typescript-eslint';

const root = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig([
  globalIgnores(['**/dist', '**/public', 'apps/app/worker-configuration.d.ts']),

  // Base: applies to every TS/TSX file in the repo.
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommendedTypeChecked,
      importX.flatConfigs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        projectService: true,
      },
    },
    rules: {
      'import-x/order': [
        'error',
        {
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
          pathGroups: [{ pattern: 'cloudflare:*', group: 'external' }],
        },
      ],
      'import-x/first': 'error',
      'import-x/no-duplicates': 'error',
      'import-x/no-absolute-path': 'error',
      'import-x/newline-after-import': 'error',
      'import-x/no-empty-named-blocks': 'error',
      'import-x/no-deprecated': 'warn',
      'import-x/no-unresolved': 'off',
      'import-x/named': 'off',
      'import-x/default': 'off',
      'import-x/namespace': 'off',
      'import-x/export': 'off',
      'import-x/no-named-as-default': 'off',
      'import-x/no-named-as-default-member': 'off',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/consistent-type-exports': 'error',
    },
  },

  // App source — React, hooks, react-refresh, lingui.
  {
    files: ['apps/app/src/**/*.{ts,tsx}'],
    ignores: ['apps/app/src/**/*.spec.{ts,tsx}'],
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

  // App tests — React + testing-library. No react-refresh (not a Vite module
  // boundary concern), no lingui (test code doesn't ship strings).
  {
    files: [
      'apps/app/tests/app/**/*.{ts,tsx}',
      'apps/app/src/**/*.spec.{ts,tsx}',
    ],
    extends: [
      reactX.configs['recommended-type-checked'],
      testingLibrary.configs['flat/react'],
    ],
    rules: {
      '@typescript-eslint/no-unsafe-call': 'off',
    },
  },

  // Worker tests — vitest-pool-workers. No React, but loosen unsafe-call like app tests.
  {
    files: [
      'apps/app/worker/**/*.spec.ts',
      'apps/app/tests/worker/**/*.{ts,tsx}',
    ],
    rules: {
      '@typescript-eslint/no-unsafe-call': 'off',
    },
  },

  // Restrict direct Yjs imports outside the crdt module.
  {
    files: ['**/*.{ts,tsx}'],
    ignores: ['apps/app/src/crdt/**'],
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

  // Type declaration files.
  {
    files: ['**/*.d.{ts,tsx}'],
    rules: {
      '@typescript-eslint/consistent-type-imports': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
    },
  },

  // Tailwind class correctness and canonicalization for app source.
  // enforce-consistent-line-wrapping is intentionally excluded — it conflicts with Prettier.
  {
    files: ['apps/app/**/*.{ts,tsx}'],
    plugins: {
      'better-tailwindcss': betterTailwindcss,
    },
    settings: {
      'better-tailwindcss': {
        cwd: resolve(root, 'apps/app'),
        entryPoint: resolve(root, 'apps/app/src/index.css'),
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

  // Keep `eslint-config-prettier` last: it disables rules that conflict with Prettier.
  // This should remain the final config so prettier-related rule changes take effect.
  eslintConfigPrettier,
]);
