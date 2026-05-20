import { useStepIndex, useStepperContext } from './stepper-context';
import type { StepStatus } from './stepper-variants';
import { stepper } from './stepper-variants';

interface StepperConnectorProps {
  className?: string;
}

export function StepperConnector({ className }: StepperConnectorProps) {
  const { activeStep, orientation } = useStepperContext();
  const index = useStepIndex();
  const status: StepStatus = index < activeStep ? 'complete' : 'upcoming';

  const { connector } = stepper();

  return (
    <div
      role="separator"
      data-slot="connector"
      data-status={status}
      data-orientation={orientation}
      className={connector({ class: className })}
    />
  );
}

StepperConnector.displayName = 'AutoKPO.Stepper.Connector';
