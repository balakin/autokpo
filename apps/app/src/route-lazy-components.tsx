import { Suspense, lazy, type ComponentType, type ReactNode } from 'react';

import { PageLoadingSkeleton } from './app-shell/page-loading-skeleton';
import { LazyChunkErrorBoundary } from './lazy-chunk-error-boundary';

const SignedInAppChunk = lazy(() =>
  import('./signed-in-app').then(({ SignedInApp }) => ({
    default: SignedInApp,
  })),
);

const DashboardPageChunk = lazyRouteComponent(() =>
  import('./dashboard/dashboard-page').then(
    ({ DashboardPage }) => DashboardPage,
  ),
);
const BookLibraryChunk = lazyRouteComponent(() =>
  import('./books/book-library').then(({ BookLibrary }) => BookLibrary),
);
const BookScopeChunk = lazyRouteComponent(() =>
  import('./books/book-scope').then(({ BookScope }) => BookScope),
);
const SettingsPageChunk = lazyRouteComponent(() =>
  import('./settings/settings-page').then(({ SettingsPage }) => SettingsPage),
);
const GeneralSettingsPageChunk = lazyRouteComponent(() =>
  import('./settings/general-settings-page').then(
    ({ GeneralSettingsPage }) => GeneralSettingsPage,
  ),
);
const AccountSettingsPageChunk = lazyRouteComponent(() =>
  import('./settings/account-settings-page').then(
    ({ AccountSettingsPage }) => AccountSettingsPage,
  ),
);

export function LazySignedInApp() {
  return <SignedInAppChunk />;
}

export function DashboardPage() {
  return <DashboardPageChunk />;
}

export function BookLibrary() {
  return <BookLibraryChunk />;
}

export function BookScope() {
  return <BookScopeChunk />;
}

export function SettingsPage() {
  return <SettingsPageChunk />;
}

export function GeneralSettingsPage() {
  return <GeneralSettingsPageChunk />;
}

export function AccountSettingsPage() {
  return <AccountSettingsPageChunk />;
}

export function LazySignedInBoundary({ children }: { children: ReactNode }) {
  return (
    <LazyChunkErrorBoundary>
      <Suspense fallback={<SignedInAppFallback />}>{children}</Suspense>
    </LazyChunkErrorBoundary>
  );
}

function SignedInAppFallback() {
  return (
    <div
      className="flex h-screen overflow-hidden bg-background"
      aria-busy="true"
    >
      <aside className="hidden w-60 shrink-0 flex-col bg-sidebar-bg text-sidebar-fg lg:flex">
        <div className="flex h-14 items-center border-b border-sidebar-border px-5">
          <span className="text-2xl font-bold tracking-tight">AutoKPO</span>
        </div>

        <nav className="flex flex-1 flex-col gap-2 p-3">
          <div className="h-10 animate-pulse rounded-lg bg-sidebar-item-hover/70" />
          <div className="h-10 animate-pulse rounded-lg bg-sidebar-item-hover/70" />
          <div className="h-10 animate-pulse rounded-lg bg-sidebar-item-hover/55" />
        </nav>

        <div className="px-4 py-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-6">
              <div className="h-3 w-20 animate-pulse rounded-full bg-sidebar-border/70" />
              <div className="h-3 w-16 animate-pulse rounded-full bg-sidebar-border/70" />
            </div>
            <div className="flex items-center justify-between gap-6">
              <div className="h-3 w-16 animate-pulse rounded-full bg-sidebar-border/55" />
              <div className="h-3 w-20 animate-pulse rounded-full bg-sidebar-border/55" />
            </div>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-separator bg-background px-4">
          <div className="size-9  animate-pulse rounded-lg bg-surface-secondary lg:hidden" />
          <div className="h-4 w-28 animate-pulse rounded-full bg-surface-secondary" />
          <div className="flex flex-1 justify-end gap-2">
            <div className="size-9  animate-pulse rounded-full bg-surface-secondary" />
          </div>
        </header>

        <main className="flex-1 overflow-hidden bg-background p-4 lg:p-6">
          <PageLoadingSkeleton animated={false} />
        </main>
      </div>
    </div>
  );
}

function lazyRouteComponent<T extends ComponentType<object>>(
  load: () => Promise<T>,
): T {
  return lazy(() =>
    load().then((Component) => ({ default: Component })),
  ) as unknown as T;
}
