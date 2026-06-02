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
        <div className="flex lg:h-dvh lg:overflow-hidden">
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
            <main className="bg-background pt-14 pb-4 lg:flex-1 lg:overflow-auto lg:py-0">
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
    <div className="flex flex-col gap-6 p-4 lg:p-6" aria-busy="true">
      <PageLoadingSkeleton />
    </div>
  );
}
