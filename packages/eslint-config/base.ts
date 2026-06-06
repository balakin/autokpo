import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import eslintConfigPrettier from 'eslint-config-prettier/flat';
import { importX } from 'eslint-plugin-import-x';
import tseslint from 'typescript-eslint';

export { eslintConfigPrettier, importX, js, tseslint };

export default defineConfig([
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
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/consistent-type-exports': 'error',
    },
  },

  {
    files: ['**/*.d.{ts,tsx}'],
    rules: {
      '@typescript-eslint/consistent-type-imports': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
    },
  },
]);
