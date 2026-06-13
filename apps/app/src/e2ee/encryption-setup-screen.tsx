import {
  Button,
  Card,
  Checkbox,
  FieldError,
  InputGroup,
  Label,
  TextField,
} from '@heroui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Trans, useLingui } from '@lingui/react/macro';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

import { posthog } from '../analytics/posthog';

type EncryptionSetupScreenProps = {
  hasSetupError: boolean;
  isSubmitting: boolean;
  onSubmit: (password: string) => void;
};

export function EncryptionSetupScreen({
  hasSetupError,
  isSubmitting,
  onSubmit,
}: EncryptionSetupScreenProps) {
  const { t } = useLingui();
  const schema = z
    .object({
      password: z
        .string()
        .min(1, t`Unesite šifru za šifrovanje.`)
        .min(8, t`Šifra mora imati najmanje 8 znakova.`),
      confirmation: z.string(),
      acknowledged: z.boolean().refine((value) => value, {
        message: t`Potvrdite da razumete da šifra ne može biti vraćena.`,
      }),
    })
    .refine((values) => values.password === values.confirmation, {
      path: ['confirmation'],
      message: t`Šifra i potvrda se ne poklapaju.`,
    });

  const {
    control,
    handleSubmit,
    formState: { isSubmitting: isFormSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      password: '',
      confirmation: '',
      acknowledged: false,
    },
  });

  function onValidSubmit(values: z.infer<typeof schema>) {
    posthog.capture('encryption_setup_completed');
    onSubmit(values.password);
  }

  return (
    <Card className="w-full max-w-md gap-3 border-border bg-surface p-4 shadow-overlay sm:p-6">
      <Card.Header className="gap-1 pb-1">
        <Card.Title className="text-2xl/tight  font-bold tracking-tight">
          <Trans>Podesite šifru za šifrovanje</Trans>
        </Card.Title>
        <Card.Description className="text-base">
          <Trans>
            Prijava potvrđuje vaš nalog. Ova odvojena šifra otključava vaše
            šifrovane podatke posle prijave.
          </Trans>
        </Card.Description>
      </Card.Header>
      <Card.Content className="gap-6 pt-1">
        <div className="rounded-2xl border border-border bg-surface-secondary p-3 text-sm text-muted">
          <Trans>
            AutoKPO ne može da vidi, resetuje ili vrati ovu šifru. Ako je
            izgubite, šifrovani podaci ne mogu biti vraćeni.
          </Trans>
        </div>
        <form
          className="flex flex-col gap-4"
          noValidate
          onSubmit={(event) => void handleSubmit(onValidSubmit)(event)}
        >
          <Controller
            control={control}
            name="password"
            render={({ field, fieldState }) => (
              <TextField
                aria-label={t`Šifra za šifrovanje`}
                fullWidth
                isInvalid={!!fieldState.error}
              >
                <Label>{t`Šifra za šifrovanje`}</Label>
                <InputGroup fullWidth>
                  <InputGroup.Input
                    autoComplete="new-password"
                    type="password"
                    value={field.value}
                    onBlur={field.onBlur}
                    onChange={(event) => field.onChange(event.target.value)}
                  />
                </InputGroup>
                {fieldState.error?.message ? (
                  <FieldError>{fieldState.error.message}</FieldError>
                ) : null}
              </TextField>
            )}
          />

          <Controller
            control={control}
            name="confirmation"
            render={({ field, fieldState }) => (
              <TextField
                aria-label={t`Potvrdite šifru`}
                fullWidth
                isInvalid={!!fieldState.error}
              >
                <Label>{t`Potvrdite šifru`}</Label>
                <InputGroup fullWidth>
                  <InputGroup.Input
                    autoComplete="new-password"
                    type="password"
                    value={field.value}
                    onBlur={field.onBlur}
                    onChange={(event) => field.onChange(event.target.value)}
                  />
                </InputGroup>
                {fieldState.error?.message ? (
                  <FieldError>{fieldState.error.message}</FieldError>
                ) : null}
              </TextField>
            )}
          />

          <Controller
            control={control}
            name="acknowledged"
            render={({ field, fieldState }) => (
              <div>
                <Checkbox
                  id="encryption-recovery-ack"
                  isInvalid={!!fieldState.error}
                  isSelected={field.value}
                  onBlur={field.onBlur}
                  onChange={field.onChange}
                >
                  <Checkbox.Control>
                    <Checkbox.Indicator />
                  </Checkbox.Control>
                  <Checkbox.Content>
                    <Label htmlFor="encryption-recovery-ack">
                      <Trans>
                        Razumem da AutoKPO ne može da vrati ovu šifru ili
                        šifrovane podatke bez nje.
                      </Trans>
                    </Label>
                  </Checkbox.Content>
                </Checkbox>
                {fieldState.error?.message ? (
                  <FieldError>{fieldState.error.message}</FieldError>
                ) : null}
              </div>
            )}
          />

          <Button
            fullWidth
            isPending={isSubmitting || isFormSubmitting}
            type="submit"
            variant="secondary"
          >
            <Trans>Nastavi ka aplikaciji</Trans>
          </Button>
          {hasSetupError ? (
            <p className="text-center text-sm text-danger">
              <Trans>
                Podešavanje šifrovanja nije uspelo. Proverite internet vezu i
                pokušajte ponovo.
              </Trans>
            </p>
          ) : null}
        </form>
      </Card.Content>
    </Card>
  );
}
