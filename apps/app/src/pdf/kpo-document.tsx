import { Document, Page, View, Text } from '@react-pdf/renderer';

import { type EntityProfile } from '../entity-profiles/entity-profile-schema';
import { type KpoEntry } from '../entries/entries-schema';
import { type Signature } from '../signatures/signature-schema';

import './fonts';
import { KpoEntryRow } from './kpo-entry-row';
import { KpoPageHeader } from './kpo-page-header';
import { KpoSignature } from './kpo-signature';
import { KpoTableHeader } from './kpo-table-header';
import { KpoTotalsRow } from './kpo-totals-row';
import { styles } from './styles';

interface KpoDocumentProps {
  entityProfile: EntityProfile;
  entries: KpoEntry[];
  signature: Signature;
}

export function KpoDocument({
  entityProfile,
  entries,
  signature,
}: KpoDocumentProps) {
  return (
    <Document>
      <Page style={styles.page}>
        <KpoPageHeader entityProfile={entityProfile} />
        <View style={styles.table}>
          <KpoTableHeader />
          {entries.map((entry, index) => (
            <KpoEntryRow
              key={entry.id}
              entry={entry}
              index={index}
              isLast={index + 1 === entries.length}
            />
          ))}
          <KpoTotalsRow entries={entries} />
        </View>
        <KpoSignature signature={signature} />
        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) =>
            `${pageNumber} / ${totalPages}`
          }
          fixed
        />
      </Page>
    </Document>
  );
}
