import { Navigate, Outlet, redirect, type RouteObject } from 'react-router';

import { AuthEmailProvider } from './auth/auth-email-provider';
import { AuthEntry } from './auth/auth-entry';
import { readStoredSession } from './auth/auth-session';
import { EmailAuthPage } from './auth/email-auth-page';
import { GoodbyePage } from './auth/goodbye-page';
import { OAuthCallback } from './auth/oauth-callback';
import { SessionSync } from './auth/session-sync';
import { SignedInGate } from './auth/signed-in-gate';
import { SignedOutGate } from './auth/signed-out-gate';
import {
  AccountSettingsPage,
  BookLibrary,
  BookScope,
  DashboardPage,
  GeneralSettingsPage,
  HelpPage,
  LazySignedInApp,
  LazySignedInBoundary,
  SecuritySettingsPage,
  SettingsPage,
} from './route-lazy-components';
import { SignedInEncryptionBoundary } from './signed-in-encryption-boundary';

export function createAppRoutes(): RouteObject[] {
  return [
    {
      path: '/sign-in/oauth/:provider/callback',
      element: <OAuthCallback />,
    },
    {
      element: (
        <>
          <SessionSync />
          <Outlet />
        </>
      ),
      children: [
        {
          element: (
            <SignedInGate>
              <SignedInEncryptionBoundary>
                <LazySignedInBoundary>
                  <LazySignedInApp />
                </LazySignedInBoundary>
              </SignedInEncryptionBoundary>
            </SignedInGate>
          ),
          children: [
            { path: '/dashboard', element: <DashboardPage /> },
            { path: '/books', element: <BookLibrary /> },
            { path: '/books/:bookId', element: <BookScope /> },
            { path: '/help', element: <HelpPage /> },
            {
              path: '/settings',
              element: <SettingsPage />,
              children: [
                {
                  index: true,
                  element: <Navigate to="/settings/general" replace />,
                },
                { path: 'general', element: <GeneralSettingsPage /> },
                { path: 'account', element: <AccountSettingsPage /> },
                { path: 'security', element: <SecuritySettingsPage /> },
              ],
            },
          ],
        },
        {
          element: (
            <SignedOutGate>
              <AuthEmailProvider>
                <Outlet />
              </AuthEmailProvider>
            </SignedOutGate>
          ),
          children: [
            { path: '/sign-in', element: <AuthEntry /> },
            { path: '/sign-in/code', element: <EmailAuthPage /> },
            { path: '/goodbye', element: <GoodbyePage /> },
          ],
        },
        {
          path: '*',
          loader: () =>
            readStoredSession() ? redirect('/dashboard') : redirect('/sign-in'),
        },
      ],
    },
  ];
}
