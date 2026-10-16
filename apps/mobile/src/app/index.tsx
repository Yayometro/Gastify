import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { formatMoneyMajor } from '@gastify/core/money/currencies';
import { percentOf } from '@gastify/core/format/percent';
import { readableTextColor } from '@gastify/core/format/readableTextColor';
import { getRecentCutoff } from '@gastify/core/transactions/historyWindow';

// Foundation check: everything below comes from packages/core, the same code the web app runs.
// This screen is a placeholder until phase 2 of .mds/MOBILE_REACT_NATIVE_PLAN.md.
export default function HomeScreen() {
  const samples = [
    formatMoneyMajor(1234.5, 'MXN'),
    formatMoneyMajor(1234.5, 'USD'),
    formatMoneyMajor(1234.5, 'EUR'),
    formatMoneyMajor(1234, 'JPY'),
  ];
  const cutoff = getRecentCutoff();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="title">Gastify</ThemedText>
        <ThemedText themeColor="textSecondary">Móvil: cimientos con código compartido</ThemedText>

        <ThemedView type="backgroundElement" style={styles.card}>
          <ThemedText type="smallBold">Dinero (money/currencies)</ThemedText>
          {samples.map((s) => (
            <ThemedText key={s} type="code">{s}</ThemedText>
          ))}
        </ThemedView>

        <ThemedView type="backgroundElement" style={styles.card}>
          <ThemedText type="smallBold">Otros</ThemedText>
          <ThemedText type="code">percentOf(25, 200) = {percentOf(25, 200)}</ThemedText>
          <ThemedText type="code">readableTextColor(#1e3a8a) = {String(readableTextColor('#1e3a8a'))}</ThemedText>
          <ThemedText type="code">historial reciente desde {cutoff.toISOString().slice(0, 10)}</ThemedText>
        </ThemedView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row', justifyContent: 'center' },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.three,
    maxWidth: MaxContentWidth,
    gap: Spacing.three,
  },
  card: { gap: Spacing.two, padding: Spacing.three, borderRadius: Spacing.three },
});
