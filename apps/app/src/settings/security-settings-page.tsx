import {
  Button,
  Card,
  Description,
  FieldError,
  Form,
  InputGroup,
  Label,
  Modal,
  Radio,
  RadioGroup,
  Separator,
  Spinner,
  TextField,
  toast,
} from '@heroui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Trans, useLingui } from '@lingui/react/macro';
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

import { useAuth } from '../auth/use-auth';
import { useEncryptionContext } from '../e2ee/encryption-context';
import {
  createPasswordWrapperPayload,
  generateLdk,
  unwrapKeyRingProfile,
  unwrapMekWithPin,
  wrapMekWithLdk,
  wrapMekWithPin,
} from '../e2ee/encryption-crypto';
import {
  changeMasterPassword,
  fetchKeyRingProfile,
  KeyRingConflictError,
} from '../e2ee/key-ring-api';
import { WRAPPING_PARAMS_V1 } from '../e2ee/key-ring-record';
import { KeysIndexeddb, type LocalWrapperRecord } from '../e2ee/keys-indexeddb';
import { PinInput } from '../e2ee/pin-input';
import { SetPinModal } from '../e2ee/set-pin-modal';

type LocalMethod = 'ldk' | 'pin' | null;

type PinSubmitResult = { ok: true } | { ok: false; message: string };

type VerificationPayload =
  | { method: 'pin'; pin: string }
  | { method: 'password'; password: string };

type VerificationResult =
  | { ok: true }
  | { ok: false; message: string; lockout?: boolean };

function createChangePasswordSchema(t: ReturnType<typeof useLingui>['t']) {
  return z
    .object({
      password: z
        .string()
        .min(1, t`Unesite šifru za šifrovanje.`)
        .min(8, t`Šifra mora imati najmanje 8 znakova.`),
      confirmation: z.string(),
    })
    .refine((values) => values.password === values.confirmation, {
      path: ['confirmation'],
      message: t`Šifra i potvrda se ne poklapaju.`,
    });
}

type ChangePasswordFormData = z.infer<
  ReturnType<typeof createChangePasswordSchema>
>;

type PinFormData = { pin: string };
type VerifyPasswordFormData = { password: string };

