import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LocationDisplay, renderWithProviders } from 'tests/render-helpers';
import { describe, expect, it, vi } from 'vitest';

import { ProfilePopover } from '../profile-popover';

const mockUseOnline = vi.fn(() => true);
const mockUseIsMobile = vi.fn(() => false);
const mockUseSyncMetadata = vi.fn(() => ({
  dirty: false,
  lastSuccessfulSyncAt: null,
}));

vi.mock('../../hooks/use-online', () => ({
  useOnline: () => mockUseOnline(),
}));

vi.mock('../../hooks/use-is-mobile', () => ({
  useIsMobile: () => mockUseIsMobile(),
}));

vi.mock('../../crdt', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...(actual as object),
    useSyncMetadata: (selector: (state: never) => unknown) =>
      selector(mockUseSyncMetadata() as never),
  };
});

describe('ProfilePopover', () => {
  it('disables sign-out when offline and shows warning', async () => {
    mockUseOnline.mockReturnValue(false);
    mockUseIsMobile.mockReturnValue(false);
    const user = userEvent.setup();

    await renderWithProviders(<ProfilePopover />, { route: '/dashboard' });

    await user.click(screen.getByRole('button', { name: 'Profil' }));
    expect(screen.getByRole('button', { name: 'Odjavi se' })).toBeDisabled();
    expect(
      screen.getByText(/Odjava zahteva internet vezu/),
    ).toBeInTheDocument();
  });

  it('opens confirmation modal when dirty and online', async () => {
    mockUseOnline.mockReturnValue(true);
    mockUseIsMobile.mockReturnValue(false);
    mockUseSyncMetadata.mockReturnValue({
      dirty: true,
      lastSuccessfulSyncAt: null,
    });
    const user = userEvent.setup();

    await renderWithProviders(<ProfilePopover />, { route: '/dashboard' });

    await user.click(screen.getByRole('button', { name: 'Profil' }));
    await user.click(screen.getByRole('button', { name: 'Odjavi se' }));

    expect(
      screen.getByRole('heading', {
        name: 'Odjava sa nesinhronizovanim izmenama?',
      }),
    ).toBeInTheDocument();
  });

  it('navigates to account settings from the desktop popover', async () => {
    mockUseOnline.mockReturnValue(true);
    mockUseIsMobile.mockReturnValue(false);
    const user = userEvent.setup();

    await renderWithProviders(
      <>
        <LocationDisplay />
        <ProfilePopover />
      </>,
      { route: '/dashboard' },
    );

    await user.click(screen.getByRole('button', { name: 'Profil' }));
    await user.click(
      screen.getByRole('button', { name: 'Podešavanja naloga' }),
    );

    expect(screen.getByLabelText('current-location')).toHaveTextContent(
      '/settings/account',
    );
  });

  it('navigates to account settings from the mobile drawer while offline', async () => {
    mockUseOnline.mockReturnValue(false);
    mockUseIsMobile.mockReturnValue(true);
    const user = userEvent.setup();

    await renderWithProviders(
      <>
        <LocationDisplay />
        <ProfilePopover />
      </>,
      { route: '/dashboard' },
    );

    await user.click(screen.getByRole('button', { name: 'Profil' }));
    await user.click(
      screen.getByRole('button', { name: 'Podešavanja naloga' }),
    );

    expect(screen.getByLabelText('current-location')).toHaveTextContent(
      '/settings/account',
    );
  });
});
