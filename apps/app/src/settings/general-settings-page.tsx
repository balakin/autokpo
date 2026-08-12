import { Button, Card, ListBox, Select, Separator } from '@heroui/react';
import { Trans, useLingui } from '@lingui/react/macro';
import { useQueryClient } from '@tanstack/react-query';
import { LuDownload, LuRefreshCw } from 'react-icons/lu';

import { triggerSync, useDoc } from '../crdt';
import { LOCALES, LOCALE_NAMES } from '../i18n/i18n';
import type { Locale } from '../i18n/i18n';
import { useLocale } from '../i18n/use-locale';

import { buildStateExport, downloadJson, exportFilename } from './export';
import { LastSuccessfulSyncStatus } from './last-successful-sync-status';
import type { Theme } from './theme-context';
import { useTheme } from './use-theme';

export function GeneralSettingsPage() {
  const { theme, setTheme } = useTheme();
  const { locale, setLocale } = useLocale();
  const { t } = useLingui();
  const queryClient = useQueryClient();
  const ydoc = useDoc();

  return (
    <div className="flex flex-col gap-6">
      {/* Theme */}
      <Card>
        <Card.Header>
          <Card.Title>
            <Trans>Tema</Trans>
          </Card.Title>
          <Card.Description>
            <Trans>Izaberite svetlu, tamnu ili sistemsku temu.</Trans>
          </Card.Description>
        </Card.Header>
        <Card.Content>
          <div className="max-w-xs">
            <Select
              aria-label={t`Tema`}
              value={theme ?? 'system'}
              onChange={(key) => setTheme(String(key ?? 'system') as Theme)}
            >
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
        </Card.Content>
      </Card>

      <Separator />

      {/* Language */}
      <Card>
        <Card.Header>
          <Card.Title>
            <Trans>Jezik</Trans>
          </Card.Title>
          <Card.Description>
            <Trans>Izaberite jezik aplikacije.</Trans>
          </Card.Description>
        </Card.Header>
        <Card.Content>
          <div className="max-w-xs">
            <Select
              aria-label={t`Jezik`}
              value={locale}
              onChange={(key) => {
                if (key) setLocale(key as Locale);
              }}
            >
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
        </Card.Content>
      </Card>

      <Separator />

      {/* Data */}
      <Card>
        <Card.Header>
          <Card.Title>
            <Trans>Podaci</Trans>
          </Card.Title>
          <Card.Description>
            <Trans>Preuzmite kopiju svih podataka knjiga i stavki.</Trans>
          </Card.Description>
        </Card.Header>
        <Card.Content className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              onPress={() => {
                triggerSync(queryClient);
              }}
            >
              <LuRefreshCw />
              <Trans>Sinhronizuj sada</Trans>
            </Button>
            <Button
              variant="secondary"
              onPress={() => {
                downloadJson(
                  exportFilename('autokpo-state'),
                  buildStateExport(ydoc),
                );
              }}
            >
              <LuDownload />
              <Trans>Izvezi podatke</Trans>
            </Button>
          </div>
          <LastSuccessfulSyncStatus />
        </Card.Content>
      </Card>
    </div>
  );
}
