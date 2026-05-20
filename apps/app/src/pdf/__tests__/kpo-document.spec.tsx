import { renderToBuffer } from '@react-pdf/renderer';
import { VALID_PROFILE } from 'tests/fixtures/entity-profile';
import { VALID_ENTRY, VALID_ENTRY_2 } from 'tests/fixtures/entry';
import { VALID_SIGNATURE } from 'tests/fixtures/signature';
import { describe, expect, it, vi } from 'vitest';

import { KpoDocument } from '../kpo-document';

vi.mock('../fonts', () => ({}));
vi.mock('../styles', () => ({
  styles: {},
}));

async function renderDocument(entries: (typeof VALID_ENTRY)[] = [VALID_ENTRY]) {
  return renderToBuffer(
    <KpoDocument
      entityProfile={VALID_PROFILE}
      entries={entries}
      signature={VALID_SIGNATURE}
    />,
  );
}

describe('KpoDocument', () => {
  it('renders with a single entry', async () => {
    await expect(renderDocument([VALID_ENTRY])).resolves.toBeDefined();
  });

  it('renders with multiple entries', async () => {
    await expect(
      renderDocument([VALID_ENTRY, VALID_ENTRY_2]),
    ).resolves.toBeDefined();
  });

  it('renders with no entries', async () => {
    await expect(renderDocument([])).resolves.toBeDefined();
  });
});
