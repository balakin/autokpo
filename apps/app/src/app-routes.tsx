import { Navigate, Outlet, type RouteObject } from 'react-router';

import { AuthEmailProvider } from './auth/auth-email-provider';
import { AuthEntry } from './auth/auth-entry';
import { AuthStateRedirect } from './auth/auth-state-redirect';
import { EmailAuthPage } from './auth/email-auth-page';
import { GoodbyePage } from './auth/goodbye-page';
import { OAuthCallback } from './auth/oauth-callback';
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

export const appRoutes: RouteObject[] = [
  {
    path: '/sign-in/oauth/:provider/callback',
    element: <OAuthCallback />,
  },
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
  { path: '*', element: <AuthStateRedirect /> },
];
