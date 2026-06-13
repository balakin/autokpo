import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { cloudflare } from '@cloudflare/vite-plugin';
import { lingui, linguiTransformerBabelPreset } from '@lingui/vite-plugin';
import babel from '@rolldown/plugin-babel';
import tailwindcss from '@tailwindcss/vite';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import { defaultTreeAdapter as adapter, parse } from 'parse5';
import type { DefaultTreeAdapterMap } from 'parse5';
import { visualizer } from 'rollup-plugin-visualizer';
import type { Plugin, PluginOption } from 'vite';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

import { version } from './package.json';

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  define: {
    __APP_VERSION__: JSON.stringify(
      mode === 'development' ? `${version}-dev` : version,
    ),
  },
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
          (env) => env.name === 'autokpo_app',
        ),
      ]
    : []),
  ...scopeToEnv([generateHeaders()], (env) => env.name === 'client'),
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
        categories: ['business', 'finance', 'productivity'],
        icons: [
          {
            src: '/web-app-manifest-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: '/web-app-manifest-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
        theme_color: '#080d16',
        background_color: '#000000',
        lang: undefined,
      },
      workbox: {
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/^\/api\//, /^\/__debug/],
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

function generateHeaders(): Plugin {
  let host: string | undefined;
  let token: string | undefined;

  return {
    name: 'generate-csp-headers',
    configResolved(config) {
      host = config.env['VITE_POSTHOG_HOST'];
      token = config.env['VITE_POSTHOG_PROJECT_TOKEN'];
    },
    writeBundle(outputOptions) {
      const dir = outputOptions.dir;
      if (!dir) return;

      const reportUri =
        token && host ? `${host}/report/?token=${token}&v=${version}` : null;

      const html = readFileSync(join(dir, 'index.html'), 'utf8');
      const scriptHashes = extractInlineTagHashes(html, 'script');
      const styleHashes = extractInlineTagHashes(html, 'style');

      const cspDirectives = [
        "default-src 'none'",
        `script-src 'self'${scriptHashes.length ? ' ' + scriptHashes.join(' ') : ''}`,
        `style-src 'self'${styleHashes.length ? ' ' + styleHashes.join(' ') : ''}`,
        "font-src 'self'",
        "img-src 'self' data:",
        `connect-src 'self'${host ? ` ${host}` : ''}`,
        "worker-src 'self'",
        "manifest-src 'self'",
        "base-uri 'self'",
        ...(reportUri ? [`report-uri ${reportUri}`, 'report-to posthog'] : []),
      ];

      const headers = [
        '/*',
        `  Content-Security-Policy: ${cspDirectives.join('; ')}`,
        '  X-Content-Type-Options: nosniff',
        '  X-Frame-Options: DENY',
        '  Referrer-Policy: strict-origin-when-cross-origin',
        ...(reportUri ? [`  Reporting-Endpoints: posthog="${reportUri}"`] : []),
        '',
      ].join('\n');

      writeFileSync(join(dir, '_headers'), headers);
    },
  };
}

type Node = DefaultTreeAdapterMap['node'];

function walkNodes(node: Node, visit: (n: Node) => void): void {
  visit(node);
  if ('childNodes' in node) {
    for (const child of node.childNodes) walkNodes(child, visit);
  }
}

function extractInlineTagHashes(
  html: string,
  tagName: 'script' | 'style',
): string[] {
  const hashes = new Set<string>();
  const document = parse(html);

  walkNodes(document, (node) => {
    if (!adapter.isElementNode(node)) return;
    if (adapter.getTagName(node) !== tagName) return;
    if (
      tagName === 'script' &&
      adapter.getAttrList(node).some((a) => a.name === 'src')
    )
      return;

    const textNode = adapter
      .getChildNodes(node)
      .find((c) => adapter.isTextNode(c));
    if (!textNode) return;

    const content = adapter.getTextNodeContent(textNode);
    if (!content.trim()) return;

    const hash = createHash('sha256').update(content).digest('base64');
    hashes.add(`'sha256-${hash}'`);
  });

  return [...hashes];
}
