import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Stepper } from '..';

function renderStepper(
  activeStep: number,
  props?: { connector?: React.ReactNode },
) {
  return render(
    <Stepper activeStep={activeStep} {...props}>
      <Stepper.Step>
        <Stepper.Label>Profile</Stepper.Label>
      </Stepper.Step>
      <Stepper.Step>
        <Stepper.Label>Signature</Stepper.Label>
      </Stepper.Step>
      <Stepper.Step>
        <Stepper.Label>Done</Stepper.Label>
      </Stepper.Step>
    </Stepper>,
  );
}

describe('Stepper', () => {
  describe('step status rendering', () => {
    it('marks steps as complete, active, or upcoming based on activeStep', () => {
      renderStepper(1);
      const steps = screen.getAllByRole('listitem');

      expect(steps[0]).toHaveAttribute('data-status', 'complete');
      expect(steps[1]).toHaveAttribute('data-status', 'active');
      expect(steps[2]).toHaveAttribute('data-status', 'upcoming');
    });

    it('marks first step as active when activeStep is 0', () => {
      renderStepper(0);
      const steps = screen.getAllByRole('listitem');

      expect(steps[0]).toHaveAttribute('data-status', 'active');
      expect(steps[1]).toHaveAttribute('data-status', 'upcoming');
      expect(steps[2]).toHaveAttribute('data-status', 'upcoming');
    });
  });

  describe('completed override', () => {
    it('shows skipped step as upcoming when completed={false}', () => {
      render(
        <Stepper activeStep={2}>
          <Stepper.Step>
            <Stepper.Label>Step 1</Stepper.Label>
          </Stepper.Step>
          <Stepper.Step completed={false}>
            <Stepper.Label>Step 2</Stepper.Label>
          </Stepper.Step>
          <Stepper.Step>
            <Stepper.Label>Step 3</Stepper.Label>
          </Stepper.Step>
        </Stepper>,
      );
      const steps = screen.getAllByRole('listitem');

      expect(steps[1]).toHaveAttribute('data-status', 'upcoming');
    });

    it('marks passed steps as complete without completed override', () => {
      renderStepper(2);
      const steps = screen.getAllByRole('listitem');

      expect(steps[0]).toHaveAttribute('data-status', 'complete');
      expect(steps[1]).toHaveAttribute('data-status', 'complete');
    });
  });

  describe('Label', () => {
    it('renders title text', () => {
      renderStepper(0);
      expect(screen.getByText('Profile')).toBeInTheDocument();
    });

    it('renders title and description', () => {
      render(
        <Stepper activeStep={0}>
          <Stepper.Step>
            <Stepper.Label description="Basic info">Profile</Stepper.Label>
          </Stepper.Step>
        </Stepper>,
      );

      expect(screen.getByText('Profile')).toBeInTheDocument();
      expect(screen.getByText('Basic info')).toBeInTheDocument();
    });

    it('fires onClick handler when clicked', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      render(
        <Stepper activeStep={0}>
          <Stepper.Step>
            <Stepper.Label onClick={handleClick}>Step 1</Stepper.Label>
          </Stepper.Step>
        </Stepper>,
      );

      await user.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledOnce();
    });

    it('is excluded from tab order when onClick is absent', () => {
      render(
        <Stepper activeStep={0}>
          <Stepper.Step>
            <Stepper.Label>Step 1</Stepper.Label>
          </Stepper.Step>
        </Stepper>,
      );

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('tabindex', '-1');
    });

    it('has pointer-events-none class when onClick is absent', () => {
      render(
        <Stepper activeStep={0}>
          <Stepper.Step>
            <Stepper.Label>Step 1</Stepper.Label>
          </Stepper.Step>
        </Stepper>,
      );

      const button = screen.getByRole('button');
      expect(button).toHaveClass('pointer-events-none');
    });
  });

  describe('step indicator', () => {
    it('displays 1-based step number for active and upcoming steps', () => {
      renderStepper(1);
      const steps = screen.getAllByRole('listitem');

      // Step 2 is active, should show "2"
      expect(steps[1]).toHaveTextContent('2');
      // Step 3 is upcoming, should show "3"
      expect(steps[2]).toHaveTextContent('3');
    });

    it('marks complete steps with complete status on the indicator', () => {
      renderStepper(1);
      const steps = screen.getAllByRole('listitem');

      // Step 1 is complete — its listitem and indicator should carry data-status=complete
      expect(steps[0]).toHaveAttribute('data-status', 'complete');
    });
  });

  describe('orientation', () => {
    it('defaults to horizontal orientation', () => {
      renderStepper(0);
      const root = screen.getByRole('list');

      expect(root).toHaveAttribute('data-orientation', 'horizontal');
    });

    it('supports vertical orientation', () => {
      render(
        <Stepper activeStep={0} orientation="vertical">
          <Stepper.Step>
            <Stepper.Label>Step 1</Stepper.Label>
          </Stepper.Step>
        </Stepper>,
      );
      const root = screen.getByRole('list');

      expect(root).toHaveAttribute('data-orientation', 'vertical');
    });
  });

  describe('connectors', () => {
    it('auto-inserts connectors with correct data-status', () => {
      renderStepper(1);
      const connectors = screen.getAllByRole('separator');

      // 3 steps → 2 connectors
      expect(connectors).toHaveLength(2);
      // Connector after step 0 (complete) → complete
      expect(connectors[0]).toHaveAttribute('data-status', 'complete');
      // Connector after step 1 (active) → upcoming
      expect(connectors[1]).toHaveAttribute('data-status', 'upcoming');
    });

    it('does not insert connector after the last step', () => {
      renderStepper(0);
      const connectors = screen.getAllByRole('separator');

      expect(connectors).toHaveLength(2);
    });
  });

  describe('accessibility', () => {
    it('step always renders as div', () => {
      render(
        <Stepper activeStep={0}>
          <Stepper.Step>
            <Stepper.Label>Step 1</Stepper.Label>
          </Stepper.Step>
        </Stepper>,
      );

      const step = screen.getByRole('listitem');
      expect(step.tagName).toBe('DIV');
    });

    it('uses role="list" on root and role="listitem" on steps', () => {
      renderStepper(0);

      expect(screen.getByRole('list')).toBeInTheDocument();
      expect(screen.getAllByRole('listitem')).toHaveLength(3);
    });

    it('sets aria-current="step" only on the active step', () => {
      renderStepper(1);
      const steps = screen.getAllByRole('listitem');

      expect(steps[0]).not.toHaveAttribute('aria-current');
      expect(steps[1]).toHaveAttribute('aria-current', 'step');
      expect(steps[2]).not.toHaveAttribute('aria-current');
    });
  });

  describe('custom connector', () => {
    it('renders custom connector between steps', () => {
      renderStepper(0, {
        connector: <span data-testid="custom-connector">---</span>,
      });

      const customConnectors = screen.getAllByTestId('custom-connector');
      expect(customConnectors).toHaveLength(2);
      expect(customConnectors[0]).toHaveTextContent('---');
    });
  });
});
