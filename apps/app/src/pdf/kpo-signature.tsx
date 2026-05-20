import { View, Text } from '@react-pdf/renderer';

import { type Signature } from '../signatures/signature-schema';

import { styles } from './styles';

interface KpoSignatureProps {
  signature: Signature;
}

export function KpoSignature({ signature }: KpoSignatureProps) {
  return (
    <View style={styles.signatureBlock}>
      <View style={styles.signatureField}>
        <Text style={styles.signatureLabel}>Саставио</Text>
        <Text style={styles.signatureName}>{signature.sastavioIme}</Text>
        <View style={styles.signatureLine} />
      </View>
      <View style={styles.signatureField}>
        <Text style={styles.signatureLabel}>Одговорно лице</Text>
        <Text style={styles.signatureName}>{signature.odgovornoLiceIme}</Text>
        <View style={styles.signatureLine} />
      </View>
    </View>
  );
}
