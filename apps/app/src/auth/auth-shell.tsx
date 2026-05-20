import { Label, Link, ListBox, Select } from '@heroui/react';
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import type { ReactNode } from 'react';

import { LOCALE_NAMES, LOCALES } from '../i18n/i18n';
import type { Locale } from '../i18n/i18n';
import { useLocale } from '../i18n/use-locale';
import type { Theme } from '../settings/theme-context';
import { useTheme } from '../settings/use-theme';

interface AuthShellProps {
  children: ReactNode;
}

export function AuthShell({ children }: AuthShellProps) {
  const { locale, setLocale } = useLocale();
  const { theme, setTheme } = useTheme();

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

      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col p-4  sm:px-6 lg:px-8">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold tracking-tight">AutoKPO</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <div className="min-w-36">
              <Select
                aria-label={t`Jezik`}
                value={locale}
                onChange={(key) => {
                  if (key) setLocale(key as Locale);
                }}
              >
                <Label className="sr-only">{t`Jezik`}</Label>
                <Select.Trigger>
                  <Select.Value />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover>
                  <ListBox>
                    {LOCALES.map((loc) => (
                      <ListBox.Item
                        key={loc}
                        id={loc}
                        textValue={LOCALE_NAMES[loc]}
                      >
                        {LOCALE_NAMES[loc]}
                        <ListBox.ItemIndicator />
                      </ListBox.Item>
                    ))}
                  </ListBox>
                </Select.Popover>
              </Select>
            </div>
            <div className="min-w-32">
              <Select
                aria-label={t`Tema`}
                value={theme}
                onChange={(key) => setTheme(String(key ?? 'system') as Theme)}
              >
                <Label className="sr-only">{t`Tema`}</Label>
                <Select.Trigger>
                  <Select.Value />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover>
                  <ListBox>
                    <ListBox.Item id="light" textValue={t`Svetla`}>
                      <Trans>Svetla</Trans>
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                    <ListBox.Item id="dark" textValue={t`Tamna`}>
                      <Trans>Tamna</Trans>
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                    <ListBox.Item id="system" textValue={t`Sistemska`}>
                      <Trans>Sistemska</Trans>
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                  </ListBox>
                </Select.Popover>
              </Select>
            </div>
          </div>
        </header>

        <main className="flex flex-1 items-center justify-center py-8 lg:py-12">
          {children}
        </main>

        <footer className="py-4 text-center text-xs text-muted">
          <span>AGPL-3.0</span>
          {' · '}
          <Link
            href={import.meta.env.VITE_SOURCE_URL}
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
