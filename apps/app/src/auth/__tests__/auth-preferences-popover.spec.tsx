import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from 'tests/render-helpers';
import { describe, expect, it, vi } from 'vitest';

import { AuthPreferencesPopover } from '../auth-preferences-popover';

const mockUseIsMobile = vi.fn(() => false);

vi.mock('../../hooks/use-is-mobile', () => ({
  useIsMobile: () => mockUseIsMobile(),
}));

describe('AuthPreferencesPopover', () => {
  it('renders the gear button', async () => {
    await renderWithProviders(<AuthPreferencesPopover />, {
      route: '/sign-in',
    });

    expect(
      screen.getByRole('button', { name: /Podešavanja/i }),
    ).toBeInTheDocument();
  });

  it('opens popover on desktop when gear button is clicked', async () => {
    mockUseIsMobile.mockReturnValue(false);
    const user = userEvent.setup();

    await renderWithProviders(<AuthPreferencesPopover />, {
      route: '/sign-in',
    });

    await user.click(screen.getByRole('button', { name: /Podešavanja/i }));

    expect(screen.getByLabelText(/Jezik/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Tema/i)).toBeInTheDocument();
  });

  it('renders mobile drawer safe-area classes', async () => {
    mockUseIsMobile.mockReturnValue(true);
    const user = userEvent.setup();

    await renderWithProviders(<AuthPreferencesPopover />, {
      route: '/sign-in',
    });

    await user.click(screen.getByRole('button', { name: /Podešavanja/i }));

    expect(
      screen.getByRole('dialog', { name: /Podešavanja/i }),
    ).toBeInTheDocument();
  });

  it('shows all locale options in language select', async () => {
    mockUseIsMobile.mockReturnValue(false);
    const user = userEvent.setup();

    await renderWithProviders(<AuthPreferencesPopover />, {
      route: '/sign-in',
    });

    await user.click(screen.getByRole('button', { name: /Podešavanja/i }));
    await user.click(screen.getByLabelText(/Jezik/i));

    expect(screen.getByRole('option', { name: 'Srpski' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'English' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Русский' })).toBeInTheDocument();
  });

  it('shows theme options in theme select', async () => {
    mockUseIsMobile.mockReturnValue(false);
    const user = userEvent.setup();

    await renderWithProviders(<AuthPreferencesPopover />, {
      route: '/sign-in',
    });

    await user.click(screen.getByRole('button', { name: /Podešavanja/i }));
    await user.click(screen.getByLabelText(/Tema/i));

    expect(screen.getByRole('option', { name: 'Svetla' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Tamna' })).toBeInTheDocument();
    expect(
      screen.getByRole('option', { name: 'Sistemska' }),
    ).toBeInTheDocument();
  });
});
