import {
  Alert,
  Button,
  Card,
  Chip,
  Dropdown,
  Input,
  Label,
  Modal,
  Skeleton,
  Separator,
  toast,
} from '@heroui/react';
import { Trans, useLingui } from '@lingui/react/macro';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import Cropper, { type Area } from 'react-easy-crop';
import 'react-easy-crop/react-easy-crop.css';
import {
  LuCircleAlert,
  LuCircleCheck,
  LuClock,
  LuDownload,
  LuGlobe,
  LuLaptop,
  LuLogOut,
  LuPencil,
  LuTrash,
  LuWifi,
  LuWifiOff,
} from 'react-icons/lu';

import { useAuth } from '../auth/use-auth';
import { UserAvatar } from '../auth/user-avatar';
import { useSyncMetadata } from '../crdt';
import { useOnline } from '../hooks/use-online';
import { INTL_LOCALES } from '../i18n/i18n';
import type { Locale } from '../i18n/i18n';
import { useLocale } from '../i18n/use-locale';

import {
  buildAccountExport,
  deleteAccount,
  fetchAccountProfile,
  fetchAccountSessions,
  removeProfileImage,
  revokeAccountSession,
  revokeOtherAccountSessions,
  uploadProfileImage,
  type AccountSession,
  type AccountProfile,
} from './account-settings-api';
import { downloadJson, exportFilename } from './export';

export function AccountSettingsPage() {
  const auth = useAuth();
  const isOnline = useOnline();
  const queryClient = useQueryClient();
  const dirty = useSyncMetadata((state) => state.dirty);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const accountQueryKey = ['account-settings', 'profile', auth.user?.id];
  const sessionsQueryKey = ['account-settings', 'sessions', auth.user?.id];
  const accountQuery = useQuery({
    queryKey: accountQueryKey,
    queryFn: fetchAccountProfile,
    enabled: isOnline && !!auth.user,
    staleTime: 5 * 60 * 1000,
  });
  const sessionsQuery = useQuery({
    queryKey: sessionsQueryKey,
    queryFn: fetchAccountSessions,
    enabled: isOnline && !!auth.user,
    staleTime: 60 * 1000,
  });

  const invalidateSessions = () =>
    queryClient.invalidateQueries({ queryKey: sessionsQueryKey });
  const refreshAccount = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: accountQueryKey }),
      auth.refresh(),
    ]);

  if (!isOnline) return <AccountOfflineCard />;
  if (accountQuery.isPending) return <AccountLoadingSkeleton />;
  if (accountQuery.isError) return <AccountErrorCard />;

  const account = accountQuery.data;

  return (
    <>
      <div className="flex flex-col gap-6">
        <Card>
          <Card.Header>
            <Card.Title>
              <Trans>Podešavanja naloga</Trans>
            </Card.Title>
            <Card.Description>
              <Trans>Pregled podataka povezanih sa vašim nalogom.</Trans>
            </Card.Description>
          </Card.Header>
          <Card.Content>
            <AccountProfileSection
              account={account}
              dirty={dirty}
              onAccountChanged={refreshAccount}
              onDeleteRequest={() => setShowDeleteConfirm(true)}
            />
          </Card.Content>
        </Card>

        <Separator />

        <AccountSessionsCard
          sessions={sessionsQuery.data ?? []}
          isLoading={sessionsQuery.isPending}
          isError={sessionsQuery.isError}
          onRefresh={invalidateSessions}
        />

        <Separator />

        <AccountDataExportCard />
      </div>

      <DeleteAccountModal
        account={account}
        isOnline={isOnline}
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
      />
    </>
  );
}

