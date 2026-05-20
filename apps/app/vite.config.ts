import { cloudflare } from '@cloudflare/vite-plugin';
import { lingui, linguiTransformerBabelPreset } from '@lingui/vite-plugin';
import babel from '@rolldown/plugin-babel';
import tailwindcss from '@tailwindcss/vite';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import type { Plugin, PluginOption } from 'vite';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins:
    mode === 'test'
      ? transformPlugins(mode)
      : [...transformPlugins(mode), ...buildOnlyPlugins()],
}));

// Plugins that affect runtime behavior — must run for both build and tests so
// the code under test matches production. Lingui macros expand `t`...`` /
// `<Trans>` into i18n calls; React Compiler auto-memoizes. Babel runs presets
// in reverse order, so linguiTransformerBabelPreset (last) runs first and
// expands macros before reactCompilerPreset sees the code.
const transformPlugins = (mode: string): PluginOption[] => [
  react(),
  babel({
    presets: [reactCompilerPreset(), linguiTransformerBabelPreset()],
  }),
  lingui({ failOnMissing: mode === 'production', failOnCompileError: true }),
];

// Plugins only needed for `vite dev` / `vite build`. Skipped in test mode to
// keep each Vitest worker's transform pipeline lean.
const buildOnlyPlugins = (): PluginOption[] => [
  cloudflare(),
  tailwindcss(),
  ...(process.env.ANALYZE_BUNDLE
    ? [
        ...scopeToEnv(
          [
            visualizer({
              gzipSize: true,
              filename: 'stats-client.html',
            }) as Plugin,
          ],
          (env) => env.name === 'client',
        ),
        ...scopeToEnv(
          [
            visualizer({
              gzipSize: true,
              filename: 'stats-worker.html',
            }) as Plugin,
          ],
          (env) => env.name === 'autokpo',
        ),
      ]
    : []),
  // VitePWA must stay top-level so its config/configResolved hooks run.
  // applyToEnvironment restricts it to the client environment — without this,
  // the Cloudflare plugin's worker environment would also receive it and emit
  // sw.js/manifest/registerSW into the worker output.
  ...scopeToEnv(
    VitePWA({
      injectRegister: false,
      registerType: 'prompt',
      manifest: {
        name: 'AutoKPO',
        short_name: 'AutoKPO',
        description: 'AutoKPO helps manage KPO books',
        id: '/',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: undefined,
        theme_color: undefined,
        lang: undefined,
        categories: ['business', 'finance', 'productivity'],
        icons: [
          {
            src: '/android-chrome-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/android-chrome-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
        ],
      },
      workbox: {
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/^\/api\//, /^\/avatars\//, /^\/__debug/],
        runtimeCaching: [
          {
            urlPattern: /^\/avatars\/.+$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'avatars',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: {
                statuses: [200],
              },
            },
          },
        ],
        globPatterns: [
          '**/*.{js,css,html,ico,png,svg,woff2,ttf,txt,webmanifest}',
        ],
      },
    }),
    (env) => env.name === 'client',
  ),
];

type ApplyToEnvironment = NonNullable<Plugin['applyToEnvironment']>;

// Restrict plugins to a specific Vite environment by attaching an
// applyToEnvironment predicate to each plugin in the array.
function scopeToEnv(
  plugins: Plugin[],
  predicate: ApplyToEnvironment,
): Plugin[] {
  return plugins.map((p) => ({ ...p, applyToEnvironment: predicate }));
}
