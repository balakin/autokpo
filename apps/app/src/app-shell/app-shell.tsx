import { RouterProvider } from '@heroui/react';
import { Suspense, useState } from 'react';
import { Outlet, useNavigate } from 'react-router';

import { MobileDrawer } from './mobile-drawer';
import { PageLoadingSkeleton } from './page-loading-skeleton';
import { Sidebar } from './sidebar';
import { TopBar } from './top-bar';
import { TopBarActionsProvider } from './top-bar-actions';

export function AppShell() {
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <RouterProvider navigate={(...args) => void navigate(...args)}>
      <TopBarActionsProvider>
        <div className="flex h-svh overflow-hidden">
          <aside
            className="hidden w-60 shrink-0 flex-col lg:flex"
            aria-label="Sidebar"
          >
            <Sidebar />
          </aside>

          <MobileDrawer
            isOpen={isMobileDrawerOpen}
            onOpenChange={setIsMobileDrawerOpen}
          />

          <div className="flex min-w-0 flex-1 flex-col">
            <TopBar onMenuPress={() => setIsMobileDrawerOpen(true)} />
            <main className="flex-1 overflow-auto bg-background">
              <Suspense fallback={<PageLoadingFallback />}>
                <Outlet />
              </Suspense>
            </main>
          </div>
        </div>
      </TopBarActionsProvider>
    </RouterProvider>
  );
}

function PageLoadingFallback() {
  return (
    <div className="min-h-full bg-background p-4 lg:p-6" aria-busy="true">
      <PageLoadingSkeleton />
    </div>
  );
}
