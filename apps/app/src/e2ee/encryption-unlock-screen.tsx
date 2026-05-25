import {
  Button,
  Card,
  FieldError,
  InputGroup,
  Label,
  Link,
  TextField,
} from '@heroui/react';
import { Trans, useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';

type EncryptionUnlockScreenProps = {
  isSubmitting: boolean;
  hasUnlockError: boolean;
  pinWiped?: boolean;
  onSubmit: (password: string) => void;
};

export function EncryptionUnlockScreen({
  isSubmitting,
  hasUnlockError,
  pinWiped = false,
  onSubmit,
}: EncryptionUnlockScreenProps) {
  const { t } = useLingui();
  const [showRecoveryInfo, setShowRecoveryInfo] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { isSubmitting: isFormSubmitting },
  } = useForm({
    defaultValues: { password: '' },
  });

  function onValidSubmit(values: { password: string }) {
    onSubmit(values.password);
  }

  return (
    <Card className="w-full max-w-md gap-3 border-border bg-surface p-4 shadow-overlay sm:p-6">
      <Card.Header className="gap-1 pb-1">
        <Card.Title className="text-2xl/tight  font-bold tracking-tight">
          <Trans>Otključajte podatke</Trans>
        </Card.Title>
        <Card.Description className="text-base">
          <Trans>Otključajte podatke za ovu sesiju.</Trans>
        </Card.Description>
      </Card.Header>
      <Card.Content className="gap-4 pt-1">
        {pinWiped && (
          <div className="rounded-2xl border border-border bg-surface-secondary p-3 text-sm text-muted">
            <Trans>
              PIN kod je uklonjen zbog previše neuspelih pokušaja. Unesite šifru
              za šifrovanje.
            </Trans>
          </div>
        )}
        <form
          className="flex flex-col gap-4"
          noValidate
          onSubmit={(event) => void handleSubmit(onValidSubmit)(event)}
        >
          <Controller
            control={control}
            name="password"
            render={({ field }) => (
              <TextField
                aria-label={t`Šifra za šifrovanje`}
                fullWidth
                isInvalid={hasUnlockError}
              >
                <Label>{t`Šifra za šifrovanje`}</Label>
                <InputGroup fullWidth>
                  <InputGroup.Input
                    autoFocus
                    autoComplete="current-password"
                    type="password"
                    value={field.value}
                    onBlur={field.onBlur}
                    onChange={(event) => field.onChange(event.target.value)}
                  />
                </InputGroup>
                {hasUnlockError ? (
                  <FieldError>
                    <Trans>Šifra nije tačna. Pokušajte ponovo.</Trans>
                  </FieldError>
                ) : null}
              </TextField>
            )}
          />

          <Button
            fullWidth
            isPending={isSubmitting || isFormSubmitting}
            type="submit"
            variant="secondary"
          >
            <Trans>Otključaj podatke</Trans>
          </Button>
        </form>

        <div className="flex flex-col gap-2 text-sm">
          <Link
            aria-expanded={showRecoveryInfo}
            aria-controls="encryption-recovery-info"
            onPress={() => setShowRecoveryInfo((visible) => !visible)}
          >
            <Trans>Zaboravili ste šifru?</Trans>
          </Link>

          {showRecoveryInfo ? (
            <p className="text-muted" id="encryption-recovery-info">
              <Trans>
                AutoKPO ne može da vrati ovu šifru. Bez nje šifrovani podaci
                ostaju nedostupni.
              </Trans>
            </p>
          ) : null}
        </div>
      </Card.Content>
    </Card>
  );
}
