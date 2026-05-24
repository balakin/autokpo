import { Link } from '@heroui/react';
import { Trans } from '@lingui/react/macro';
import type { ReactNode } from 'react';

import { AuthPreferencesPopover } from './auth-preferences-popover';

interface AuthShellProps {
  children: ReactNode;
}

export function AuthShell({ children }: AuthShellProps) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,color-mix(in_oklch,var(--accent)_22%,transparent),transparent_34%),radial-gradient(circle_at_85%_10%,color-mix(in_oklch,var(--success)_12%,transparent),transparent_30%)]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(var(--border)_1px,transparent_1px),linear-gradient(90deg,var(--border)_1px,transparent_1px)] bg-size-[44px_44px] opacity-[0.07]"
      />

      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col p-4 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold tracking-tight">AutoKPO</span>
          </div>

          <div className="flex items-center justify-end">
            <AuthPreferencesPopover />
          </div>
        </header>

        <main className="flex flex-1 items-center justify-center py-8 lg:py-12">
          {children}
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
