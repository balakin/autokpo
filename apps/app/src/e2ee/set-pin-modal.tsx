import { Button, Modal } from '@heroui/react';
import { Trans, useLingui } from '@lingui/react/macro';
import { useEffect, useState } from 'react';

import { PinInput } from './pin-input';

type SetPinModalProps = {
  isOpen: boolean;
  isSubmitting: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (pin: string) => void;
};

type Step = 'enter' | 'confirm';

export function SetPinModal({
  isOpen,
  isSubmitting,
  onOpenChange,
  onSubmit,
}: SetPinModalProps) {
  const { t } = useLingui();
  const [step, setStep] = useState<Step>('enter');
  const [pin, setPin] = useState('');
  const [confirmValue, setConfirmValue] = useState('');
  const [error, setError] = useState('');
  const [confirmKey, setConfirmKey] = useState(0);

  /* eslint-disable @eslint-react/set-state-in-effect */
  useEffect(() => {
    if (!isOpen) {
      setStep('enter');
      setPin('');
      setConfirmValue('');
      setError('');
    }
  }, [isOpen]);
  /* eslint-enable @eslint-react/set-state-in-effect */

  function handleClose() {
    onOpenChange(false);
  }

  function handlePinComplete(value: string) {
    setPin(value);
    setStep('confirm');
  }

  function handleConfirmComplete(value: string) {
    if (value !== pin) {
      setError(t`PIN kodovi se ne poklapaju.`);
      setConfirmValue('');
      setConfirmKey((k) => k + 1);
      return;
    }
    setError('');
    onSubmit(pin);
  }

  return (
    <>
      <Modal.Backdrop
        isOpen={isOpen && step === 'enter'}
        onOpenChange={(open) => {
          if (!open) handleClose();
        }}
      >
        <Modal.Container size="sm">
          <Modal.Dialog>
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>
                <Trans>Postavite PIN kod</Trans>
              </Modal.Heading>
              <p className="mt-1.5 text-sm/5 text-muted">
                <Trans>Unesite 6-cifreni PIN kod.</Trans>
              </p>
            </Modal.Header>
            <Modal.Body className="overflow-x-hidden p-6">
              <div className="flex flex-col gap-1.5">
                <PinInput
                  aria-label={t`PIN kod`}
                  autoFocus
                  value={pin}
                  onChange={setPin}
                  onComplete={handlePinComplete}
                />
              </div>
            </Modal.Body>
            <Modal.Footer>
              <Button slot="close" variant="secondary">
                <Trans>Otkaži</Trans>
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>

      <Modal.Backdrop
        isOpen={isOpen && step === 'confirm'}
        onOpenChange={(open) => {
          if (!open) handleClose();
        }}
      >
        <Modal.Container size="sm">
          <Modal.Dialog>
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>
                <Trans>Potvrdite PIN kod</Trans>
              </Modal.Heading>
            </Modal.Header>
            <Modal.Body className="overflow-x-hidden p-6">
              <div className="flex flex-col gap-1.5">
                <PinInput
                  key={confirmKey}
                  aria-describedby={error ? 'confirm-pin-error' : undefined}
                  aria-label={t`Potvrdite PIN kod`}
                  autoFocus
                  isDisabled={isSubmitting}
                  isInvalid={!!error}
                  value={confirmValue}
                  onChange={setConfirmValue}
                  onComplete={handleConfirmComplete}
                />
                {!!error && (
                  <span
                    data-visible="true"
                    className="text-sm text-danger"
                    id="confirm-pin-error"
                  >
                    {error}
                  </span>
                )}
              </div>
            </Modal.Body>
            <Modal.Footer>
              <Button
                isDisabled={isSubmitting}
                slot="close"
                variant="secondary"
              >
                <Trans>Otkaži</Trans>
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </>
  );
}
