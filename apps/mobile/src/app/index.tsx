import { StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';

import { PlaceholderScreen } from '@/components/placeholder-screen';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { formatMoneyMajor } from '@gastify/core/money/currencies';
import type { RootState } from '@/store';

// Two checks that the shared code runs in the app: the Redux store (same slices as the
// web) and a money helper from packages/core.
export default function HomeScreen() {
  const accounts = useSelector((state: RootState) => state.accountsReducer.data);
  const accountCount = Array.isArray(accounts) ? accounts.length : 0;

  return (
    <PlaceholderScreen title="Inicio" text="Tu resumen del mes llega en la siguiente fase.">
      <ThemedView type="backgroundElement" style={styles.card}>
        <ThemedText type="smallBold">Datos (Redux compartido)</ThemedText>
        <ThemedText type="code">Cuentas cargadas: {accountCount}</ThemedText>
      </ThemedView>
      <ThemedView type="backgroundElement" style={styles.card}>
        <ThemedText type="smallBold">Dinero (código compartido)</ThemedText>
        <ThemedText type="code">{formatMoneyMajor(1234.5, 'MXN')}</ThemedText>
      </ThemedView>
    </PlaceholderScreen>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing.two, padding: Spacing.three, borderRadius: Spacing.three },
});
