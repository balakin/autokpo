import { View, Text } from '@react-pdf/renderer';

import { type EntityProfile } from '../entity-profiles/entity-profile-schema';

import { styles } from './styles';

interface KpoPageHeaderProps {
  entityProfile: EntityProfile;
}

export function KpoPageHeader({ entityProfile }: KpoPageHeaderProps) {
  return (
    <View style={styles.pageHeader}>
      <View style={styles.pageHeaderInfo}>
        <View style={styles.pageHeaderRow}>
          <Text style={styles.pageHeaderLabel}>ПИБ:</Text>
          <Text style={styles.pageHeaderValue}>{entityProfile.pib}</Text>
        </View>
        <View style={styles.pageHeaderRow}>
          <Text style={styles.pageHeaderLabel}>Обвезник:</Text>
          <Text style={styles.pageHeaderValue}>{entityProfile.obveznik}</Text>
        </View>
        <View style={styles.pageHeaderRow}>
          <Text style={styles.pageHeaderLabel}>Фирма-радње:</Text>
          <Text style={styles.pageHeaderValue}>
            {entityProfile.firmaRadnje}
          </Text>
        </View>
        <View style={styles.pageHeaderRow}>
          <Text style={styles.pageHeaderLabel}>Седиште:</Text>
          <Text style={styles.pageHeaderValue}>{entityProfile.sediste}</Text>
        </View>
        <View style={styles.pageHeaderRow}>
          <Text style={styles.pageHeaderLabel}>Шифра пореског обвезника:</Text>
          <Text style={styles.pageHeaderValue}>
            {entityProfile.sifraPoreskogObveznika}
          </Text>
        </View>
        <View style={styles.pageHeaderRow}>
          <Text style={styles.pageHeaderLabel}>Шифра делатности:</Text>
          <Text style={styles.pageHeaderValue}>
            {entityProfile.sifraDelatnosti}
          </Text>
        </View>
      </View>
      <Text style={styles.kpoTitle}>КПО</Text>
    </View>
  );
}
