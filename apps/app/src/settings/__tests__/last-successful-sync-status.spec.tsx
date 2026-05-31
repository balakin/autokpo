import { screen } from '@testing-library/react';
import { renderWithProviders } from 'tests/render-helpers';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { LastSuccessfulSyncStatus } from '../last-successful-sync-status';

const mockUseSyncMetadata = vi.fn<
  (selector: unknown, isEqual?: unknown) => number | null
>(() => null);

vi.mock('../../crdt', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...(actual as object),
    useSyncMetadata: (selector: unknown, isEqual?: unknown) =>
      mockUseSyncMetadata(selector, isEqual),
  };
});

vi.mock('../../i18n/use-locale', () => ({
  useLocale: () => ({ locale: 'en', setLocale: vi.fn() }),
}));

describe('LastSuccessfulSyncStatus', () => {
  beforeEach(() => {
    mockUseSyncMetadata.mockReset();
    mockUseSyncMetadata.mockReturnValue(null);
    vi.useRealTimers();
  });

  it('shows empty state when no successful sync exists', async () => {
    await renderWithProviders(<LastSuccessfulSyncStatus />, {
      route: '/settings',
    });

    expect(
      screen.getByText('Još nema uspešne sinhronizacije na ovom uređaju.'),
    ).toBeInTheDocument();
  });

  it('schedules recalculation every 5 seconds under one minute', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-01T12:00:00.000Z'));
    mockUseSyncMetadata.mockReturnValue(Date.parse('2026-05-01T11:59:30.000Z'));
    const setTimeoutSpy = vi.spyOn(window, 'setTimeout');

    await renderWithProviders(<LastSuccessfulSyncStatus />, {
      route: '/settings',
    });

    expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 5000);
  });

  it('schedules recalculation every 30 seconds after one minute', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-01T12:00:00.000Z'));
    mockUseSyncMetadata.mockReturnValue(Date.parse('2026-05-01T11:50:00.000Z'));
    const setTimeoutSpy = vi.spyOn(window, 'setTimeout');

    await renderWithProviders(<LastSuccessfulSyncStatus />, {
      route: '/settings',
    });

    expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 30000);
  });

  it('shows absolute date for sync older than one day', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-01T12:00:00.000Z'));
    mockUseSyncMetadata.mockReturnValue(Date.parse('2026-04-29T11:00:00.000Z'));

    await renderWithProviders(<LastSuccessfulSyncStatus />, {
      route: '/settings',
    });

    expect(
      screen.getByText(/Poslednja uspešna sinhronizacija:/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Poslednja uspešna sinhronizacija:/).textContent,
    ).toMatch(/Apr 29, 2026/);
  });

  it('never shows future phrasing when timestamp is slightly ahead', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-01T12:00:00.000Z'));
    mockUseSyncMetadata.mockReturnValue(Date.parse('2026-05-01T12:00:20.000Z'));

    await renderWithProviders(<LastSuccessfulSyncStatus />, {
      route: '/settings',
    });

    expect(
      screen.getByText(/Poslednja uspešna sinhronizacija:/),
    ).toHaveTextContent('upravo sada');
  });
});
