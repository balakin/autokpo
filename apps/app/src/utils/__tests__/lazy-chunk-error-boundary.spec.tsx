import { screen } from '@testing-library/react';
import { renderWithProviders } from 'tests/render-helpers';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { isLazyChunkLoadError } from '../lazy-chunk-error';
import { LazyChunkErrorBoundary } from '../lazy-chunk-error-boundary';

function BrokenChunk(): never {
  throw new TypeError('Failed to fetch dynamically imported module');
}

describe('LazyChunkErrorBoundary', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows a reload recovery message when a lazy chunk fails', async () => {
    await renderWithProviders(
      <LazyChunkErrorBoundary>
        <BrokenChunk />
      </LazyChunkErrorBoundary>,
    );

    expect(
      screen.getByText(/ne možemo da učitamo ovaj deo aplikacije/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /osveži aplikaciju/i }),
    ).toBeInTheDocument();
  });

  it('detects common dynamic import failures', () => {
    expect(
      isLazyChunkLoadError(
        new TypeError('Failed to fetch dynamically imported module'),
      ),
    ).toBe(true);
    expect(isLazyChunkLoadError(new Error('ChunkLoadError'))).toBe(true);
    expect(isLazyChunkLoadError(new Error('Validation failed'))).toBe(false);
  });
});
