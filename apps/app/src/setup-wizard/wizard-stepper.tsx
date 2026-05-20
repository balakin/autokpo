import { Trans } from '@lingui/react/macro';

import { Stepper } from '../ui/stepper';

export type WizardStep = 'start' | 'profile' | 'signature';

interface WizardStepperProps {
  step: WizardStep;
  setStep: (step: WizardStep) => void;
}

export function WizardStepper({ step, setStep }: WizardStepperProps) {
  const activeStep = step === 'start' ? 0 : step === 'profile' ? 1 : 2;

  return (
    <div className="w-full">
      <Stepper activeStep={activeStep}>
        <Stepper.Step>
          <Stepper.Label>
            <Trans>Početak</Trans>
          </Stepper.Label>
        </Stepper.Step>
        <Stepper.Step>
          <Stepper.Label
            onClick={
              step === 'signature' ? () => setStep('profile') : undefined
            }
          >
            <Trans>Profil</Trans>
          </Stepper.Label>
        </Stepper.Step>
        <Stepper.Step>
          <Stepper.Label>
            <Trans>Potpis</Trans>
          </Stepper.Label>
        </Stepper.Step>
      </Stepper>
    </div>
  );
}
