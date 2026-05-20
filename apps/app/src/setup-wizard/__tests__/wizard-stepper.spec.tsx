import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nWrapper } from 'tests/render-helpers';
import { describe, expect, it, vi } from 'vitest';

import { DocContext } from '../../crdt/doc-context';
import { YDoc } from '../../crdt/y';
import { WizardStepper } from '../wizard-stepper';

function renderStepper(
  step: 'start' | 'profile' | 'signature',
  setStep = vi.fn(),
) {
  return render(
    <DocContext value={new YDoc()}>
      <I18nWrapper>
        <WizardStepper step={step} setStep={setStep} />
      </I18nWrapper>
    </DocContext>,
  );
}

describe('WizardStepper', () => {
  it('renders three steps', () => {
    renderStepper('start');
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
  });

  describe('start step', () => {
    it('marks Početak as active, Profil and Potpis as upcoming', () => {
      renderStepper('start');
      const steps = screen.getAllByRole('listitem');
      expect(steps[0]).toHaveAttribute('data-status', 'active');
      expect(steps[0]).toHaveAttribute('aria-current', 'step');
      expect(steps[1]).toHaveAttribute('data-status', 'upcoming');
      expect(steps[2]).toHaveAttribute('data-status', 'upcoming');
    });

    it('Početak label is non-interactive', () => {
      renderStepper('start');
      const pocetakButton = screen.getByRole('button', { name: /početak/i });
      expect(pocetakButton).toHaveAttribute('tabindex', '-1');
    });
  });

  describe('profile step', () => {
    it('marks Početak as complete, Profil as active, Potpis as upcoming', () => {
      renderStepper('profile');
      const steps = screen.getAllByRole('listitem');
      expect(steps[0]).toHaveAttribute('data-status', 'complete');
      expect(steps[1]).toHaveAttribute('data-status', 'active');
      expect(steps[1]).toHaveAttribute('aria-current', 'step');
      expect(steps[2]).toHaveAttribute('data-status', 'upcoming');
    });

    it('Početak label is non-interactive', () => {
      renderStepper('profile');
      const pocetakButton = screen.getByRole('button', { name: /početak/i });
      expect(pocetakButton).toHaveAttribute('tabindex', '-1');
    });

    it('Profil label is non-interactive', () => {
      renderStepper('profile');
      const profilButton = screen.getByRole('button', { name: /profil/i });
      expect(profilButton).toHaveAttribute('tabindex', '-1');
    });
  });

  describe('signature step', () => {
    it('marks Početak and Profil as complete, Potpis as active', () => {
      renderStepper('signature');
      const steps = screen.getAllByRole('listitem');
      expect(steps[0]).toHaveAttribute('data-status', 'complete');
      expect(steps[1]).toHaveAttribute('data-status', 'complete');
      expect(steps[2]).toHaveAttribute('data-status', 'active');
      expect(steps[2]).toHaveAttribute('aria-current', 'step');
    });

    it('Početak label is non-interactive', () => {
      renderStepper('signature');
      const pocetakButton = screen.getByRole('button', { name: /početak/i });
      expect(pocetakButton).toHaveAttribute('tabindex', '-1');
    });

    it('renders interactive Profil label', () => {
      renderStepper('signature');
      const profilButton = screen.getByRole('button', { name: /profil/i });
      expect(profilButton).not.toHaveAttribute('tabindex', '-1');
    });

    it('calls setStep("profile") when Profil label is clicked', async () => {
      const user = userEvent.setup();
      const setStep = vi.fn();
      renderStepper('signature', setStep);

      await user.click(screen.getByRole('button', { name: /profil/i }));
      expect(setStep).toHaveBeenCalledWith('profile');
    });
  });
});
