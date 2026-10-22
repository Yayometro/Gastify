import { FontAwesome6, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, usePathname } from 'expo-router';
import { type ReactNode } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View, useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';

import { authClient } from '@/auth-client';
import { GlassSurface } from '@/components/ui/glass';
import { Colors } from '@/constants/theme';
import { useThemeMode } from '@/hooks/use-theme-mode';
import type { RootState } from '@/store';
import type { UserData } from '@gastify/core/features/userSlice';
import { initialsOf } from '@gastify/core/profile/profileForm';

export const SIDE_NAV_WIDTH = 84;

type Item = { key: string; label: string; href: string; active: (path: string) => boolean; icon: (color: string) => ReactNode };

const is = (path: string, prefix: string) => path === prefix || path.startsWith(`${prefix}/`);

// The web's left column on wide screens (iPad, landscape phones), in the web's own order: the profile on top,
// Movimientos, Wallet, Presupuestos, Proyecciones, the "+" in the middle, Cuentas, Historial, Categorías, the
// light / dark switch and sign out, spread over the whole height (the web's `justify-between`).
const BEFORE_ADD: Item[] = [
  { key: 'movements', label: 'Movimientos', href: '/movements', active: (p) => is(p, '/movements'), icon: (c) => <FontAwesome6 name="money-bill-transfer" size={24} color={c} /> },
  { key: 'wallet', label: 'Wallet', href: '/', active: (p) => p === '/' || p === '/index', icon: (c) => <FontAwesome6 name="wallet" size={22} color={c} /> },
  { key: 'budgets', label: 'Presupuestos', href: '/budgets', active: (p) => is(p, '/budgets'), icon: (c) => <MaterialIcons name="savings" size={27} color={c} /> },
  { key: 'projections', label: 'Proyecciones', href: '/more/projections', active: (p) => is(p, '/more/projections'), icon: (c) => <MaterialIcons name="auto-graph" size={27} color={c} /> },
  { key: 'analyzer', label: 'Analizador de cartera', href: '/more/analyzer', active: (p) => is(p, '/more/analyzer'), icon: (c) => <FontAwesome6 name="magnifying-glass-chart" size={22} color={c} /> },
];
const AFTER_ADD: Item[] = [
  { key: 'accounts', label: 'Cuentas', href: '/more/accounts', active: (p) => is(p, '/more/accounts'), icon: (c) => <MaterialIcons name="account-balance" size={26} color={c} /> },
  { key: 'history', label: 'Historial', href: '/more/history', active: (p) => is(p, '/more/history'), icon: (c) => <FontAwesome6 name="clock-rotate-left" size={22} color={c} /> },
  { key: 'categories', label: 'Categorías', href: '/more/categories', active: (p) => is(p, '/more/categories'), icon: (c) => <MaterialIcons name="category" size={26} color={c} /> },
];

export function SideNav() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  const dark = scheme === 'dark';
  const colors = Colors[dark ? 'dark' : 'light'];
  const { setMode } = useThemeMode();
  const user = useSelector((state: RootState) => state.userReducer.data) as UserData | null;

  const iconButton = (key: string, label: string, onPress: () => void, icon: ReactNode, active = false) => (
    <Pressable
      key={key}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
      onPress={onPress}
      hitSlop={6}
      style={styles.item}>
      {/* The selected item: a small, rounded, almost-square pill behind the icon (same width, less height). */}
      {active && <View pointerEvents="none" style={[styles.pill2, dark ? styles.activeDark : { backgroundColor: colors.accentSoft }]} />}
      {icon}
    </Pressable>
  );
  const navItem = (item: Item) => iconButton(item.key, item.label, () => router.navigate(item.href as never), item.icon(item.active(pathname) ? (dark ? '#ffffff' : colors.accent) : dark ? 'rgba(255,255,255,0.88)' : colors.text), item.active(pathname));
  const profileActive = is(pathname, '/more/profile');

  return (
    <View style={[styles.wrap, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 12 }]}>
      {/* The pill floats: a soft shadow cast outward, as the web's side bar has. */}
      <View style={[styles.pill, styles.shadow]}>
      <GlassSurface variant="nav" radius={32} style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.inner}>
          <Pressable accessibilityRole="button" accessibilityLabel="Perfil" onPress={() => router.navigate('/more/profile')} style={[styles.profile, profileActive && (dark ? styles.activeDark : { backgroundColor: colors.accentSoft })]}>
            {user?.image ? (
              <Image source={{ uri: user.image }} alt="Tu foto de perfil" style={styles.avatar} contentFit="cover" />
            ) : (
              <View style={[styles.avatar, { backgroundColor: '#7e22ce', alignItems: 'center', justifyContent: 'center' }]}>
                <Text className="font-inter-bold text-sm" style={{ color: '#ffffff' }}>{initialsOf(user?.fullName)}</Text>
              </View>
            )}
            <Text className="font-inter text-[10px] text-gf-text" numberOfLines={1} style={{ maxWidth: 64 }}>{user?.fullName?.split(' ')[0] ?? 'Perfil'}</Text>
          </Pressable>
          {BEFORE_ADD.map(navItem)}
          {iconButton('add', 'Agregar un movimiento', () => router.navigate('/add' as never), (
            <View style={styles.fabShadow}>
              <LinearGradient colors={dark ? ['#e879f9', '#a855f7', '#7e22ce'] : ['#e879f9', '#9333ea']} start={{ x: 0.2, y: 0 }} end={{ x: 0.6, y: 1 }} style={styles.fab}>
                <Ionicons name="add" size={36} color="#ffffff" />
              </LinearGradient>
            </View>
          ), is(pathname, '/add'))}
          {AFTER_ADD.map(navItem)}
          {iconButton('theme', dark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro', () => setMode(dark ? 'light' : 'dark'), <Ionicons name={dark ? 'sunny-outline' : 'moon-outline'} size={26} color={colors.text} />)}
          {iconButton('signout', 'Cerrar sesión', () => authClient.signOut(), <Ionicons name="log-out-outline" size={26} color={colors.text} />)}
        </ScrollView>
      </GlassSurface>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: SIDE_NAV_WIDTH, alignItems: 'center', paddingLeft: 8 },
  pill: { flex: 1, width: SIDE_NAV_WIDTH - 8 },
  inner: { flexGrow: 1, alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, gap: 8 },
  profile: { alignItems: 'center', gap: 2, paddingVertical: 4, paddingHorizontal: 6, borderRadius: 20 },
  avatar: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: '#a855f7' },
  item: { width: 66, height: 70, borderRadius: 33, alignItems: 'center', justifyContent: 'center' },
  // The selected item: the same violet pill with a light edge as the phone's bar.
  activeDark: { backgroundColor: 'rgba(168,85,247,0.55)', borderWidth: 1, borderColor: 'rgba(233,213,255,0.55)' },
  pill2: { position: 'absolute', width: 60, height: 46, borderRadius: 16 },
  fab: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  // The raised, three-dimensional look of the web's "+" and the phone bar's: a violet glow under the gradient.
  fabShadow: Platform.select({ ios: { shadowColor: '#7e22ce', shadowOpacity: 0.6, shadowRadius: 12, shadowOffset: { width: 0, height: 6 } }, default: { elevation: 10 } }) as object,
  // The same shadow as the phone bar's.
  shadow: Platform.select({ ios: { shadowColor: '#000000', shadowOpacity: 0.5, shadowRadius: 16, shadowOffset: { width: 4, height: 6 } }, default: { elevation: 12 } }) as object,
});
