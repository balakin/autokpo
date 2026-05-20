import { VALID_PROFILE } from 'tests/fixtures/entity-profile';
import { VALID_ENTRY } from 'tests/fixtures/entry';
import { VALID_SIGNATURE } from 'tests/fixtures/signature';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { downloadPdf } from '../download-pdf';

vi.mock('@react-pdf/renderer', () => ({
  pdf: vi.fn(() => ({
    toBlob: vi
      .fn()
      .mockResolvedValue(new Blob(['pdf'], { type: 'application/pdf' })),
  })),
}));

vi.mock('../kpo-document', () => ({
  KpoDocument: vi.fn(() => null),
}));

describe('downloadPdf', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('creates a temporary anchor and triggers a click', async () => {
    vi.spyOn(URL, 'createObjectURL').mockReturnValue(
      'blob:http://localhost/fake-url',
    );
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    const clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => {});

    await downloadPdf([VALID_ENTRY], VALID_PROFILE, VALID_SIGNATURE);

    expect(clickSpy).toHaveBeenCalledOnce();
  });

  it('sets download filename to "kpo.pdf"', async () => {
    vi.spyOn(URL, 'createObjectURL').mockReturnValue(
      'blob:http://localhost/fake-url',
    );
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    const captured = { anchor: null as HTMLAnchorElement | null };
    vi.spyOn(document.body, 'appendChild').mockImplementation((node) => {
      captured.anchor = node as HTMLAnchorElement;
      return node;
    });
    vi.spyOn(document.body, 'removeChild').mockImplementation((node) => node);

    await downloadPdf([VALID_ENTRY], VALID_PROFILE, VALID_SIGNATURE);

    expect(captured.anchor?.download).toBe('kpo.pdf');
  });

  it('sets the anchor href to the created object URL', async () => {
    const objectUrl = 'blob:http://localhost/fake-url';
    vi.spyOn(URL, 'createObjectURL').mockReturnValue(objectUrl);
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    const captured = { anchor: null as HTMLAnchorElement | null };
    vi.spyOn(document.body, 'appendChild').mockImplementation((node) => {
      captured.anchor = node as HTMLAnchorElement;
      return node;
    });
    vi.spyOn(document.body, 'removeChild').mockImplementation((node) => node);

    await downloadPdf([VALID_ENTRY], VALID_PROFILE, VALID_SIGNATURE);

    expect(captured.anchor?.href).toBe(objectUrl);
  });

  it('revokes the object URL after download', async () => {
    const objectUrl = 'blob:http://localhost/fake-url';
    vi.spyOn(URL, 'createObjectURL').mockReturnValue(objectUrl);
    const revokeObjectURL = vi
      .spyOn(URL, 'revokeObjectURL')
      .mockImplementation(() => {});
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    await downloadPdf([VALID_ENTRY], VALID_PROFILE, VALID_SIGNATURE);

    expect(revokeObjectURL).toHaveBeenCalledWith(objectUrl);
  });

  it('removes the anchor from the DOM after download', async () => {
    vi.spyOn(URL, 'createObjectURL').mockReturnValue(
      'blob:http://localhost/fake-url',
    );
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    const removeChildSpy = vi
      .spyOn(document.body, 'removeChild')
      .mockImplementation((node) => node);

    await downloadPdf([VALID_ENTRY], VALID_PROFILE, VALID_SIGNATURE);

    expect(removeChildSpy).toHaveBeenCalledOnce();
  });
});
