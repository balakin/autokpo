import {
  Button,
  FieldError,
  InputGroup,
  TextField,
  toast,
} from '@heroui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Trans, useLingui } from '@lingui/react/macro';
import type { TurnstileInstance } from '@marsidev/react-turnstile';
import { usePostHog } from '@posthog/react';
import { useRef } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { LuMail } from 'react-icons/lu';
import { z } from 'zod';

import { HiddenTurnstile } from './hidden-turnstile';

export interface EmailFormProps {
  email: string;
  onSubmit: (email: string, captchaToken: string) => Promise<void>;
}

export function EmailForm({ email, onSubmit }: EmailFormProps) {
  const { t } = useLingui();
  const posthog = usePostHog();
  const turnstileRef = useRef<TurnstileInstance>(null);

  const schema = z.object({
    email: z.email({ message: t`Unesite ispravnu email adresu.` }),
  });

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email },
  });

  async function onValidSubmit(values: { email: string }) {
    const token =
      (await turnstileRef.current
        ?.getResponsePromise(5000)
        .catch(() => null)) ?? null;
    if (!token) {
      toast.danger(t`Sačekajte trenutak i pokušajte ponovo.`);
      return;
    }
    try {
      await onSubmit(values.email, token);
      posthog.capture('sign_in_otp_requested');
    } catch {
      toast.danger(t`Nismo uspeli da pošaljemo kod. Pokušajte ponovo.`);
      turnstileRef.current?.reset();
    }
  }

  return (
    <form
      className="mt-4 flex flex-col gap-3"
      noValidate
      onSubmit={(event) => void handleSubmit(onValidSubmit)(event)}
    >
      <Controller
        control={control}
        name="email"
        render={({ field, fieldState }) => (
          <TextField
            aria-label={t`Email adresa`}
            fullWidth
            isInvalid={!!fieldState.error}
            name={field.name}
          >
            <InputGroup fullWidth>
              <InputGroup.Prefix>
                <LuMail className="size-4 text-muted" />
              </InputGroup.Prefix>
              <InputGroup.Input
                placeholder={t`mail@example.com`}
                type="email"
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
      <HiddenTurnstile ref={turnstileRef} />
      <Button
        fullWidth
        isPending={isSubmitting}
        type="submit"
        variant="secondary"
      >
        <Trans>Pošalji kod</Trans>
      </Button>
    </form>
  );
}
