import type { ReactNode } from 'react';

import {
  StepContext,
  useStepIndex,
  useStepperContext,
} from './stepper-context';
import type { StepStatus } from './stepper-variants';
import { stepper } from './stepper-variants';

interface StepperStepProps {
  completed?: boolean;
  children: ReactNode;
  className?: string;
}

export function StepperStep({
  completed,
  children,
  className,
}: StepperStepProps) {
  const { activeStep } = useStepperContext();
  const index = useStepIndex();
  const status = resolveStatus(index, activeStep, completed);

  const { step } = stepper();

  return (
    <StepContext value={{ index, status }}>
      <div
        role="listitem"
        data-slot="step"
        data-status={status}
        aria-current={status === 'active' ? 'step' : undefined}
        className={step({ class: className })}
      >
        {children}
      </div>
    </StepContext>
  );
}

StepperStep.displayName = 'AutoKPO.Stepper.Step';

function resolveStatus(
  index: number,
  activeStep: number,
  completed?: boolean,
): StepStatus {
  if (completed === false) return 'upcoming';
  if (index < activeStep) return 'complete';
  if (index === activeStep) return 'active';
  return 'upcoming';
}
