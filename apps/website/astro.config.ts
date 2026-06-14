import { execSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import sitemap from '@astrojs/sitemap';
import type { AstroIntegration } from 'astro';
import { defineConfig } from 'astro/config';
import { parse, defaultTreeAdapter as adapter } from 'parse5';
import type { DefaultTreeAdapterMap } from 'parse5';

import { version } from './package.json';

// https://astro.build/config
export default defineConfig({
  site: 'https://autokpo.com',
  vite: {
    define: {
      'import.meta.env.PUBLIC_APP_VERSION': JSON.stringify(version),
      'import.meta.env.PUBLIC_BUILD_VERSION': JSON.stringify(
        resolveBuildVersion(),
      ),
    },
  },
  integrations: [
    generateHeaders(),
    sitemap({
      i18n: {
        defaultLocale: 'en',
        locales: {
          'sr-latn': 'sr-Latn',
          en: 'en',
          ru: 'ru',
        },
      },
    }),
  ],
  i18n: {
    locales: ['sr-Latn', 'en', 'ru'],
    defaultLocale: 'en',
  },
});

// e.g. 1.4.2+a48a9b5.20260614T120507Z — unique per build so each deploy
// produces distinct HTML. Workers Assets only ships changed files, so without a
// rotating value an unchanged build is rejected as "nothing changed".
function resolveBuildVersion(): string {
  return `${version}+${gitShortSha()}.${buildTimestamp()}`;
}

function gitShortSha(): string {
  const envSha =
    process.env.CF_PAGES_COMMIT_SHA ??
    process.env.GITHUB_SHA ??
    process.env.GIT_COMMIT_SHA;
  if (envSha) return envSha.slice(0, 7);
  try {
    return execSync('git rev-parse --short HEAD', {
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .toString()
      .trim();
  } catch {
    return 'unknown';
  }
}

// Compact ISO-8601 UTC: 2026-06-14T12:05:07.123Z → 20260614T120507Z
function buildTimestamp(): string {
  return new Date()
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}Z$/, 'Z');
}

function collectHtmlFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      results.push(...collectHtmlFiles(full));
    } else if (entry.endsWith('.html')) {
      results.push(full);
    }
  }
  return results;
}

function generateHeaders(): AstroIntegration {
  return {
    name: 'generate-headers',
    hooks: {
      'astro:build:done': ({ dir }) => {
        const host = process.env.PUBLIC_POSTHOG_HOST;

        const distDir = fileURLToPath(dir);
        const scriptHashes = extractInlineTagHashes(distDir, 'script');
        const styleHashes = extractInlineTagHashes(distDir, 'style');

        const cspDirectives = [
          // Deny everything not explicitly listed below.
          "default-src 'none'",
          // Hashes cover inline scripts injected by Astro at build time. No external scripts needed.
          `script-src 'self' ${scriptHashes.join(' ')}`,
          // Hashes cover inline styles injected by Astro at build time. No unsafe-inline needed.
          `style-src 'self' ${styleHashes.join(' ')}`,
          // Fonts served from same origin.
          "font-src 'self'",
          // data: for base64-encoded images used in landing page content.
          "img-src 'self' data:",
          // PostHog analytics host for event tracking.
          `connect-src 'self'${host ? ` ${host}` : ''}`,
          // Prevent <base> tag injection attacks.
          "base-uri 'self'",
        ];

        const headers = [
          '/*',
          `  Content-Security-Policy: ${cspDirectives.join('; ')}`,
          '  X-Content-Type-Options: nosniff',
          '  X-Frame-Options: DENY',
          '  Referrer-Policy: strict-origin-when-cross-origin',
          '',
        ].join('\n');

        writeFileSync(new URL('_headers', dir), headers);
      },
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
  distDir: string,
  tagName: 'script' | 'style',
): string[] {
  const hashes = new Set<string>();

  for (const file of collectHtmlFiles(distDir)) {
    const html = readFileSync(file, 'utf8');
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
  }

  return [...hashes];
}
