import { Link } from '@heroui/react';
import { Trans } from '@lingui/react/macro';
import type { ReactNode } from 'react';

import { AuthPreferencesPopover } from './auth-preferences-popover';

interface AuthShellProps {
  children: ReactNode;
}

export function AuthShell({ children }: AuthShellProps) {
  return (
    <div className="relative flex min-h-svh flex-col overflow-x-clip bg-background text-foreground">
      <div aria-hidden="true" className="grid-background" />

      <div className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col p-4 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold tracking-tight">AutoKPO</span>
          </div>

          <div className="flex items-center justify-end">
            <AuthPreferencesPopover />
          </div>
        </header>

        <main className="flex flex-1 items-center justify-center py-8 lg:py-12">
          <div className="relative w-full max-w-md">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-24 -left-24 size-80"
              style={{
                background:
                  'radial-gradient(circle, color-mix(in oklch, var(--accent) 20%, transparent) 0%, transparent 70%)',
              }}
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-24 -bottom-24 size-80"
              style={{
                background:
                  'radial-gradient(circle, color-mix(in oklch, var(--success) 15%, transparent) 0%, transparent 70%)',
              }}
            />
            {children}
          </div>
        </main>

        <footer className="py-4 text-center text-xs text-muted">
          <span>AGPL-3.0</span>
          {' · '}
          <Link
            href="https://github.com/balakin/autokpo"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted hover:text-foreground"
          >
            <Trans>Izvorni kod</Trans>
            <Link.Icon />
          </Link>
        </footer>
      </div>
    </div>
  );
}
