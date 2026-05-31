import { View, Text } from '@react-pdf/renderer';

import { type KpoEntry } from '../entries/entries-schema';
import { formatCurrency } from '../utils/formatters';

import { styles } from './styles';

interface KpoTotalsRowProps {
  entries: KpoEntry[];
}

export function KpoTotalsRow({ entries }: KpoTotalsRowProps) {
  const totalOdProdaje = entries.reduce(
    (sum, e) => sum + e.odProdajeProizvoda,
    0,
  );
  const totalOdUsluga = entries.reduce(
    (sum, e) => sum + e.odIzvrsenihUsluga,
    0,
  );
  const totalSvega = totalOdProdaje + totalOdUsluga;

  return (
    <View style={[styles.tableRow, { borderTop: '1pt solid black' }]}>
      <Text
        style={[styles.tableCellBold, { width: '40%', textAlign: 'center' }]}
      >
        ЗБИР
      </Text>
      <Text
        style={[styles.tableCellBold, { width: '18%', textAlign: 'right' }]}
      >
        {formatCurrency(totalOdProdaje)}
      </Text>
      <Text
        style={[styles.tableCellBold, { width: '18%', textAlign: 'right' }]}
      >
        {formatCurrency(totalOdUsluga)}
      </Text>
      <Text
        style={[
          styles.tableCellBold,
          { width: '24%', textAlign: 'right', borderRight: 'none' },
        ]}
      >
        {formatCurrency(totalSvega)}
      </Text>
    </View>
  );
}
