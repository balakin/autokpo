import { act, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { SyncMetadataProvider } from '../sync-metadata-provider';
import { createSyncStateStore } from '../sync-state';
import { useSyncMetadata } from '../use-sync-metadata';

const store = createSyncStateStore('test-user');

describe('useSyncMetadata', () => {
  it('does not re-render when selector value is unchanged', () => {
    let renderCount = 0;

    function Harness() {
      renderCount++;
      const value = useSyncMetadata((state) => state.lastSuccessfulSyncAt);
      return <span data-testid="value">{String(value)}</span>;
    }

    store.write({
      cursor: 0,
      stateVector: null,
      dirty: false,
      lastSuccessfulSyncAt: 1714567890000,
    });

    render(
      <SyncMetadataProvider userId="test-user">
        <Harness />
      </SyncMetadataProvider>,
    );
    act(() => {
      store.write({
        cursor: 100,
        stateVector: null,
        dirty: true,
        lastSuccessfulSyncAt: 1714567890000,
      });
    });

    expect(screen.getByTestId('value').textContent).toBe('1714567890000');
    expect(renderCount).toBe(1);
  });
});
