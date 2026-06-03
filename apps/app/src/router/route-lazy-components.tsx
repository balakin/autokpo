import { Suspense, lazy, type ComponentType, type ReactNode } from 'react';

import { PageLoadingSkeleton } from '../app-shell/page-loading-skeleton';
import { LazyChunkErrorBoundary } from '../utils/lazy-chunk-error-boundary';

const SignedInAppChunk = lazy(() =>
  import('./signed-in-app').then(({ SignedInApp }) => ({
    default: SignedInApp,
  })),
);

const DashboardPageChunk = lazyRouteComponent(() =>
  import('../dashboard/dashboard-page').then(
    ({ DashboardPage }) => DashboardPage,
  ),
);
const BookLibraryChunk = lazyRouteComponent(() =>
  import('../books/book-library').then(({ BookLibrary }) => BookLibrary),
);
const BookScopeChunk = lazyRouteComponent(() =>
  import('../books/book-scope').then(({ BookScope }) => BookScope),
);
const SettingsPageChunk = lazyRouteComponent(() =>
  import('../settings/settings-page').then(({ SettingsPage }) => SettingsPage),
);
const GeneralSettingsPageChunk = lazyRouteComponent(() =>
  import('../settings/general-settings-page').then(
    ({ GeneralSettingsPage }) => GeneralSettingsPage,
  ),
);
const AccountSettingsPageChunk = lazyRouteComponent(() =>
  import('../settings/account-settings-page').then(
    ({ AccountSettingsPage }) => AccountSettingsPage,
  ),
);
const SecuritySettingsPageChunk = lazyRouteComponent(() =>
  import('../settings/security-settings-page').then(
    ({ SecuritySettingsPage }) => SecuritySettingsPage,
  ),
);
const HelpPageChunk = lazyRouteComponent(() =>
  import('../help/help-page').then(({ HelpPage }) => HelpPage),
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

export function SecuritySettingsPage() {
  return <SecuritySettingsPageChunk />;
}

export function HelpPage() {
  return <HelpPageChunk />;
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
    <div className="flex lg:h-dvh lg:overflow-hidden" aria-busy="true">
      <aside className="hidden w-60 shrink-0 flex-col bg-background text-foreground lg:flex lg:border-r lg:border-border">
        <div className="flex h-14 items-center border-b border-border px-5">
          <span className="text-2xl font-bold tracking-tight">AutoKPO</span>
        </div>

        <nav className="flex flex-1 flex-col gap-2 p-3">
          <div className="h-10 animate-pulse rounded-lg bg-foreground/10" />
          <div className="h-10 animate-pulse rounded-lg bg-foreground/10" />
          <div className="h-10 animate-pulse rounded-lg bg-foreground/7" />
        </nav>

        <div className="px-4 py-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-6">
              <div className="h-3 w-20 animate-pulse rounded-full bg-foreground/10" />
              <div className="h-3 w-16 animate-pulse rounded-full bg-foreground/10" />
            </div>
            <div className="flex items-center justify-between gap-6">
              <div className="h-3 w-16 animate-pulse rounded-full bg-foreground/7" />
              <div className="h-3 w-20 animate-pulse rounded-full bg-foreground/7" />
            </div>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="fixed inset-x-0 top-0 z-10 flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background px-4 lg:static lg:inset-auto">
          <div className="size-9 animate-pulse rounded-lg bg-foreground/10 lg:hidden" />
          <div className="h-4 w-28 animate-pulse rounded-full bg-foreground/10" />
          <div className="flex flex-1 justify-end gap-2">
            <div className="size-9 animate-pulse rounded-full bg-foreground/10" />
          </div>
        </header>

        <main className="bg-background pt-14 pb-4 lg:flex-1 lg:overflow-auto lg:py-0 ">
          <div className="flex flex-col gap-6 p-4 lg:p-6">
            <PageLoadingSkeleton animated={false} />
          </div>
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
