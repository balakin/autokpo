import {
  Button,
  Card,
  Description,
  Label,
  Modal,
  Radio,
  RadioGroup,
  Spinner,
} from '@heroui/react';
import { Trans, useLingui } from '@lingui/react/macro';
import { useEffect, useState } from 'react';

import { useAuth } from '../auth/use-auth';
import { useEncryptionContext } from '../e2ee/encryption-context';
import {
  generateLdk,
  unwrapMekWithPin,
  wrapMekWithLdk,
  wrapMekWithPin,
} from '../e2ee/encryption-crypto';
import { WRAPPING_PARAMS_V1 } from '../e2ee/key-ring-record';
import { KeysIndexeddb, type LocalWrapperRecord } from '../e2ee/keys-indexeddb';
import { PinInput } from '../e2ee/pin-input';
import { SetPinModal } from '../e2ee/set-pin-modal';

type LocalMethod = 'ldk' | 'pin' | null;

export function SecuritySettingsPage() {
  const { t } = useLingui();
  const auth = useAuth();
  const { mek } = useEncryptionContext();
  const userId = auth.user?.id ?? '';

  const [method, setMethod] = useState<LocalMethod>(null);
  const [loading, setLoading] = useState(true);
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [pinModalSubmitting, setPinModalSubmitting] = useState(false);
  const [switchingToLdk, setSwitchingToLdk] = useState(false);
  const [pendingPin, setPendingPin] = useState(false);

  const [confirmRemoveOpen, setConfirmRemoveOpen] = useState(false);
  const [confirmRemovePin, setConfirmRemovePin] = useState('');
  const [confirmRemoveError, setConfirmRemoveError] = useState('');
  const [confirmRemoveSubmitting, setConfirmRemoveSubmitting] = useState(false);
  const [confirmRemoveKey, setConfirmRemoveKey] = useState(0);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    const store = new KeysIndexeddb();
    void store.whenReady.then(async () => {
      const wrapper = await store.readLocalWrapper(userId);
      if (!cancelled) {
        setMethod(wrapperMethod(wrapper));
        setLoading(false);
      }
      store.close();
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  async function handleSetPin(pin: string) {
    if (!userId) return;
    setPinModalSubmitting(true);
    try {
      const wrapperId = crypto.randomUUID();
      const {
        pinLdk,
        pinSaltCiphertext,
        pinSaltIv,
        kdfParams,
        ciphertext,
        wrappingIv,
      } = await wrapMekWithPin(mek, pin, userId, wrapperId);
      const store = new KeysIndexeddb();
      await store.whenReady;
      await store.writeLocalWrapper({
        userId,
        method: 'pin',
        wrapperId,
        pinLdk,
        pinSaltCiphertext,
        pinSaltIv,
        pinEncryptionVersion: 1,
        pinEncryptionAlgorithm: 'aes-256-gcm',
        pinEncryptionParams: WRAPPING_PARAMS_V1,
        kdfAlgorithm: 'argon2id',
        kdfVersion: 1,
        kdfParams,
        wrappingAlgorithm: 'aes-256-gcm',
        wrappingVersion: 1,
        wrappingParams: WRAPPING_PARAMS_V1,
        ciphertext,
        wrappingIv,
        createdAt: new Date().toISOString(),
        failedAttempts: 0,
      });
      store.close();
      setMethod('pin');
      setPinModalOpen(false);
      setPendingPin(false);
    } finally {
      setPinModalSubmitting(false);
    }
  }

  async function handleSwitchToLdk() {
    if (!userId) return;
    setSwitchingToLdk(true);
    try {
      const ldk = await generateLdk();
      const wrapperId = crypto.randomUUID();
      const { ciphertext, iv } = await wrapMekWithLdk(
        mek,
        ldk,
        userId,
        wrapperId,
      );
      const store = new KeysIndexeddb();
      await store.whenReady;
      await store.writeLocalWrapper({
        userId,
        method: 'ldk',
        wrapperId,
        ldk,
        ciphertext,
        wrappingIv: iv,
      });
      store.close();
      setMethod('ldk');
    } finally {
      setSwitchingToLdk(false);
    }
  }

  async function handleConfirmRemove(pin: string) {
    setConfirmRemoveSubmitting(true);
    try {
      const store = new KeysIndexeddb();
      await store.whenReady;
      const wrapper = await store.readLocalWrapper(userId);
      store.close();
      if (!wrapper || wrapper.method !== 'pin') {
        setConfirmRemoveOpen(false);
        await handleSwitchToLdk();
        return;
      }
      await unwrapMekWithPin(wrapper, pin);
      setConfirmRemoveOpen(false);
      await handleSwitchToLdk();
    } catch {
      setConfirmRemoveError(t`Pogrešan PIN. Pokušajte ponovo.`);
      setConfirmRemovePin('');
      setConfirmRemoveKey((k) => k + 1);
    } finally {
      setConfirmRemoveSubmitting(false);
    }
  }

  function handleRadioChange(next: string) {
    if (next === 'pin') {
      setPendingPin(true);
      setPinModalOpen(true);
    } else if (method === 'pin') {
      setConfirmRemoveOpen(true);
    }
  }

  function handlePinModalOpenChange(open: boolean) {
    if (!open) setPendingPin(false);
    setPinModalOpen(open);
  }

  function handleConfirmRemoveOpenChange(open: boolean) {
    if (!open) {
      setConfirmRemovePin('');
      setConfirmRemoveError('');
    }
    setConfirmRemoveOpen(open);
  }

  const radioValue = pendingPin || method === 'pin' ? 'pin' : 'none';

  return (
    <>
      <SetPinModal
        isOpen={pinModalOpen}
        isSubmitting={pinModalSubmitting}
        onOpenChange={handlePinModalOpenChange}
        onSubmit={(pin) => void handleSetPin(pin)}
      />

      <Modal.Backdrop
        isOpen={confirmRemoveOpen}
        onOpenChange={handleConfirmRemoveOpenChange}
      >
        <Modal.Container size="sm">
          <Modal.Dialog>
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>
                <Trans>Ukloni PIN kod</Trans>
              </Modal.Heading>
              <p className="mt-1.5 text-sm/5 text-muted">
                <Trans>Unesite trenutni PIN kod da biste potvrdili.</Trans>
              </p>
            </Modal.Header>
            <Modal.Body className="overflow-x-hidden p-6">
              <div className="flex flex-col gap-1.5">
                <PinInput
                  key={confirmRemoveKey}
                  aria-describedby={
                    confirmRemoveError ? 'remove-pin-error' : undefined
                  }
                  aria-label={t`PIN kod`}
                  autoFocus
                  isDisabled={confirmRemoveSubmitting}
                  isInvalid={!!confirmRemoveError}
                  value={confirmRemovePin}
                  onChange={setConfirmRemovePin}
                  onComplete={(pin) => void handleConfirmRemove(pin)}
                />
                {!!confirmRemoveError && (
                  <span
                    data-visible="true"
                    className="text-sm text-danger"
                    id="remove-pin-error"
                  >
                    {confirmRemoveError}
                  </span>
                )}
              </div>
            </Modal.Body>
            <Modal.Footer>
              <Button
                isDisabled={confirmRemoveSubmitting}
                slot="close"
                variant="secondary"
              >
                <Trans>Otkaži</Trans>
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>

      <div className="flex flex-col gap-6">
        <Card className="border-border bg-surface">
          <Card.Header>
            <Card.Title className="text-base font-semibold">
              <Trans>Lokalno otključavanje</Trans>
            </Card.Title>
            <Card.Description>
              <Trans>
                Izaberite kako otključavate šifrovane podatke pri svakom
                pokretanju aplikacije.
              </Trans>
            </Card.Description>
          </Card.Header>
          <Card.Content className="gap-4">
            {loading ? (
              <div className="flex items-center gap-2 text-muted">
                <Spinner color="current" size="sm" />
              </div>
            ) : (
              <RadioGroup
                isDisabled={
                  switchingToLdk ||
                  pinModalSubmitting ||
                  confirmRemoveSubmitting
                }
                name="local-unlock"
                value={radioValue}
                onChange={handleRadioChange}
              >
                <Radio value="none">
                  <Radio.Control>
                    <Radio.Indicator />
                  </Radio.Control>
                  <Radio.Content>
                    <Label>{t`Ništa`}</Label>
                    <Description>
                      {t`Aplikacija se otključava bez interakcije pri svakom pokretanju.`}
                    </Description>
                  </Radio.Content>
                </Radio>
                <Radio value="pin">
                  <Radio.Control>
                    <Radio.Indicator />
                  </Radio.Control>
                  <Radio.Content>
                    <Label>{t`PIN kod`}</Label>
                    <Description>
                      {t`Pri svakom pokretanju unosite 6-cifreni PIN kod.`}
                    </Description>
                  </Radio.Content>
                </Radio>
              </RadioGroup>
            )}
          </Card.Content>
        </Card>
      </div>
    </>
  );
}

function wrapperMethod(wrapper: LocalWrapperRecord | null): LocalMethod {
  if (!wrapper) return 'ldk';
  return wrapper.method === 'pin' ? 'pin' : 'ldk';
}
