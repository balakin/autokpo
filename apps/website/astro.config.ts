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
    },
  },
  integrations: [
    generateHeaders(),
    sitemap({
      i18n: {
        defaultLocale: 'sr-Latn',
        locales: {
          'sr-Latn': 'sr-Latn',
          en: 'en',
          ru: 'ru',
        },
      },
    }),
  ],
  i18n: {
    locales: ['sr-Latn', 'en', 'ru'],
    defaultLocale: 'sr-Latn',
  },
});

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
        const token = process.env.PUBLIC_POSTHOG_PROJECT_TOKEN;
        const host = process.env.PUBLIC_POSTHOG_HOST;
        const reportUri =
          token && host ? `${host}/report/?token=${token}&v=${version}` : null;

        const distDir = fileURLToPath(dir);
        const scriptHashes = extractInlineTagHashes(distDir, 'script');
        const styleHashes = extractInlineTagHashes(distDir, 'style');

        const cspDirectives = [
          "default-src 'none'",
          `script-src 'self' ${scriptHashes.join(' ')}`,
          `style-src 'self' ${styleHashes.join(' ')}`,
          "font-src 'self'",
          "img-src 'self' data:",
          `connect-src 'self'${host ? ` ${host}` : ''}`,
          "base-uri 'self'",
          ...(reportUri
            ? [`report-uri ${reportUri}`, 'report-to posthog']
            : []),
        ];

        const headers = [
          '/*',
          `  Content-Security-Policy: ${cspDirectives.join('; ')}`,
          '  X-Content-Type-Options: nosniff',
          '  X-Frame-Options: DENY',
          '  Referrer-Policy: strict-origin-when-cross-origin',
          ...(reportUri
            ? [`  Reporting-Endpoints: posthog="${reportUri}"`]
            : []),
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
