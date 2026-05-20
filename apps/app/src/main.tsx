import { Toast } from '@heroui/react';
import { I18nProvider } from '@lingui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';

import { i18n } from './i18n/i18n';
import { LocaleProvider } from './i18n/locale-provider';
import { LeaderProvider } from './leader';
import { OfflineIndicator } from './pwa/offline-indicator';
import { PwaRegisterer } from './pwa/pwa-registerer';
import { router } from './router';
import { ThemeProvider } from './settings/theme-provider';

import './index.css';

const queryClient = new QueryClient();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <I18nProvider i18n={i18n}>
        <LocaleProvider>
          <ThemeProvider>
            <LeaderProvider>
              <Toast.Provider />
              <RouterProvider router={router} />
              <OfflineIndicator />
              <PwaRegisterer />
            </LeaderProvider>
          </ThemeProvider>
        </LocaleProvider>
      </I18nProvider>
    </QueryClientProvider>
  </StrictMode>,
);
