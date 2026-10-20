import { Tabs } from 'expo-router';
import { useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';

// Gastify's bottom bar: Inicio, Movimientos, Agregar, Presupuestos y Más.
// Standard Expo Router tabs (available in every SDK).
export default function AppTabs() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: { backgroundColor: colors.background },
      }}>
      <Tabs.Screen name="index" options={{ title: 'Inicio' }} />
      <Tabs.Screen name="movements" options={{ title: 'Movimientos' }} />
      <Tabs.Screen name="add" options={{ title: 'Agregar' }} />
      <Tabs.Screen name="budgets" options={{ title: 'Presupuestos' }} />
      <Tabs.Screen name="more" options={{ title: 'Más' }} />
      {/* Template leftover (src/app/explore.tsx): kept out of the bar until the file is removed. */}
      <Tabs.Screen name="explore" options={{ href: null }} />
    </Tabs>
  );
}
