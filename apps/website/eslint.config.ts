import baseConfig, {
  eslintConfigPrettier,
  tseslint,
} from '@autokpo/eslint-config/base';
import { defineConfig, globalIgnores } from 'eslint/config';
import astro from 'eslint-plugin-astro';

export default defineConfig([
  ...baseConfig,

  globalIgnores(['**/dist', '**/public', '**/.astro']),

  ...astro.configs['flat/recommended'],

  {
    files: ['**/*.astro'],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
      },
    },
  },

  eslintConfigPrettier,
]);
