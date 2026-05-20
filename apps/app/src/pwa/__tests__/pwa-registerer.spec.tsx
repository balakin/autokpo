import { toast } from '@heroui/react';
import { screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  resetPwaRegisterMock,
  setPwaNeedRefresh,
  setPwaUpdateServiceWorker,
} from 'tests/mocks/pwa-register-react';
import { renderWithProviders } from 'tests/render-helpers';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { PwaRegisterer } from '../pwa-registerer';

describe('PwaRegisterer', () => {
  afterEach(() => {
    act(() => {
      resetPwaRegisterMock();
      toast.clear();
    });
  });

  it('shows no toast before an update is available', async () => {
    await renderWithProviders(<PwaRegisterer />);
    expect(screen.queryByText(/dostupno je ažuriranje/i)).toBeNull();
  });

  it('shows a persistent update toast when an update is available', async () => {
    setPwaNeedRefresh(true);

    await renderWithProviders(<PwaRegisterer />);

    expect(screen.getByText(/dostupno je ažuriranje/i)).toBeInTheDocument();
    expect(screen.getByText(/osvežite aplikaciju/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /osveži/i })).toBeInTheDocument();
  });

  it('activates the waiting service worker when the reload action is pressed', async () => {
    const update = vi.fn(() => Promise.resolve());
    const user = userEvent.setup();

    setPwaNeedRefresh(true);
    setPwaUpdateServiceWorker(update);

    await renderWithProviders(<PwaRegisterer />);

    await user.click(screen.getByRole('button', { name: /osveži/i }));

    expect(update).toHaveBeenCalledWith(true);
  });
});
