import { FontAwesome6, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router';
import { type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View, useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { authClient } from '@/auth-client';
import { GlassSurface } from '@/components/ui/glass';
import { Colors } from '@/constants/theme';
import { useThemeMode } from '@/hooks/use-theme-mode';

export const SIDE_NAV_WIDTH = 84;

type Item = { key: string; label: string; href: string; active: (path: string) => boolean; icon: (color: string) => ReactNode };

const is = (path: string, prefix: string) => path === prefix || path.startsWith(`${prefix}/`);

// The web's left column on wide screens (iPad, landscape phones): the same icons in the same order, a
// glass pill with the active section highlighted. "+" opens the create hub, the same as the web's button.
const ITEMS: Item[] = [
  { key: 'wallet', label: 'Inicio', href: '/', active: (p) => p === '/' || p === '/index', icon: (c) => <FontAwesome6 name="wallet" size={22} color={c} /> },
  { key: 'movements', label: 'Movimientos', href: '/movements', active: (p) => is(p, '/movements'), icon: (c) => <FontAwesome6 name="money-bill-transfer" size={22} color={c} /> },
  { key: 'budgets', label: 'Presupuestos', href: '/budgets', active: (p) => is(p, '/budgets'), icon: (c) => <MaterialIcons name="savings" size={26} color={c} /> },
  { key: 'projections', label: 'Proyecciones', href: '/more/projections', active: (p) => is(p, '/more/projections'), icon: (c) => <MaterialIcons name="auto-graph" size={26} color={c} /> },
  { key: 'accounts', label: 'Cuentas', href: '/more/accounts', active: (p) => is(p, '/more/accounts'), icon: (c) => <MaterialIcons name="account-balance" size={24} color={c} /> },
  { key: 'history', label: 'Historial', href: '/more/history', active: (p) => is(p, '/more/history'), icon: (c) => <FontAwesome6 name="clock-rotate-left" size={21} color={c} /> },
  { key: 'categories', label: 'Categorías', href: '/more/categories', active: (p) => is(p, '/more/categories'), icon: (c) => <Ionicons name="pricetags-outline" size={24} color={c} /> },
];

export function SideNav() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  const dark = scheme === 'dark';
  const colors = Colors[dark ? 'dark' : 'light'];
  const { setMode } = useThemeMode();

  const iconButton = (key: string, label: string, onPress: () => void, icon: ReactNode, active = false) => (
    <Pressable
      key={key}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
      onPress={onPress}
      hitSlop={6}
      style={[styles.item, active && { backgroundColor: colors.accentSoft }]}>
      {icon}
    </Pressable>
  );

  return (
    <View style={[styles.wrap, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 12 }]}>
      <GlassSurface variant="nav" radius={32} style={styles.pill}>
        <View style={styles.inner}>
          {iconButton('profile', 'Perfil', () => router.navigate('/more/profile'), <Ionicons name="person-circle-outline" size={30} color={colors.text} />, is(pathname, '/more/profile'))}
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.middle}>
            {ITEMS.map((item) => iconButton(item.key, item.label, () => router.navigate(item.href as never), item.icon(item.active(pathname) ? colors.accent : colors.text), item.active(pathname)))}
            {iconButton('add', 'Agregar un movimiento', () => router.navigate('/add' as never), (
              <View style={styles.fab}>
                <Ionicons name="add" size={26} color="#ffffff" />
              </View>
            ))}
          </ScrollView>
          {iconButton('theme', dark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro', () => setMode(dark ? 'light' : 'dark'), <Ionicons name={dark ? 'sunny-outline' : 'moon-outline'} size={24} color={colors.text} />)}
          {iconButton('signout', 'Cerrar sesión', () => authClient.signOut(), <Ionicons name="log-out-outline" size={24} color={colors.text} />)}
        </View>
      </GlassSurface>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: SIDE_NAV_WIDTH, alignItems: 'center', paddingLeft: 8 },
  pill: { flex: 1, width: SIDE_NAV_WIDTH - 8, maxHeight: '100%' },
  inner: { flex: 1, alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, gap: 6 },
  middle: { alignItems: 'center', gap: 10, paddingVertical: 4 },
  item: { width: 56, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  fab: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: '#9333ea' },
});
