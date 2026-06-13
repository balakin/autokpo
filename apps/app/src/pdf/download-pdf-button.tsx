import { Button } from '@heroui/react';
import { Trans } from '@lingui/react/macro';

import { posthog } from '../analytics/posthog';
import { useBookId } from '../books/use-book-id';
import { useYDoc } from '../crdt';
import { profileSelectors } from '../entity-profiles/profile-selectors';
import { entrySelectors } from '../entries/entry-selectors';
import { signatureSelectors } from '../signatures/signature-selectors';

import { downloadPdf } from './download-pdf';

export function DownloadPdfButton() {
  const bookId = useBookId();
  const profile = useYDoc(profileSelectors.active(bookId));
  const signature = useYDoc(signatureSelectors.active(bookId));
  const entries = useYDoc(entrySelectors.all(bookId));

  async function handleDownloadPdf() {
    await downloadPdf(entries, profile!, signature!);
    posthog.capture('pdf_downloaded', { entry_count: entries.length });
  }

  return (
    <Button
      isDisabled={!profile || !signature}
      onPress={() => void handleDownloadPdf()}
    >
      <Trans>Preuzmi PDF</Trans>
    </Button>
  );
}
