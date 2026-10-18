import { toast } from '@heroui/react';
import { screen, act, waitFor } from '@testing-library/react';
import { renderWithProviders } from 'tests/render-helpers';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { OfflineIndicator } from '../offline-indicator';

describe('OfflineIndicator', () => {
  beforeEach(() => {
    Object.defineProperty(navigator, 'onLine', { value: true, writable: true });
  });

  // Closed toasts stay mounted for HeroUI's exit animation, so wait for the
  // DOM to empty before the next test renders.
  afterEach(async () => {
    act(() => {
      toast.clear();
    });
    await waitFor(() => {
      expect(screen.queryByText(/van mreže ste/i)).toBeNull();
    });
  });

  it('shows no toast when online', async () => {
    await renderWithProviders(<OfflineIndicator />);
    expect(screen.queryByText(/van mreže ste/i)).toBeNull();
  });

  it('shows warning toast when offline', async () => {
    Object.defineProperty(navigator, 'onLine', { value: false });
    await renderWithProviders(<OfflineIndicator />);
    expect(screen.getByText(/van mreže ste/i)).toBeInTheDocument();
  });

  it('closes toast when coming back online', async () => {
    Object.defineProperty(navigator, 'onLine', { value: false });
    await renderWithProviders(<OfflineIndicator />);
    expect(screen.getByText(/van mreže ste/i)).toBeInTheDocument();

    Object.defineProperty(navigator, 'onLine', { value: true });
    act(() => {
      window.dispatchEvent(new Event('online'));
    });
    await waitFor(() => {
      expect(screen.queryByText(/van mreže ste/i)).toBeNull();
    });
  });
});