function AccountLoadingSkeleton() {
  return (
    <Card>
      <Card.Header>
        <Card.Title>
          <Trans>Podešavanja naloga</Trans>
        </Card.Title>
      </Card.Header>
      <Card.Content className="overflow-hidden">
        <span className="sr-only">
          <Trans>Učitavanje podataka naloga…</Trans>
        </span>
        <section className="rounded-2xl border border-separator/70 bg-surface px-4 py-3 shadow-xs">
          <div className="flex items-center gap-4">
            <Skeleton
              animationType="none"
              className="size-10 shrink-0 rounded-full"
            />
            <div className="min-w-0 flex-1 space-y-3">
              <Skeleton
                animationType="none"
                className="h-3 w-16 rounded-full"
              />
              <Skeleton
                animationType="none"
                className="h-4 w-44 max-w-full rounded-full"
              />
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <Skeleton animationType="none" className="h-6 w-20 rounded-full" />
            <Skeleton animationType="none" className="h-6 w-28 rounded-full" />
          </div>
        </section>
      </Card.Content>
    </Card>
  );
}

function AccountOfflineCard() {
  return (
    <Card>
      <Card.Header>
        <Card.Title>
          <Trans>Podešavanja naloga</Trans>
        </Card.Title>
        <Card.Description>
          <Trans>Ova podešavanja zahtevaju internet vezu.</Trans>
        </Card.Description>
      </Card.Header>
      <Card.Content>
        <Alert status="warning">
          <Alert.Indicator>
            <LuWifiOff className="size-4" />
          </Alert.Indicator>
          <Alert.Content>
            <Alert.Title>
              <Trans>Podešavanja naloga nisu dostupna offline</Trans>
            </Alert.Title>
            <Alert.Description>
              <Trans>
                Za pregled i izmenu naloga potrebna je internet veza. Opšta
                podešavanja aplikacije ostaju dostupna bez interneta.
              </Trans>
            </Alert.Description>
          </Alert.Content>
        </Alert>
      </Card.Content>
    </Card>
  );
}

function AccountErrorCard() {
  return (
    <Card>
      <Card.Header>
        <Card.Title>
          <Trans>Podešavanja naloga</Trans>
        </Card.Title>
      </Card.Header>
      <Card.Content>
        <Alert status="danger">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>
              <Trans>Nije moguće učitati nalog</Trans>
            </Alert.Title>
            <Alert.Description>
              <Trans>Proverite internet vezu i pokušajte ponovo kasnije.</Trans>
            </Alert.Description>
          </Alert.Content>
        </Alert>
      </Card.Content>
    </Card>
  );
}

interface AccountSessionsCardProps {
  sessions: AccountSession[];
  isLoading: boolean;
  isError: boolean;
  onRefresh: () => Promise<unknown>;
}

function AccountSessionsCard({
  sessions,
  isLoading,
  isError,
  onRefresh,
}: AccountSessionsCardProps) {
  const { t } = useLingui();
  const { locale } = useLocale();
  const sortedSessions = [...sessions].sort((a, b) => {
    if (a.isCurrent === b.isCurrent) return 0;
    return a.isCurrent ? -1 : 1;
  });
  const otherSessions = sortedSessions.filter((session) => !session.isCurrent);
  const hasOtherSessions = otherSessions.length > 0;
  const revokeSessionMutation = useMutation({
    mutationFn: revokeAccountSession,
    onSuccess: () => {
      toast.success(t`Sesija je odjavljena.`);
      void onRefresh();
    },
    onError: () => {
      toast.danger(t`Nije moguće odjaviti sesiju. Pokušajte ponovo.`);
    },
  });
  const revokeOtherSessionsMutation = useMutation({
    mutationFn: revokeOtherAccountSessions,
    onSuccess: () => {
      toast.success(t`Sve ostale sesije su odjavljene.`);
      void onRefresh();
    },
    onError: () => {
      toast.danger(t`Nije moguće odjaviti ostale sesije. Pokušajte ponovo.`);
    },
  });

  return (
    <Card>
      <Card.Header>
        <Card.Title>
          <Trans>Sesije</Trans>
        </Card.Title>
        <Card.Description>
          <Trans>Pregledajte aktivne prijave na drugim uređajima.</Trans>
        </Card.Description>
      </Card.Header>
      <Card.Content className="flex flex-col gap-4">
        {isLoading ? <AccountSessionsSkeleton /> : null}

        {isError ? <AccountSessionsError /> : null}

        {!isLoading && !isError ? (
          <>
            <div className="flex flex-col gap-3">
              {sortedSessions.map((session) => (
                <AccountSessionRow
                  key={session.id}
                  session={session}
                  locale={locale}
                  isPending={
                    revokeSessionMutation.isPending &&
                    revokeSessionMutation.variables === session.token
                  }
                  onRevoke={() => revokeSessionMutation.mutate(session.token)}
                />
              ))}
            </div>

            {!hasOtherSessions ? (
              <p className="text-sm text-muted">
                <Trans>Nema drugih aktivnih sesija.</Trans>
              </p>
            ) : null}

            {hasOtherSessions ? (
              <div className="flex justify-start">
                <Button
                  variant="danger-soft"
                  isPending={revokeOtherSessionsMutation.isPending}
                  onPress={() => revokeOtherSessionsMutation.mutate()}
                >
                  <LuLogOut className="size-4" />
                  <Trans>Odjavi sve ostale sesije</Trans>
                </Button>
              </div>
            ) : null}
          </>
        ) : null}
      </Card.Content>
    </Card>
  );
}

