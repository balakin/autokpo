import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';

import { version } from './package.json';

// https://astro.build/config
export default defineConfig({
  site: 'https://autokpo.com',
  vite: {
    define: {
      __APP_VERSION__: JSON.stringify(version),
    },
  },
  integrations: [
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
