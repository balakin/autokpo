import { createContext, use } from 'react';

import type { StepStatus } from './stepper-variants';

export interface StepperContextValue {
  activeStep: number;
  orientation: 'horizontal' | 'vertical';
}

export const StepperContext = createContext<StepperContextValue | null>(null);

export function useStepperContext(): StepperContextValue {
  const context = use(StepperContext);
  if (!context) {
    throw new Error(
      'Stepper compound components must be used within <Stepper>',
    );
  }
  return context;
}

export interface StepIndexContextValue {
  index: number;
}

export const StepIndexContext = createContext<StepIndexContextValue | null>(
  null,
);

export function useStepIndex(): number {
  const context = use(StepIndexContext);
  if (!context) {
    throw new Error('Stepper.Step must be used within <Stepper>');
  }
  return context.index;
}

export interface StepContextValue {
  index: number;
  status: StepStatus;
}

export const StepContext = createContext<StepContextValue | null>(null);

export function useStepContext(): StepContextValue {
  const context = use(StepContext);
  if (!context) {
    throw new Error('Stepper.Label must be used within <Stepper.Step>');
  }
  return context;
}
