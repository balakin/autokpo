import { Children, type ReactNode } from 'react';

import { StepperConnector } from './stepper-connector';
import { StepIndexContext, StepperContext } from './stepper-context';
import { stepper } from './stepper-variants';

interface StepperRootProps {
  activeStep: number;
  orientation?: 'horizontal' | 'vertical';
  connector?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function StepperRoot({
  activeStep,
  orientation = 'horizontal',
  connector,
  children,
  className,
}: StepperRootProps) {
  // eslint-disable-next-line @eslint-react/no-children-count
  const stepCount = Children.count(children);

  const { root } = stepper();

  return (
    <StepperContext value={{ activeStep, orientation }}>
      <div
        role="list"
        data-slot="root"
        data-orientation={orientation}
        className={root({ class: className })}
      >
        {
          // eslint-disable-next-line @eslint-react/no-children-map
          Children.map(children, (child, index) => (
            // eslint-disable-next-line @eslint-react/no-array-index-key
            <StepIndexContext key={index} value={{ index }}>
              {child}
              {index < stepCount - 1 &&
                (connector !== undefined ? connector : <StepperConnector />)}
            </StepIndexContext>
          ))
        }
      </div>
    </StepperContext>
  );
}

StepperRoot.displayName = 'AutoKPO.Stepper';
