import { type EntityProfile } from '../entity-profiles/entity-profile-schema';
import { type KpoEntry } from '../entries/entries-schema';
import { type Signature } from '../signatures/signature-schema';

export async function downloadPdf(
  entries: KpoEntry[],
  entityProfile: EntityProfile,
  signature: Signature,
): Promise<void> {
  const [{ pdf }, { KpoDocument }] = await Promise.all([
    import('@react-pdf/renderer'),
    import('./kpo-document'),
  ]);

  const blob = await pdf(
    <KpoDocument
      entries={entries}
      entityProfile={entityProfile}
      signature={signature}
    />,
  ).toBlob();

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'kpo.pdf';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
