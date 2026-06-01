import { Alert, Button, Chip, Drawer, Modal, Popover } from '@heroui/react';
import { Trans, useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import {
  LuCircleAlert,
  LuCircleCheck,
  LuSettings,
  LuWifi,
  LuWifiOff,
  LuX,
} from 'react-icons/lu';
import { useNavigate } from 'react-router';

import { useSyncMetadata } from '../crdt';
import { useIsMobile } from '../hooks/use-is-mobile';
import { useOnline } from '../hooks/use-online';

import { useAuth } from './use-auth';
import { UserAvatar } from './user-avatar';

export function ProfilePopover() {
  const auth = useAuth();
  const isOnline = useOnline();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [showMobileProfile, setShowMobileProfile] = useState(false);
  const [showDesktopProfile, setShowDesktopProfile] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const { t } = useLingui();
  const dirty = useSyncMetadata((state) => state.dirty);

  async function onSignOutPress() {
    if (!isOnline) {
      return;
    }
    if (dirty) {
      setShowDesktopProfile(false);
      setShowConfirm(true);
      return;
    }
    await auth.logout();
  }

  async function onConfirmSignOut() {
    setShowConfirm(false);
    await auth.logout();
  }

  function onAccountSettingsPress() {
    setShowMobileProfile(false);
    setShowDesktopProfile(false);
    void navigate('/settings/account');
  }

  if (!auth.user) {
    return null;
  }

  const { id: userId, email } = auth.user;

  const profilePanel = (
    <div className="space-y-4">
      <section className="rounded-2xl border border-separator/70 bg-surface px-4 py-3 shadow-xs">
        <div className="flex items-center gap-3">
          <UserAvatar userId={userId} email={email} image={null} size="md" />
          <div className="min-w-0">
            <p className="text-[11px] font-medium tracking-[0.08em] text-muted uppercase">
              <Trans>Nalog</Trans>
            </p>
            <p className="truncate text-sm font-semibold text-foreground">
              {email ?? userId}
            </p>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {isOnline ? (
            <Chip size="sm" variant="soft" color="success">
              <LuWifi className="size-3.5" />
              <Trans>Online</Trans>
            </Chip>
          ) : (
            <Chip size="sm" variant="soft" color="danger">
              <LuWifiOff className="size-3.5" />
              <Trans>Offline</Trans>
            </Chip>
          )}

          {dirty ? (
            <Chip size="sm" variant="soft" color="warning">
              <LuCircleAlert className="size-3.5" />
              <Trans>Nesinhronizovano</Trans>
            </Chip>
          ) : (
            <Chip size="sm" variant="soft" color="success">
              <LuCircleCheck className="size-3.5" />
              <Trans>Sinhronizovano</Trans>
            </Chip>
          )}
        </div>
      </section>

      <section>
        <Button
          variant="secondary"
          className="w-full"
          onPress={onAccountSettingsPress}
        >
          <LuSettings className="size-4" />
          <Trans>Podešavanja naloga</Trans>
        </Button>
      </section>

      <section>
        {!isOnline ? (
          <Alert status="warning" className="mb-3">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Description className="text-xs/relaxed ">
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
          onPress={() => void onSignOutPress()}
        >
          <Trans>Odjavi se</Trans>
        </Button>
      </section>
    </div>
  );

  return (
    <>
      {isMobile ? (
        <Drawer isOpen={showMobileProfile} onOpenChange={setShowMobileProfile}>
          <Button isIconOnly size="md" variant="ghost" aria-label={t`Profil`}>
            <UserAvatar
              userId={userId}
              email={email}
              image={null}
              className="size-full"
            />
          </Button>
          <Drawer.Backdrop variant="transparent">
            <Drawer.Content
              placement="right"
              className="w-screen max-w-none p-0"
            >
              <Drawer.Dialog
                aria-label={t`Profil`}
                className="size-full max-w-full rounded-none bg-background p-0"
              >
                <div className="flex min-h-14 items-center justify-between border-b border-separator px-5">
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
                <Drawer.Body className="p-4">{profilePanel}</Drawer.Body>
              </Drawer.Dialog>
            </Drawer.Content>
          </Drawer.Backdrop>
        </Drawer>
      ) : (
        <Popover
          isOpen={showDesktopProfile}
          onOpenChange={setShowDesktopProfile}
        >
          <Button isIconOnly size="md" variant="ghost" aria-label={t`Profil`}>
            <UserAvatar
              userId={userId}
              email={email}
              image={null}
              className="size-full"
            />
          </Button>
          <Popover.Content placement="bottom end" className="w-72 p-0">
            <Popover.Dialog>{profilePanel}</Popover.Dialog>
          </Popover.Content>
        </Popover>
      )}

      <Modal.Backdrop isOpen={showConfirm} onOpenChange={setShowConfirm}>
        <Modal.Container>
          <Modal.Dialog className="sm:max-w-md">
            <Modal.Header>
              <Modal.Heading>
                <Trans>Odjava sa nesinhronizovanim izmenama?</Trans>
              </Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              <p>
                <Trans>
                  Imate lokalne izmene koje nisu sinhronizovane. Ako nastavite,
                  može doći do gubitka podataka koji nisu poslati.
                </Trans>
              </p>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onPress={() => setShowConfirm(false)}>
                <Trans>Otkaži</Trans>
              </Button>
              <Button variant="danger" onPress={() => void onConfirmSignOut()}>
                <Trans>Odjavi ipak</Trans>
              </Button>
            </Modal.Footer>
            <Modal.CloseTrigger />
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </>
  );
}
