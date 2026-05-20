import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from 'tests/render-helpers';
import { describe, expect, it, vi } from 'vitest';

import { StartStep } from '../start-step';

describe('StartStep', () => {
  it('renders heading and Počnite button', async () => {
    await renderWithProviders(<StartStep onNext={vi.fn()} />);
    expect(
      screen.getByRole('heading', { name: /podešavanje knjige/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /počnite/i }),
    ).toBeInTheDocument();
  });

  it('lists Profil and Potpis as upcoming steps', async () => {
    await renderWithProviders(<StartStep onNext={vi.fn()} />);
    expect(screen.getAllByText(/profil/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/potpis/i).length).toBeGreaterThan(0);
  });

  it('shows the "can change later" note', async () => {
    await renderWithProviders(<StartStep onNext={vi.fn()} />);
    expect(
      screen.getByText(/sve podatke možete promeniti kasnije/i),
    ).toBeInTheDocument();
  });

  it('pressing "Počnite" calls onNext', async () => {
    const user = userEvent.setup();
    const onNext = vi.fn();
    await renderWithProviders(<StartStep onNext={onNext} />);

    await user.click(screen.getByRole('button', { name: /počnite/i }));

    expect(onNext).toHaveBeenCalledOnce();
  });
});
