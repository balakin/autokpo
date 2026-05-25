import { Trans, useLingui } from '@lingui/react/macro';
import { Link, Outlet, useLocation } from 'react-router';
import { tv } from 'tailwind-variants';

const tabLink = tv({
  base: 'rounded-full px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
  variants: {
    selected: {
      true: 'bg-accent text-accent-foreground shadow-xs',
      false: 'text-muted hover:bg-surface-secondary hover:text-foreground',
    },
  },
});

export function SettingsPage() {
  const { t } = useLingui();
  const { pathname } = useLocation();
  const selectedTab = pathname.startsWith('/settings/account')
    ? 'account'
    : pathname.startsWith('/settings/security')
      ? 'security'
      : 'general';

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <h1 className="sr-only">
        <Trans>Podešavanja</Trans>
      </h1>

      <nav
        role="tablist"
        aria-label={t`Podešavanja`}
        className="flex w-fit gap-1 rounded-full bg-surface-secondary p-1"
      >
        <Link
          to="/settings/general"
          role="tab"
          aria-selected={selectedTab === 'general'}
          className={tabLink({ selected: selectedTab === 'general' })}
        >
          <Trans>Opšte</Trans>
        </Link>
        <Link
          to="/settings/account"
          role="tab"
          aria-selected={selectedTab === 'account'}
          className={tabLink({ selected: selectedTab === 'account' })}
        >
          <Trans>Nalog</Trans>
        </Link>
        <Link
          to="/settings/security"
          role="tab"
          aria-selected={selectedTab === 'security'}
          className={tabLink({ selected: selectedTab === 'security' })}
        >
          <Trans>Bezbednost</Trans>
        </Link>
      </nav>

      <Outlet />
    </div>
  );
}
