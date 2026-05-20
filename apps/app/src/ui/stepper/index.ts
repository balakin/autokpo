import { StepperConnector } from './stepper-connector';
import { StepperLabel } from './stepper-label';
import { StepperRoot } from './stepper-root';
import { StepperStep } from './stepper-step';

export const Stepper = Object.assign(StepperRoot, {
  Step: StepperStep,
  Label: StepperLabel,
  Connector: StepperConnector,
});
