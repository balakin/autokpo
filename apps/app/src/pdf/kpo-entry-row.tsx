import { View, Text } from '@react-pdf/renderer';

import { type KpoEntry } from '../entries/entries-schema';
import { formatCurrency, formatDate } from '../formatters';

import { styles } from './styles';

interface KpoEntryRowProps {
  entry: KpoEntry;
  index: number;
  isLast?: boolean;
}

export function KpoEntryRow({ entry, index, isLast }: KpoEntryRowProps) {
  const svega = entry.odProdajeProizvoda + entry.odIzvrsenihUsluga;

  return (
    <View style={[styles.tableRow, isLast ? { borderBottom: 'none' } : {}]}>
      <Text style={[styles.tableCell, { width: '8%', textAlign: 'center' }]}>
        {index + 1}
      </Text>
      <Text style={[styles.tableCell, { width: '32%' }]}>
        {formatDate(entry.datumPrometa)} {entry.opisPrometa}
      </Text>
      <Text style={[styles.tableCell, { width: '18%', textAlign: 'right' }]}>
        {formatCurrency(entry.odProdajeProizvoda)}
      </Text>
      <Text style={[styles.tableCell, { width: '18%', textAlign: 'right' }]}>
        {formatCurrency(entry.odIzvrsenihUsluga)}
      </Text>
      <Text
        style={[
          styles.tableCell,
          { width: '24%', textAlign: 'right', borderRight: 'none' },
        ]}
      >
        {formatCurrency(svega)}
      </Text>
    </View>
  );
}