function AccountSessionsSkeleton() {
  return (
    <div className="flex flex-col gap-3 overflow-hidden">
      <span className="sr-only">
        <Trans>Učitavanje sesija…</Trans>
      </span>
      {[0, 1].map((item) => (
        <section
          key={item}
          className="rounded-2xl border border-separator/70 bg-surface px-4 py-3 shadow-xs"
        >
          <div className="flex items-start gap-3">
            <Skeleton animationType="none" className="size-9 rounded-xl" />
            <div className="min-w-0 flex-1 space-y-3">
              <Skeleton
                animationType="none"
                className="h-4 w-40 rounded-full"
              />
              <Skeleton
                animationType="none"
                className="h-3 w-64 max-w-full rounded-full"
              />
              <Skeleton
                animationType="none"
                className="h-3 w-48 max-w-full rounded-full"
              />
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}

function AccountSessionsError() {
  return (
    <Alert status="danger">
      <Alert.Indicator />
      <Alert.Content>
        <Alert.Title>
          <Trans>Nije moguće učitati sesije</Trans>
        </Alert.Title>
        <Alert.Description>
          <Trans>Proverite internet vezu i pokušajte ponovo kasnije.</Trans>
        </Alert.Description>
      </Alert.Content>
    </Alert>
  );
}

interface AccountSessionRowProps {
  session: AccountSession;
  locale: Locale;
  isPending: boolean;
  onRevoke: () => void;
}

function AccountSessionRow({
  session,
  locale,
  isPending,
  onRevoke,
}: AccountSessionRowProps) {
  const { t } = useLingui();
  const intlLocale = INTL_LOCALES[locale];
  const deviceLabel = formatUserAgent(session.userAgent);

  return (
    <section className="grid gap-3 rounded-2xl border border-separator/70 bg-surface px-4 py-3 shadow-xs sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
      <div className="flex min-w-0 gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-surface-secondary text-muted">
          <LuLaptop className="size-4" />
        </div>
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-foreground">
              {session.isCurrent ? (
                <Trans>Trenutna sesija</Trans>
              ) : (
                <Trans>Druga sesija</Trans>
              )}
            </p>
            {session.isCurrent ? (
              <Chip size="sm" variant="soft" color="success">
                <LuCircleCheck className="size-3.5" />
                <Trans>Trenutna sesija</Trans>
              </Chip>
            ) : null}
          </div>

          <dl className="grid gap-1 text-sm text-muted">
            <div className="flex min-w-0 items-start gap-2">
              <LuGlobe className="mt-0.5 size-4 shrink-0" />
              <dt className="sr-only">
                <Trans>IP adresa</Trans>
              </dt>
              <dd className="min-w-0 wrap-break-word">
                {session.ipAddress ?? <Trans>IP adresa nije dostupna</Trans>}
              </dd>
            </div>
            <div className="flex min-w-0 items-start gap-2">
              <LuLaptop className="mt-0.5 size-4 shrink-0" />
              <dt className="sr-only">
                <Trans>Uređaj</Trans>
              </dt>
              <dd className="min-w-0 wrap-break-word">
                {deviceLabel ?? <Trans>Uređaj nije poznat</Trans>}
              </dd>
            </div>
            <div className="flex min-w-0 items-start gap-2">
              <LuClock className="mt-0.5 size-4 shrink-0" />
              <dt className="sr-only">
                <Trans>Kreirana</Trans>
              </dt>
              <dd className="min-w-0 wrap-break-word">
                <Trans>Kreirana:</Trans>{' '}
                {formatSessionTimestamp(session.createdAt, intlLocale) ?? (
                  <Trans>nije dostupna</Trans>
                )}
              </dd>
            </div>
            <div className="flex min-w-0 items-start gap-2">
              <LuClock className="mt-0.5 size-4 shrink-0" />
              <dt className="sr-only">
                <Trans>Ističe</Trans>
              </dt>
              <dd className="min-w-0 wrap-break-word">
                <Trans>Ističe:</Trans>{' '}
                {formatSessionTimestamp(session.expiresAt, intlLocale) ?? (
                  <Trans>nije dostupna</Trans>
                )}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {!session.isCurrent ? (
        <Button
          variant="danger-soft"
          className="w-full sm:w-auto"
          isDisabled={!session.token}
          isPending={isPending}
          onPress={onRevoke}
          aria-label={t`Odjavi ovu sesiju`}
        >
          <LuLogOut className="size-4" />
          <Trans>Odjavi ovu sesiju</Trans>
        </Button>
      ) : null}
    </section>
  );
}

function formatSessionTimestamp(
  timestamp: number | null,
  intlLocale: string,
): string | null {
  if (timestamp === null) return null;

  return new Intl.DateTimeFormat(intlLocale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(timestamp);
}

function formatUserAgent(userAgent: string | null): string | null {
  if (!userAgent) return null;

  const browser = getBrowserName(userAgent);
  const os = getOperatingSystemName(userAgent);

  if (browser && os) return `${browser} on ${os}`;
  if (browser) return browser;
  if (os) return os;

  return userAgent;
}

function getBrowserName(userAgent: string): string | null {
  const edge = userAgent.match(/Edg\/(\d+(?:\.\d+)?)/);
  if (edge) return `Edge ${edge[1]}`;

  const opera = userAgent.match(/OPR\/(\d+(?:\.\d+)?)/);
  if (opera) return `Opera ${opera[1]}`;

  const firefox = userAgent.match(/Firefox\/(\d+(?:\.\d+)?)/);
  if (firefox) return `Firefox ${firefox[1]}`;

  const chrome = userAgent.match(/Chrome\/(\d+(?:\.\d+)?)/);
  if (chrome && !userAgent.includes('Chromium')) return `Chrome ${chrome[1]}`;

  const chromium = userAgent.match(/Chromium\/(\d+(?:\.\d+)?)/);
  if (chromium) return `Chromium ${chromium[1]}`;

  const safari = userAgent.match(/Version\/(\d+(?:\.\d+)?).*Safari\//);
  if (safari) return `Safari ${safari[1]}`;

  return null;
}

function getOperatingSystemName(userAgent: string): string | null {
  if (/iPhone|iPad|iPod/.test(userAgent)) return 'iOS';
  if (userAgent.includes('Android')) return 'Android';
  if (userAgent.includes('Windows NT 10')) return 'Windows';
  if (userAgent.includes('Windows')) return 'Windows';
  if (userAgent.includes('Mac OS X')) return 'macOS';
  if (userAgent.includes('Linux')) return 'Linux';

  return null;
}

function AccountDataExportCard() {
  const { t } = useLingui();
  const exportMutation = useMutation({
    mutationFn: buildAccountExport,
    onSuccess: (data) => {
      downloadJson(exportFilename('autokpo-account'), data);
    },
    onError: () => {
      toast.danger(
        t`Nije moguće preuzeti podatke naloga. Proverite internet vezu i pokušajte ponovo.`,
      );
    },
  });

  return (
    <Card>
      <Card.Header>
        <Card.Title>
          <Trans>Vaši podaci</Trans>
        </Card.Title>
        <Card.Description>
          <Trans>Preuzmite kopiju podataka vašeg naloga.</Trans>
        </Card.Description>
      </Card.Header>
      <Card.Content>
        <Button
          variant="secondary"
          isPending={exportMutation.isPending}
          onPress={() => exportMutation.mutate()}
        >
          <LuDownload />
          <Trans>Izvezi podatke naloga</Trans>
        </Button>
      </Card.Content>
    </Card>
  );
}

interface DeleteAccountModalProps {
  account: AccountProfile;
  isOnline: boolean;
  isOpen: boolean;
  onClose: () => void;
}

function DeleteAccountModal({
  account,
  isOnline,
  isOpen,
  onClose,
}: DeleteAccountModalProps) {
  const { t } = useLingui();
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const accountEmail = account.email ?? '';
  const canConfirmDelete =
    isOnline && accountEmail.length > 0 && deleteConfirmation === accountEmail;

  const deleteMutation = useMutation({
    mutationFn: deleteAccount,
    onError: () => {
      toast.danger(
        t`Nije moguće obrisati nalog. Proverite internet vezu i pokušajte ponovo.`,
      );
    },
  });

  function handleClose() {
    if (deleteMutation.isPending) return;
    onClose();
    setDeleteConfirmation('');
    deleteMutation.reset();
  }

  return (
    <Modal.Backdrop
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) handleClose();
      }}
      isDismissable={!deleteMutation.isPending}
      isKeyboardDismissDisabled={deleteMutation.isPending}
    >
      <Modal.Container>
        <Modal.Dialog className="sm:max-w-md">
          <Modal.Header>
            <Modal.Heading>
              <Trans>Obriši nalog?</Trans>
            </Modal.Heading>
          </Modal.Header>
          <Modal.Body>
            <div className="flex flex-col gap-4">
              <p>
                <Trans>
                  Ova radnja trajno briše vaš AutoKPO nalog i sve sinhronizovane
                  podatke. Lokalni podaci na ovom uređaju biće uklonjeni nakon
                  odjave.
                </Trans>
              </p>
              <p className="font-medium text-danger">
                <Trans>Ova radnja se ne može opozvati.</Trans>
              </p>

              <div className="flex flex-col gap-1 rounded-xl border border-danger/30 bg-danger-soft/40 px-3 py-2 text-sm">
                <p className="text-muted">
                  <Trans>Za potvrdu unesite email adresu naloga:</Trans>
                </p>
                <p className="font-mono font-semibold text-foreground">
                  {account.email ?? account.id}
                </p>
              </div>

              <div className="flex flex-col gap-1.5 rounded-xl border border-separator/70 bg-surface p-4">
                <Label htmlFor="delete-account-email-confirmation">
                  {t`Email adresa`}
                </Label>
                <Input
                  id="delete-account-email-confirmation"
                  fullWidth
                  autoComplete="off"
                  type="text"
                  value={deleteConfirmation}
                  onChange={(event) =>
                    setDeleteConfirmation(event.currentTarget.value)
                  }
                  placeholder={accountEmail}
                  disabled={deleteMutation.isPending}
                />
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onPress={handleClose}
              isDisabled={deleteMutation.isPending}
            >
              <Trans>Otkaži</Trans>
            </Button>
            <Button
              variant="danger"
              isDisabled={!canConfirmDelete}
              isPending={deleteMutation.isPending}
              onPress={() => deleteMutation.mutate()}
            >
              <Trans>Obriši nalog</Trans>
            </Button>
          </Modal.Footer>
          <Modal.CloseTrigger />
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}

interface AccountProfileSectionProps {
  account: AccountProfile;
  dirty: boolean;
  onAccountChanged: () => Promise<unknown>;
  onDeleteRequest: () => void;
}

function AccountProfileSection({
  account,
  dirty,
  onAccountChanged,
  onDeleteRequest,
}: AccountProfileSectionProps) {
  const { t } = useLingui();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const isCropModalOpen = selectedImageUrl !== null;

  useEffect(() => {
    return () => {
      if (selectedImageUrl) URL.revokeObjectURL(selectedImageUrl);
    };
  }, [selectedImageUrl]);

  const uploadMutation = useMutation({
    mutationFn: uploadProfileImage,
    onSuccess: () => {
      toast.success(t`Profilna slika je sačuvana.`);
      closeCropModal();
      void onAccountChanged();
    },
    onError: () => {
      toast.danger(t`Nije moguće sačuvati profilnu sliku. Pokušajte ponovo.`);
    },
  });
  const removeMutation = useMutation({
    mutationFn: removeProfileImage,
    onSuccess: () => {
      toast.success(t`Profilna slika je uklonjena.`);
      void onAccountChanged();
    },
    onError: () => {
      toast.danger(t`Nije moguće ukloniti profilnu sliku. Pokušajte ponovo.`);
    },
  });

  function openFileDialog() {
    if (uploadMutation.isPending || removeMutation.isPending) return;
    fileInputRef.current?.click();
  }

  function handleFileSelected(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = '';
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.danger(t`Izaberite JPEG, PNG ili WebP sliku.`);
      return;
    }

    closeCropModal();
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    setSelectedImageUrl(URL.createObjectURL(file));
  }

  function closeCropModal() {
    if (selectedImageUrl) URL.revokeObjectURL(selectedImageUrl);
    setSelectedImageUrl(null);
    setCroppedAreaPixels(null);
  }

  async function saveCroppedImage() {
    if (!selectedImageUrl || !croppedAreaPixels) return;

    try {
      const blob = await exportCroppedAvatar(
        selectedImageUrl,
        croppedAreaPixels,
      );
      if (blob.size > AVATAR_UPLOAD_MAX_BYTES) {
        toast.danger(t`Profilna slika mora biti manja od 256 KB.`);
        return;
      }
      uploadMutation.mutate(blob);
    } catch {
      toast.danger(t`Nije moguće pripremiti profilnu sliku za slanje.`);
    }
  }

  return (
    <section className="grid gap-3 rounded-2xl border border-separator/70 bg-surface px-4 py-3 shadow-xs sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
      <div className="flex min-w-0 items-center gap-3">
        <div className="group relative size-10 shrink-0">
          <input
            ref={fileInputRef}
            data-testid="profile-image-input"
            className="hidden"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileSelected}
          />
          <Dropdown>
            <Button
              isIconOnly
              variant="ghost"
              aria-label={t`Uredi profilnu sliku`}
              className="size-10 rounded-full p-0"
              isDisabled={uploadMutation.isPending || removeMutation.isPending}
            >
              <UserAvatar
                userId={account.id}
                email={account.email}
                image={account.image}
                size="md"
                className="size-10 transition-transform group-hover:scale-105"
              />
            </Button>
            <span className="pointer-events-none absolute right-0 bottom-0 flex size-4 items-center justify-center rounded-full bg-foreground/90 text-background shadow-sm">
              <LuPencil className="size-2.5" />
            </span>
            <Dropdown.Popover>
              <Dropdown.Menu
                onAction={(key) => {
                  if (key === 'change') openFileDialog();
                  if (key === 'remove') removeMutation.mutate();
                }}
              >
                <Dropdown.Item
                  id="change"
                  textValue={t`Promeni profilnu sliku`}
                >
                  <Label>
                    <Trans>Promeni profilnu sliku</Trans>
                  </Label>
                </Dropdown.Item>
                {account.image ? (
                  <Dropdown.Item
                    id="remove"
                    variant="danger"
                    textValue={t`Ukloni profilnu sliku`}
                  >
                    <Label>
                      <Trans>Ukloni profilnu sliku</Trans>
                    </Label>
                  </Dropdown.Item>
                ) : null}
              </Dropdown.Menu>
            </Dropdown.Popover>
          </Dropdown>
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-medium tracking-[0.08em] text-muted uppercase">
            <Trans>Nalog</Trans>
          </p>
          <p className="truncate text-sm font-semibold text-foreground">
            {account.email ?? account.id}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Chip size="sm" variant="soft" color="success">
          <LuWifi className="size-3.5" />
          <Trans>Online</Trans>
        </Chip>

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

      <Button
        variant="danger-soft"
        className="w-full max-sm:mt-1 sm:col-start-2 sm:row-start-1 sm:w-auto sm:self-start"
        onPress={onDeleteRequest}
      >
        <LuTrash className="size-4" />
        <Trans>Obriši nalog</Trans>
      </Button>

      <Modal.Backdrop
        isOpen={isCropModalOpen}
        onOpenChange={(open) => {
          if (!open) closeCropModal();
        }}
        isDismissable={!uploadMutation.isPending}
        isKeyboardDismissDisabled={uploadMutation.isPending}
      >
        <Modal.Container>
          <Modal.Dialog className="sm:max-w-md">
            <Modal.Header>
              <Modal.Heading>
                <Trans>Uredi profilnu sliku</Trans>
              </Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              {selectedImageUrl ? (
                <div className="relative h-72 overflow-hidden rounded-2xl bg-surface-secondary">
                  <Cropper
                    image={selectedImageUrl}
                    crop={crop}
                    zoom={zoom}
                    aspect={1}
                    cropShape="round"
                    onCropChange={setCrop}
                    onZoomChange={setZoom}
                    onCropComplete={(_, areaPixels) => {
                      setCroppedAreaPixels(areaPixels);
                    }}
                  />
                </div>
              ) : null}
              <p className="text-sm text-muted">
                <Trans>
                  Pomerite i zumirajte sliku da izaberete deo koji će se
                  prikazivati kao profilna slika.
                </Trans>
              </p>
            </Modal.Body>
            <Modal.Footer>
              <Button
                variant="secondary"
                isDisabled={uploadMutation.isPending}
                onPress={closeCropModal}
              >
                <Trans>Otkaži</Trans>
              </Button>
              <Button
                isPending={uploadMutation.isPending}
                onPress={() => void saveCroppedImage()}
              >
                <Trans>Sačuvaj sliku</Trans>
              </Button>
            </Modal.Footer>
            <Modal.CloseTrigger />
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </section>
  );
}

const AVATAR_EXPORT_SIZE = 512;
const AVATAR_UPLOAD_MAX_BYTES = 256 * 1024;

async function exportCroppedAvatar(
  imageUrl: string,
  area: Area,
): Promise<Blob> {
  const image = await loadImage(imageUrl);
  const canvas = document.createElement('canvas');
  canvas.width = AVATAR_EXPORT_SIZE;
  canvas.height = AVATAR_EXPORT_SIZE;

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Canvas is not available.');
  }

  context.drawImage(
    image,
    area.x,
    area.y,
    area.width,
    area.height,
    0,
    0,
    AVATAR_EXPORT_SIZE,
    AVATAR_EXPORT_SIZE,
  );

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, 'image/webp', 0.82);
  });

  if (!blob || blob.type !== 'image/webp') {
    throw new Error('WebP export is not available.');
  }

  return blob;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Image failed to load.'));
    image.src = src;
  });
}
