import { Toast } from '@heroui/react';
import { I18nProvider } from '@lingui/react';
import { PostHogProvider } from '@posthog/react';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';

import { initAnalytics, posthog } from './analytics/posthog';
import { SessionSync } from './auth/session-sync';
import { i18n } from './i18n/i18n';
import { LocaleProvider } from './i18n/locale-provider';
import { OfflineIndicator } from './pwa/offline-indicator';
import { PwaRegisterer } from './pwa/pwa-registerer';
import { QueryClientProvider } from './query-client';
import { createRouter } from './router';
import { ThemeProvider } from './settings/theme-provider';

import './index.css';

initAnalytics();

const router = createRouter();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PostHogProvider client={posthog}>
      <QueryClientProvider>
        <I18nProvider i18n={i18n}>
          <LocaleProvider>
            <ThemeProvider>
              <Toast.Provider />
              <SessionSync />
              <RouterProvider router={router} />
              <OfflineIndicator />
              <PwaRegisterer />
            </ThemeProvider>
          </LocaleProvider>
        </I18nProvider>
        <ReactQueryDevtools />
      </QueryClientProvider>
    </PostHogProvider>
  </StrictMode>,
);
