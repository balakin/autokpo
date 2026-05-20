import { View, Text } from '@react-pdf/renderer';

import { styles } from './styles';

export function KpoTableHeader() {
  return (
    <View>
      {/* Row 1+2: Main headers and sub-headers */}
      <View style={styles.tableHeadRow}>
        {/* Column 1 — Редни број (8%) */}
        <View
          style={[
            styles.headerGroup,
            { width: '8%', justifyContent: 'center' },
          ]}
        >
          <Text style={[styles.headerGroupLabel, { borderBottom: 'none' }]}>
            {'Редни\nброј'}
          </Text>
        </View>

        {/* Column 2 — Датум и опис књижења (32%) */}
        <View
          style={[
            styles.headerGroup,
            { width: '32%', justifyContent: 'center' },
          ]}
        >
          <Text style={[styles.headerGroupLabel, { borderBottom: 'none' }]}>
            {'Датум и опис\nкњижења'}
          </Text>
        </View>

        {/* Columns 3+4 — ПРИХОД ОД ДЕЛАТНОСТИ (36% total = 18%+18%) */}
        <View
          style={[styles.headerGroup, { width: '36%', borderRight: 'none' }]}
        >
          <View style={styles.headerGroup}>
            <Text style={styles.headerGroupLabel}>ПРИХОД ОД ДЕЛАТНОСТИ</Text>
          </View>
          <View style={styles.headerGroupRow}>
            <View style={[styles.headerGroup, { width: '50%' }]}>
              <Text style={[styles.headerGroupLabel, { borderBottom: 'none' }]}>
                {'Од продаје\nпроизвода'}
              </Text>
            </View>
            <View style={[styles.headerGroup, { width: '50%' }]}>
              <Text style={[styles.headerGroupLabel, { borderBottom: 'none' }]}>
                {'Од извршених\nуслуга'}
              </Text>
            </View>
          </View>
        </View>

        {/* Column 5 — СВЕГА ПРИХОДИ ОД ДЕЛАТНОСТИ (3 + 4) (24%) */}
        <View
          style={[
            styles.headerGroup,
            { width: '24%', justifyContent: 'center', borderRight: 'none' },
          ]}
        >
          <Text style={[styles.headerGroupLabel, { borderBottom: 'none' }]}>
            {'СВЕГА\nПРИХОДИ ОД\nДЕЛАТНОСТИ\n(3 + 4)'}
          </Text>
        </View>
      </View>

      {/* Row 3: Column numbers */}
      <View style={styles.tableHeaderNumbersRow}>
        <View
          style={[
            styles.headerGroup,
            { width: '8%', justifyContent: 'center' },
          ]}
        >
          <Text style={[styles.headerGroupLabel, { borderBottom: 'none' }]}>
            1
          </Text>
        </View>
        <View
          style={[
            styles.headerGroup,
            { width: '32%', justifyContent: 'center' },
          ]}
        >
          <Text style={[styles.headerGroupLabel, { borderBottom: 'none' }]}>
            2
          </Text>
        </View>
        <View
          style={[
            styles.headerGroup,
            { width: '18%', justifyContent: 'center' },
          ]}
        >
          <Text style={[styles.headerGroupLabel, { borderBottom: 'none' }]}>
            3
          </Text>
        </View>
        <View
          style={[
            styles.headerGroup,
            { width: '18%', justifyContent: 'center' },
          ]}
        >
          <Text style={[styles.headerGroupLabel, { borderBottom: 'none' }]}>
            4
          </Text>
        </View>
        <View
          style={[
            styles.headerGroup,
            { width: '24%', justifyContent: 'center', borderRight: 'none' },
          ]}
        >
          <Text style={[styles.headerGroupLabel, { borderBottom: 'none' }]}>
            5
          </Text>
        </View>
      </View>
    </View>
  );
}
