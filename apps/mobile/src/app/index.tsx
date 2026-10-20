import { Text, View } from 'react-native';
import { useSelector } from 'react-redux';

import { PlaceholderScreen } from '@/components/placeholder-screen';
import { formatMoneyMajor } from '@gastify/core/money/currencies';
import type { RootState } from '@/store';

// Two checks that the shared code runs in the app: the Redux store (same slices as the
// web) and a money helper from packages/core.
export default function HomeScreen() {
  const accounts = useSelector((state: RootState) => state.accountsReducer.data);
  const accountCount = Array.isArray(accounts) ? accounts.length : 0;

  return (
    <PlaceholderScreen title="Inicio" text="Tu resumen del mes llega en la siguiente fase.">
      <View className="gap-2 rounded-3xl bg-gf-surface p-4">
        <Text className="font-inter-semibold text-sm text-gf-text">Datos (Redux compartido)</Text>
        <Text className="font-inter-medium text-base text-gf-text">Cuentas cargadas: {accountCount}</Text>
      </View>
      <View className="gap-2 rounded-3xl bg-gf-surface p-4">
        <Text className="font-inter-semibold text-sm text-gf-text">Dinero (código compartido)</Text>
        <Text className="font-inter-medium text-base text-gf-text">{formatMoneyMajor(1234.5, 'MXN')}</Text>
      </View>
    </PlaceholderScreen>
  );
}
