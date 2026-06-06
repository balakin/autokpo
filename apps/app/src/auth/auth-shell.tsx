import { Link } from '@heroui/react';
import { Trans } from '@lingui/react/macro';
import type { ReactNode } from 'react';

import { AuthPreferencesPopover } from './auth-preferences-popover';
import { useLocale } from '../i18n/use-locale';
import { getLegalLinks } from '../legal/legal-links';

interface AuthShellProps {
  children: ReactNode;
}

export function AuthShell({ children }: AuthShellProps) {
  const { locale } = useLocale();
  const legalLinks = getLegalLinks(locale);

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
          <div className="relative w-full max-w-lg">
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

        <footer className="flex flex-col items-center gap-1 py-4 text-center text-xs text-muted">
          <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
            <span>AGPL-3.0</span>
            <span aria-hidden="true">·</span>
            <Link
              href="https://github.com/balakin/autokpo"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted hover:text-foreground"
            >
              <Trans>Izvorni kod</Trans>
            </Link>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
            <Link
              href={legalLinks.terms}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted hover:text-foreground"
            >
              <Trans>Uslovi</Trans>
            </Link>
            <span aria-hidden="true">·</span>
            <Link
              href={legalLinks.privacy}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted hover:text-foreground"
            >
              <Trans>Privatnost</Trans>
            </Link>
            <span aria-hidden="true">·</span>
            <Link
              href={legalLinks.cookies}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted hover:text-foreground"
            >
              <Trans>Kolačići</Trans>
            </Link>
          </div>
        </footer>
      </div>
    </div>
  );
}
