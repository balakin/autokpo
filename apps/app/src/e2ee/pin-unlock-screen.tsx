import { Card } from '@heroui/react';
import { Trans, useLingui } from '@lingui/react/macro';
import { useEffect, useState } from 'react';

import { PinInput } from './pin-input';

const MAX_ATTEMPTS = 10;
const SHOW_REMAINING_THRESHOLD = 5;

type PinUnlockScreenProps = {
  failedAttempts: number;
  hasUnlockError: boolean;
  isSubmitting: boolean;
  onSubmit: (pin: string) => void;
};

export function PinUnlockScreen({
  failedAttempts,
  hasUnlockError,
  isSubmitting,
  onSubmit,
}: PinUnlockScreenProps) {
  const { t } = useLingui();
  const [value, setValue] = useState('');
  const [inputKey, setInputKey] = useState(0);

  /* eslint-disable @eslint-react/set-state-in-effect */
  useEffect(() => {
    if (hasUnlockError) {
      setValue('');
      setInputKey((k) => k + 1);
    }
  }, [hasUnlockError]);
  /* eslint-enable @eslint-react/set-state-in-effect */

  const remaining = MAX_ATTEMPTS - failedAttempts;
  const showRemaining =
    hasUnlockError && failedAttempts >= SHOW_REMAINING_THRESHOLD;

  function handleChange(next: string) {
    setValue(next);
  }

  function handleComplete(pin: string) {
    onSubmit(pin);
  }

  return (
    <Card className="w-full max-w-md gap-3 border-border bg-surface p-4 shadow-overlay sm:p-6">
      <Card.Header className="gap-1 pb-1">
        <Card.Title className="text-2xl/tight font-bold tracking-tight">
          <Trans>Unesite PIN kod</Trans>
        </Card.Title>
        <Card.Description className="text-base">
          <Trans>Otključajte podatke za ovu sesiju.</Trans>
        </Card.Description>
      </Card.Header>
      <Card.Content className="gap-4 pt-1">
        <div className="flex flex-col gap-1.5">
          <PinInput
            key={inputKey}
            aria-describedby={hasUnlockError ? 'pin-error' : undefined}
            aria-label={t`PIN kod`}
            autoFocus
            isDisabled={isSubmitting}
            isInvalid={hasUnlockError}
            value={value}
            onChange={handleChange}
            onComplete={handleComplete}
          />
          {hasUnlockError && (
            <span
              data-visible="true"
              className="text-sm text-danger"
              id="pin-error"
            >
              {showRemaining ? (
                <Trans>Pogrešan PIN. Preostalo pokušaja: {remaining}.</Trans>
              ) : (
                <Trans>Pogrešan PIN. Pokušajte ponovo.</Trans>
              )}
            </span>
          )}
        </div>
      </Card.Content>
    </Card>
  );
}
