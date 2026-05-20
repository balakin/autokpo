import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  cloudflareTest,
  readD1Migrations,
} from '@cloudflare/vitest-pool-workers';
import { lingui, linguiTransformerBabelPreset } from '@lingui/vite-plugin';
import babel from '@rolldown/plugin-babel';
import { defineConfig } from 'vitest/config';

export default defineConfig(async () => {
  // Read all migrations in the `migrations` directory
  const migrationsPath = path.join(__dirname, 'worker/db/migrations');
  const migrations = await readD1Migrations(migrationsPath);

  return {
    plugins: [
      babel({ presets: [linguiTransformerBabelPreset()] }),
      lingui({ failOnMissing: false, failOnCompileError: true }),
      cloudflareTest({
        wrangler: { configPath: './wrangler.jsonc' },
        miniflare: {
          bindings: { TEST_MIGRATIONS: migrations },
        },
      }),
    ],
    test: {
      name: 'worker',
      globals: true,
      include: ['worker/**/*.spec.ts', 'tests/worker/**/*.spec.tsx'],
      // Runs after the app project (see vitest.app.config.ts).
      sequence: { groupOrder: 1 },
      alias: {
        worker: fileURLToPath(new URL('./worker', import.meta.url)),
        tests: fileURLToPath(new URL('./tests/worker', import.meta.url)),
      },
      setupFiles: ['./tests/worker/apply-migrations.ts'],
    },
  };
});
