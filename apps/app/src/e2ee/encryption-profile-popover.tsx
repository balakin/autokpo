import {
  Alert,
  Button,
  Drawer,
  Label,
  ListBox,
  Popover,
  Select,
} from '@heroui/react';
import { Trans, useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { LuX } from 'react-icons/lu';

import { useAuth } from '../auth/use-auth';
import { UserAvatar } from '../auth/user-avatar';
import { useIsMobile } from '../hooks/use-is-mobile';
import { useOnline } from '../hooks/use-online';
import { LOCALE_NAMES, LOCALES } from '../i18n/i18n';
import type { Locale } from '../i18n/i18n';
import { useLocale } from '../i18n/use-locale';
import type { Theme } from '../settings/theme-context';
import { useTheme } from '../settings/use-theme';

export function EncryptionProfilePopover() {
  const auth = useAuth();
  const isMobile = useIsMobile();
  const isOnline = useOnline();
  const { locale, setLocale } = useLocale();
  const { theme, setTheme } = useTheme();
  const [showProfile, setShowProfile] = useState(false);
  const { t } = useLingui();

  if (!auth.user) {
    return null;
  }

  const { id: userId, email, image } = auth.user;

  async function signOut() {
    if (!isOnline) return;
    setShowProfile(false);
    await auth.logout();
  }

  const trigger = (
    <Button isIconOnly size="md" variant="ghost" aria-label={t`Profil`}>
      <UserAvatar
        userId={userId}
        email={email}
        image={image}
        className="size-full"
      />
    </Button>
  );

  const content = (
    <div className="space-y-4">
      <section className="rounded-2xl border border-separator/70 bg-surface px-4 py-3 shadow-xs">
        <div className="flex items-center gap-3">
          <UserAvatar userId={userId} email={email} image={image} size="md" />
          <div className="min-w-0">
            <p className="text-[11px] font-medium tracking-[0.08em] text-muted uppercase">
              <Trans>Nalog</Trans>
            </p>
            <p className="truncate text-sm font-semibold text-foreground">
              {email ?? userId}
            </p>
          </div>
        </div>
      </section>

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

      <section>
        {!isOnline ? (
          <Alert status="warning" className="mb-3">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Description className="text-xs/relaxed">
                <Trans>
                  Odjava zahteva internet vezu. Ako je hitno, obrišite site data
                  ovog sajta u browseru.
                </Trans>
              </Alert.Description>
            </Alert.Content>
          </Alert>
        ) : null}
        <Button
          variant="danger"
          className="w-full"
          isDisabled={!isOnline}
          onPress={() => void signOut()}
        >
          <Trans>Odjavi se</Trans>
        </Button>
      </section>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer isOpen={showProfile} onOpenChange={setShowProfile}>
        {trigger}
        <Drawer.Backdrop>
          <Drawer.Content placement="right" className="w-screen max-w-none p-0">
            <Drawer.Dialog
              aria-label={t`Profil`}
              className="size-full max-w-full rounded-none bg-background p-0"
            >
              <div className="flex h-14 items-center justify-between border-b border-separator px-5">
                <Drawer.Heading className="text-base font-semibold">
                  <Trans>Profil</Trans>
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
    <Popover isOpen={showProfile} onOpenChange={setShowProfile}>
      {trigger}
      <Popover.Content placement="bottom end" className="w-72 p-0">
        <Popover.Dialog>{content}</Popover.Dialog>
      </Popover.Content>
    </Popover>
  );
}
