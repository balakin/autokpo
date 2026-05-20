import { Button } from '@heroui/react';
import type { ReactNode } from 'react';
import { useRef } from 'react';
import { LuCheck } from 'react-icons/lu';
import { CSSTransition, SwitchTransition } from 'react-transition-group';

import { useStepContext } from './stepper-context';
import styles from './stepper-label.module.css';
import { stepper } from './stepper-variants';

interface StepperLabelProps {
  description?: ReactNode;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function StepperLabel({
  description,
  children,
  className,
  onClick,
}: StepperLabelProps) {
  const { index, status } = useStepContext();
  const isComplete = status === 'complete';

  const nodeRef = useRef<HTMLSpanElement>(null);

  const {
    label,
    indicator,
    indicatorContent,
    title,
    description: desc,
  } = stepper();

  return (
    <Button
      variant="ghost"
      fullWidth
      data-slot="step-label"
      onPress={onClick}
      excludeFromTabOrder={!onClick}
      className={label({ disabled: !onClick, class: className })}
    >
      <span data-slot="indicator" data-status={status} className={indicator()}>
        <SwitchTransition mode="out-in">
          <CSSTransition
            key={isComplete ? 'check' : 'number'}
            nodeRef={nodeRef}
            timeout={{ exit: 200, enter: 250 }}
            classNames={{
              exit: styles['indicator-exit'],
              exitActive: styles['indicator-exit-active'],
              enter: styles['indicator-enter'],
              enterActive: styles['indicator-enter-active'],
            }}
          >
            <span
              ref={nodeRef}
              data-slot="indicator-content"
              className={indicatorContent()}
            >
              {isComplete ? <LuCheck size={16} /> : index + 1}
            </span>
          </CSSTransition>
        </SwitchTransition>
      </span>
      <div className="flex flex-col">
        <span data-slot="title" data-status={status} className={title()}>
          {children}
        </span>
        {!!description && (
          <span data-slot="description" className={desc()}>
            {description}
          </span>
        )}
      </div>
    </Button>
  );
}

StepperLabel.displayName = 'AutoKPO.Stepper.Label';
