import { Button, Drawer, Label, ListBox, Popover, Select } from '@heroui/react';
import { Trans, useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { LuSettings, LuX } from 'react-icons/lu';

import { useIsMobile } from '../hooks/use-is-mobile';
import { LOCALE_NAMES, LOCALES } from '../i18n/i18n';
import type { Locale } from '../i18n/i18n';
import { useLocale } from '../i18n/use-locale';
import type { Theme } from '../settings/theme-context';
import { useTheme } from '../settings/use-theme';

export function AuthPreferencesPopover() {
  const isMobile = useIsMobile();
  const { locale, setLocale } = useLocale();
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const { t } = useLingui();

  const trigger = (
    <Button isIconOnly size="md" variant="ghost" aria-label={t`Podešavanja`}>
      <LuSettings className="size-4" />
    </Button>
  );

  const content = (
    <div className="space-y-4">
      <section className="space-y-3">
        <div>
          <Select
            aria-label={t`Jezik`}
            value={locale}
            onChange={(key) => {
              if (key) setLocale(key as Locale);
            }}
          >
            <Label>{t`Jezik`}</Label>
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
        <div>
          <Select
            aria-label={t`Tema`}
            value={theme}
            onChange={(key) => setTheme(String(key ?? 'system') as Theme)}
          >
            <Label>{t`Tema`}</Label>
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
      </section>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer isOpen={open} onOpenChange={setOpen}>
        {trigger}
        <Drawer.Backdrop>
          <Drawer.Content placement="right" className="w-screen max-w-none p-0">
            <Drawer.Dialog
              aria-label={t`Podešavanja`}
              className="size-full max-w-full rounded-none bg-background p-0"
            >
              <div className="flex h-14 items-center justify-between border-b border-separator px-5">
                <Drawer.Heading className="text-base font-semibold">
                  <Trans>Podešavanja</Trans>
                </Drawer.Heading>
                <Button
                  slot="close"
                  isIconOnly
                  variant="ghost"
                  size="sm"
                  aria-label={t`Zatvori`}
                  autoFocus
                >
                  <LuX className="size-4" />
                </Button>
              </div>
              <Drawer.Body className="p-4">{content}</Drawer.Body>
            </Drawer.Dialog>
          </Drawer.Content>
        </Drawer.Backdrop>
      </Drawer>
    );
  }

  return (
    <Popover isOpen={open} onOpenChange={setOpen}>
      {trigger}
      <Popover.Content placement="bottom end" className="w-60 p-0">
        <Popover.Dialog>{content}</Popover.Dialog>
      </Popover.Content>
    </Popover>
  );
}
