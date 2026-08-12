import { Tabs } from '@heroui/react';
import { Trans, useLingui } from '@lingui/react/macro';
import { Outlet, useLocation } from 'react-router';

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

      <Tabs selectedKey={selectedTab}>
        <Tabs.ListContainer className="w-fit">
          <Tabs.List aria-label={t`Podešavanja`}>
            <Tabs.Tab id="general" href="/settings/general">
              <Trans>Opšte</Trans>
              <Tabs.Indicator />
            </Tabs.Tab>
            <Tabs.Tab id="account" href="/settings/account">
              <Trans>Nalog</Trans>
              <Tabs.Indicator />
            </Tabs.Tab>
            <Tabs.Tab id="security" href="/settings/security">
              <Trans>Bezbednost</Trans>
              <Tabs.Indicator />
            </Tabs.Tab>
          </Tabs.List>
        </Tabs.ListContainer>
      </Tabs>

      <Outlet />
    </div>
  );
}
