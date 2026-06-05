import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://autokpo.com',
  i18n: {
    locales: ['sr-Latn', 'en', 'ru'],
    defaultLocale: 'sr-Latn',
  },
});
