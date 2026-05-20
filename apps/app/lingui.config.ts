import { defineConfig } from '@lingui/cli';

export default defineConfig({
  locales: ['sr-Latn', 'en', 'ru'],
  sourceLocale: 'sr-Latn',
  catalogs: [
    {
      path: '<rootDir>/src/locales/{locale}',
      include: ['src'],
      exclude: [
        'src/locales/**',
        'src/**/__tests__/**',
        'src/**/*.spec.ts',
        'src/**/*.spec.tsx',
        'src/vite-env.d.ts',
      ],
    },
    {
      path: '<rootDir>/worker/locales/{locale}',
      include: ['worker'],
      exclude: [
        'worker/locales/**',
        'worker/**/__tests__/**',
        'worker/**/*.spec.ts',
        'worker/**/*.spec.tsx',
        'worker/db/**',
        'worker/env.d.ts',
      ],
    },
  ],
});
