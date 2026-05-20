import { fileURLToPath } from 'node:url';

import { mergeConfig, defineConfig } from 'vitest/config';

import viteConfig from './vite.config';

export default defineConfig((env) =>
  mergeConfig(
    viteConfig(env),
    defineConfig({
      test: {
        name: 'app',
        globals: true,
        environment: 'jsdom',
        setupFiles: './tests/app/vitest.setup.ts',
        include: ['src/**/*.spec.{ts,tsx}', 'tests/app/**/*.spec.{ts,tsx}'],
        // Threads use less RAM than forks (shared address space) and cap
        // parallelism so 12 cores don't each spin up an independent transform
        // pipeline (each ~500MB). 4 is a balance between speed and RAM on a
        // 7.6GB WSL machine. Bump if you have headroom.
        pool: 'threads',
        maxWorkers: 4,
        // Run before the worker project so jsdom + miniflare don't peak in
        // RAM together (different groupOrder values → projects run serially).
        sequence: { groupOrder: 0 },
        alias: {
          src: fileURLToPath(new URL('./src', import.meta.url)),
          tests: fileURLToPath(new URL('./tests/app', import.meta.url)),
          'virtual:pwa-register/react': fileURLToPath(
            new URL('./tests/app/mocks/pwa-register-react.ts', import.meta.url),
          ),
        },
      },
    }),
  ),
);