export function SecuritySettingsPage() {
  const { t } = useLingui();
  const auth = useAuth();
  const { mek, clearEncryptionSession, refreshKeyRingProfile } =
    useEncryptionContext();
  const userId = auth.user?.id ?? '';

  const [method, setMethod] = useState<LocalMethod>(null);
  const [loading, setLoading] = useState(true);
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [pinModalSubmitting, setPinModalSubmitting] = useState(false);
  const [switchingToLdk, setSwitchingToLdk] = useState(false);
  const [pendingPin, setPendingPin] = useState(false);

  const [confirmRemoveOpen, setConfirmRemoveOpen] = useState(false);

  const [newPasswordModalOpen, setNewPasswordModalOpen] = useState(false);
  const verifyAttemptsRef = useRef(0);

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

  async function handleConfirmRemove(pin: string): Promise<PinSubmitResult> {
    try {
      const store = new KeysIndexeddb();
      await store.whenReady;
      const wrapper = await store.readLocalWrapper(userId);
      store.close();
      if (!wrapper || wrapper.method !== 'pin') {
        await handleSwitchToLdk();
        return { ok: true };
      }
      await unwrapMekWithPin(wrapper, pin);
      await handleSwitchToLdk();
      return { ok: true };
    } catch {
      return { ok: false, message: t`Pogrešan PIN. Pokušajte ponovo.` };
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

  function resetPasswordModal() {
    verifyAttemptsRef.current = 0;
  }

  async function handleVerificationFailure(
    message: string,
  ): Promise<VerificationResult> {
    const nextAttempts = verifyAttemptsRef.current + 1;
    verifyAttemptsRef.current = nextAttempts;
    if (nextAttempts >= 10) {
      const store = new KeysIndexeddb();
      await store.whenReady;
      const wrapper = await store.readLocalWrapper(userId);
      if (wrapper?.method === 'pin') await store.deleteLocalWrapper(userId);
      store.close();
      setNewPasswordModalOpen(false);
      clearEncryptionSession();
      return { ok: false, message, lockout: true };
    }
    return { ok: false, message };
  }

  async function handleVerifyCredential(
    payload: VerificationPayload,
  ): Promise<VerificationResult> {
    if (!userId) return { ok: false, message: t`Korisnik nije prijavljen.` };
    try {
      if (payload.method === 'pin') {
        const store = new KeysIndexeddb();
        await store.whenReady;
        const wrapper = await store.readLocalWrapper(userId);
        if (!wrapper || wrapper.method !== 'pin') {
          store.close();
          verifyAttemptsRef.current = 0;
          return { ok: true };
        }
        await unwrapMekWithPin(wrapper, payload.pin);
        await store.updatePinFailedAttempts(userId, 0);
        store.close();
        verifyAttemptsRef.current = 0;
        return { ok: true };
      }

      const profile = await fetchKeyRingProfile();
      await unwrapKeyRingProfile(payload.password, profile);
      verifyAttemptsRef.current = 0;
      return { ok: true };
    } catch {
      return handleVerificationFailure(
        payload.method === 'pin'
          ? t`Pogrešan PIN. Pokušajte ponovo.`
          : t`Pogrešna šifra. Pokušajte ponovo.`,
      );
    }
  }

  async function handleChangeMasterPassword(password: string) {
    try {
      const profile = await fetchKeyRingProfile();
      const wrapper = profile.wrappers.find(
        (item) => item.method === 'password',
      );
      if (!wrapper) throw new Error('Missing password wrapper');
      const request = await createPasswordWrapperPayload(
        userId,
        wrapper.id,
        mek,
        password,
      );
      await changeMasterPassword(request);
      await refreshKeyRingProfile();
      setNewPasswordModalOpen(false);
      resetPasswordModal();
      toast.success(t`Šifra za šifrovanje je promenjena.`);
    } catch (error) {
      if (isKeyRingConflictError(error)) {
        await refreshKeyRingProfile().catch(() => undefined);
        setNewPasswordModalOpen(false);
        clearEncryptionSession();
        return;
      }
      toast.danger(t`Nije moguće promeniti šifru. Pokušajte ponovo.`);
    }
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

      <ConfirmRemovePinModal
        isOpen={confirmRemoveOpen}
        onConfirm={handleConfirmRemove}
        onOpenChange={setConfirmRemoveOpen}
      />

      <ChangeMasterPasswordModal
        isOpen={newPasswordModalOpen}
        onOpenChange={setNewPasswordModalOpen}
        onSubmit={handleChangeMasterPassword}
      />

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
                isDisabled={switchingToLdk || pinModalSubmitting}
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

        <Separator />

        <Card className="border-border bg-surface">
          <Card.Header>
            <Card.Title className="text-base font-semibold">
              <Trans>Šifra za šifrovanje</Trans>
            </Card.Title>
            <Card.Description>
              <Trans>
                Promenite glavnu šifru. Podaci neće biti ponovo šifrovani.
              </Trans>
            </Card.Description>
          </Card.Header>
          <Card.Content>
            <ChangePasswordVerificationModal
              method={method === 'pin' ? 'pin' : 'password'}
              onVerified={() => setNewPasswordModalOpen(true)}
              onVerify={handleVerifyCredential}
            >
              <Button variant="secondary" onPress={resetPasswordModal}>
                <Trans>Promeni šifru</Trans>
              </Button>
            </ChangePasswordVerificationModal>
          </Card.Content>
        </Card>
      </div>
    </>
  );
}

function isKeyRingConflictError(error: unknown): error is KeyRingConflictError {
  return (
    error instanceof KeyRingConflictError ||
    (error instanceof Error && error.name === 'KeyRingConflictError')
  );
}

function ConfirmRemovePinModal({
  isOpen,
  onOpenChange,
  onConfirm,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (pin: string) => Promise<PinSubmitResult>;
}) {
  const { t } = useLingui();
  const [inputKey, setInputKey] = useState(0);
  const { control, handleSubmit, setValue, setError, reset, formState } =
    useForm<PinFormData>({ defaultValues: { pin: '' } });

  function handleOpenChange(open: boolean) {
    if (!open) reset({ pin: '' });
    onOpenChange(open);
  }

  async function submitPin({ pin }: PinFormData) {
    const result = await onConfirm(pin);
    if (result.ok) {
      reset({ pin: '' });
      onOpenChange(false);
      return;
    }
    reset({ pin: '' });
    setInputKey((value) => value + 1);
    setError('pin', { message: result.message });
  }

  return (
    <Modal.Backdrop isOpen={isOpen} onOpenChange={handleOpenChange}>
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
            <Form
              onSubmit={(event) => {
                event.preventDefault();
                void handleSubmit(submitPin)();
              }}
            >
              <Controller
                control={control}
                name="pin"
                render={({ field, fieldState }) => (
                  <div className="flex flex-col gap-1.5">
                    <PinInput
                      key={inputKey}
                      aria-describedby={
                        fieldState.error ? 'remove-pin-error' : undefined
                      }
                      aria-label={t`PIN kod`}
                      autoFocus
                      isDisabled={formState.isSubmitting}
                      isInvalid={!!fieldState.error}
                      value={field.value}
                      onChange={(value) => {
                        field.onChange(value);
                        if (fieldState.error) reset({ pin: value });
                      }}
                      onComplete={(pin) => {
                        if (formState.isSubmitting) return;
                        setValue('pin', pin);
                        void handleSubmit(submitPin)();
                      }}
                    />
                    {!!fieldState.error?.message && (
                      <span
                        data-visible="true"
                        className="text-sm text-danger"
                        id="remove-pin-error"
                      >
                        {fieldState.error.message}
                      </span>
                    )}
                  </div>
                )}
              />
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button
              isDisabled={formState.isSubmitting}
              slot="close"
              variant="secondary"
            >
              <Trans>Otkaži</Trans>
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}

function ChangeMasterPasswordModal({
  isOpen,
  onOpenChange,
  onSubmit,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (password: string) => Promise<void>;
}) {
  const { t } = useLingui();
  const formId = useId();
  const { control, handleSubmit, reset, formState } =
    useForm<ChangePasswordFormData>({
      resolver: zodResolver(createChangePasswordSchema(t)),
      defaultValues: { password: '', confirmation: '' },
    });

  function handleOpenChange(open: boolean) {
    if (!open) reset({ password: '', confirmation: '' });
    onOpenChange(open);
  }

  async function submitPassword(data: ChangePasswordFormData) {
    await onSubmit(data.password);
  }

  return (
    <Modal.Backdrop isOpen={isOpen} onOpenChange={handleOpenChange}>
      <Modal.Container size="sm">
        <Modal.Dialog>
          <Modal.CloseTrigger />
          <Modal.Header>
            <Modal.Heading>
              <Trans>Promenite šifru za šifrovanje</Trans>
            </Modal.Heading>
            <p className="mt-1.5 text-sm/5 text-muted">
              <Trans>
                Promena utiče samo na šifru kojom se otključavaju podaci sa
                servera. Lokalni PIN ili automatsko otključavanje ostaju isti.
              </Trans>
            </p>
          </Modal.Header>
          <Modal.Body className="overflow-x-hidden p-6">
            <Form
              id={formId}
              className="flex flex-col gap-4"
              onSubmit={(event) => {
                event.preventDefault();
                void handleSubmit(submitPassword)();
              }}
            >
              <Controller
                control={control}
                name="password"
                render={({ field, fieldState }) => (
                  <TextField fullWidth isInvalid={!!fieldState.error}>
                    <Label>{t`Nova šifra`}</Label>
                    <InputGroup fullWidth>
                      <InputGroup.Input
                        {...field}
                        autoComplete="new-password"
                        autoFocus
                        disabled={formState.isSubmitting}
                        type="password"
                      />
                    </InputGroup>
                    {!!fieldState.error?.message && (
                      <FieldError>{fieldState.error.message}</FieldError>
                    )}
                  </TextField>
                )}
              />
              <Controller
                control={control}
                name="confirmation"
                render={({ field, fieldState }) => (
                  <TextField fullWidth isInvalid={!!fieldState.error}>
                    <Label>{t`Potvrdite novu šifru`}</Label>
                    <InputGroup fullWidth>
                      <InputGroup.Input
                        {...field}
                        autoComplete="new-password"
                        disabled={formState.isSubmitting}
                        type="password"
                      />
                    </InputGroup>
                    {!!fieldState.error?.message && (
                      <FieldError>{fieldState.error.message}</FieldError>
                    )}
                  </TextField>
                )}
              />
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button
              isDisabled={formState.isSubmitting}
              slot="close"
              variant="secondary"
            >
              <Trans>Otkaži</Trans>
            </Button>
            <Button
              form={formId}
              isPending={formState.isSubmitting}
              type="submit"
            >
              <Trans>Promeni šifru</Trans>
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}

function ChangePasswordVerificationModal({
  children,
  method,
  onVerify,
  onVerified,
}: {
  children: ReactNode;
  method: 'pin' | 'password';
  onVerify: (payload: VerificationPayload) => Promise<VerificationResult>;
  onVerified: () => void;
}) {
  return (
    <Modal>
      {children}
      <Modal.Backdrop>
        <Modal.Container size="sm">
          <Modal.Dialog>
            {({ close }) => (
              <ChangePasswordVerificationDialog
                close={close}
                method={method}
                onVerified={onVerified}
                onVerify={onVerify}
              />
            )}
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}

function ChangePasswordVerificationDialog({
  close,
  method,
  onVerify,
  onVerified,
}: {
  close: () => void;
  method: 'pin' | 'password';
  onVerify: (payload: VerificationPayload) => Promise<VerificationResult>;
  onVerified: () => void;
}) {
  const { t } = useLingui();
  const formId = useId();
  const [pinInputKey, setPinInputKey] = useState(0);
  const pinForm = useForm<PinFormData>({ defaultValues: { pin: '' } });
  const passwordForm = useForm<VerifyPasswordFormData>({
    defaultValues: { password: '' },
  });

  function handleSuccess() {
    pinForm.reset({ pin: '' });
    passwordForm.reset({ password: '' });
    close();
    onVerified();
  }

  async function submitPin({ pin }: PinFormData) {
    const result = await onVerify({ method: 'pin', pin });
    if (result.ok) {
      handleSuccess();
      return;
    }
    pinForm.reset({ pin: '' });
    setPinInputKey((value) => value + 1);
    pinForm.setError('pin', { message: result.message });
    if (result.lockout) close();
  }

  async function submitPassword({ password }: VerifyPasswordFormData) {
    const result = await onVerify({ method: 'password', password });
    if (result.ok) {
      handleSuccess();
      return;
    }
    passwordForm.reset({ password: '' });
    passwordForm.setError('password', { message: result.message });
    if (result.lockout) close();
  }

  const pinError = pinForm.formState.errors.pin?.message;

  return (
    <>
      <Modal.CloseTrigger />
      <Modal.Header>
        <Modal.Heading>
          <Trans>Potvrdite promenu šifre</Trans>
        </Modal.Heading>
        <p className="mt-1.5 text-sm/5 text-muted">
          {method === 'pin' ? (
            <Trans>Unesite PIN kod da biste nastavili.</Trans>
          ) : (
            <Trans>Unesite trenutnu šifru da biste nastavili.</Trans>
          )}
        </p>
      </Modal.Header>
      <Modal.Body className="overflow-x-hidden p-6">
        {method === 'pin' ? (
          <Form
            onSubmit={(event) => {
              event.preventDefault();
              void pinForm.handleSubmit(submitPin)();
            }}
          >
            <Controller
              control={pinForm.control}
              name="pin"
              render={({ field }) => (
                <div className="flex flex-col gap-2">
                  <Label>{t`Unesite PIN kod`}</Label>
                  <PinInput
                    key={pinInputKey}
                    aria-describedby={
                      pinError ? 'change-password-verify-error' : undefined
                    }
                    aria-label={t`PIN kod`}
                    autoFocus
                    isDisabled={pinForm.formState.isSubmitting}
                    isInvalid={!!pinError}
                    value={field.value}
                    onChange={(value) => {
                      field.onChange(value);
                      if (pinError) pinForm.clearErrors('pin');
                    }}
                    onComplete={(pin) => {
                      if (pinForm.formState.isSubmitting) return;
                      pinForm.setValue('pin', pin);
                      void pinForm.handleSubmit(submitPin)();
                    }}
                  />
                  {!!pinError && (
                    <span
                      data-visible="true"
                      className="text-sm text-danger"
                      id="change-password-verify-error"
                    >
                      {pinError}
                    </span>
                  )}
                </div>
              )}
            />
          </Form>
        ) : (
          <Form
            id={formId}
            className="flex flex-col gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              void passwordForm.handleSubmit(submitPassword)();
            }}
          >
            <Controller
              control={passwordForm.control}
              name="password"
              render={({ field, fieldState }) => (
                <TextField fullWidth isInvalid={!!fieldState.error}>
                  <Label>{t`Trenutna šifra`}</Label>
                  <InputGroup fullWidth>
                    <InputGroup.Input
                      {...field}
                      autoComplete="current-password"
                      autoFocus
                      disabled={passwordForm.formState.isSubmitting}
                      type="password"
                      onChange={(event) => {
                        field.onChange(event);
                        if (fieldState.error)
                          passwordForm.clearErrors('password');
                      }}
                    />
                  </InputGroup>
                  {!!fieldState.error?.message && (
                    <FieldError>{fieldState.error.message}</FieldError>
                  )}
                </TextField>
              )}
            />
          </Form>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button
          isDisabled={
            pinForm.formState.isSubmitting ||
            passwordForm.formState.isSubmitting
          }
          slot="close"
          variant="secondary"
        >
          <Trans>Otkaži</Trans>
        </Button>
        {method !== 'pin' && (
          <Button
            form={formId}
            isPending={passwordForm.formState.isSubmitting}
            type="submit"
          >
            <Trans>Potvrdi</Trans>
          </Button>
        )}
      </Modal.Footer>
    </>
  );
}

function wrapperMethod(wrapper: LocalWrapperRecord | null): LocalMethod {
  if (!wrapper) return 'ldk';
  return wrapper.method === 'pin' ? 'pin' : 'ldk';
}
