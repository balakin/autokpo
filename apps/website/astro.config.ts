import { writeFileSync } from 'node:fs';

import sitemap from '@astrojs/sitemap';
import type { AstroIntegration } from 'astro';
import { defineConfig } from 'astro/config';

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

function generateHeaders(): AstroIntegration {
  return {
    name: 'generate-headers',
    hooks: {
      'astro:build:done': ({ dir }) => {
        const token = process.env.PUBLIC_POSTHOG_PROJECT_TOKEN;
        const host = process.env.PUBLIC_POSTHOG_HOST;
        const reportUri =
          token && host ? `${host}/report/?token=${token}` : null;

        const cspDirectives = [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline'",
          "style-src 'self' 'unsafe-inline'",
          "font-src 'self'",
          "img-src 'self' data:",
          `connect-src 'self'${host ? ` ${host}` : ''}`,
          "frame-src 'none'",
          "object-src 'none'",
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
