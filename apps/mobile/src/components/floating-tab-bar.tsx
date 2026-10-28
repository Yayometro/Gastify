import { Tabs, router, usePathname } from 'expo-router';
import { useT } from '@/i18n/client';
import { Fragment, type ComponentProps, type ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, useColorScheme, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassSurface } from '@/components/ui/glass';
import { Colors } from '@/constants/theme';
import { NAV_ICON } from '@/lib/nav-icons';
import { emitTabReselect } from '@/lib/tab-reselect';

type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

const BAR_HEIGHT = 64;
// From this width (the largest iPhones) the bar also holds Proyecciones and the Analizador.
const WIDE_BAR_MIN_WIDTH = 428;

// Where each tab opens: a second tap on a tab already open goes back to this page, scrolls up and refreshes.
const LANDING: Record<string, string> = { index: '/', movements: '/movements', budgets: '/budgets', more: '/more' };


// Gastify's bottom bar: a rounded bar floating above the bottom edge with icons only, like the web app's mobile navbar.
// Wide bar order: Inicio, Movimientos, Proyecciones, "+", Presupuestos, Analizador, Más (always the last, at the right).
export function FloatingTabBar({ state, descriptors, emitter, navigateToTab }: TabBarProps) {
  const t = useT();
  // The two extra sections of the wide bar. Both live under "Más", so the bar marks them by path and not by the tab.
  const EXTRA = {
    projections: { href: '/more/projections', label: t("analyzer.projections"), glyph: (color: string) => NAV_ICON.projections(color, 24) },
    analyzer: { href: '/more/analyzer', label: t("mobile.analizador.de.cartera"), glyph: (color: string) => NAV_ICON.analyzer(color, 24) },
  } as const;
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const colors = Colors[isDark ? 'dark' : 'light'];
  const insets = useSafeAreaInsets();
  // Just above the iPhone home indicator (its safe-area inset is ~34, the bar sits ~12 below that
  // edge, so the indicator stays visible below the pill). On Android the system navigation takes
  // the inset, so the bar goes a little above it.
  const bottom = Platform.OS === 'ios' ? Math.max(insets.bottom - 12, 12) : insets.bottom + 6;
  const pathname = usePathname();
  const wideBar = useWindowDimensions().width >= WIDE_BAR_MIN_WIDTH;
  const inactive = isDark ? 'rgba(255,255,255,0.88)' : colors.textSecondary;
  const activeColor = isDark ? '#ffffff' : colors.accent;
  const onExtra = (key: keyof typeof EXTRA) => pathname.startsWith(EXTRA[key].href);
  const anyExtra = onExtra('projections') || onExtra('analyzer');

  const extra = (key: keyof typeof EXTRA) => {
    const item = EXTRA[key];
    const active = onExtra(key);
    return (
      <Pressable
        key={key}
        accessibilityRole="button"
        accessibilityLabel={item.label}
        accessibilityState={{ selected: active }}
        onPress={() => (active ? emitTabReselect(item.href) : router.navigate(item.href as never))}
        style={styles.item}>
        <View style={styles.glyph}>
          <View style={[styles.pill, isDark ? styles.pillDark : { backgroundColor: colors.accentSoft }, { opacity: active ? 1 : 0 }]} />
          {item.glyph(active ? activeColor : inactive)}
        </View>
      </Pressable>
    );
  };

  return (
    <View pointerEvents="box-none" style={[styles.wrap, { bottom }]}>
      <View
        style={[
          { borderRadius: BAR_HEIGHT / 2 },
          Platform.select({
            ios: {
              shadowColor: '#000000',
              shadowOpacity: isDark ? 0.5 : 0.18,
              shadowRadius: 16,
              shadowOffset: { width: 0, height: 6 },
            },
            default: { elevation: 12 },
          }),
        ]}>
        <GlassSurface variant="nav" radius={BAR_HEIGHT / 2} style={styles.bar}>
          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];
            // Screens hidden with `href: null` come through as display: 'none'.
            if (StyleSheet.flatten(options.tabBarItemStyle)?.display === 'none') return null;

            // "Más" is not the open section while one of its two extra sections is on screen.
            const focused = state.index === index && !(route.name === 'more' && anyExtra);
            const landing = LANDING[route.name];
            const onPress = () => {
              const event = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (event.defaultPrevented) return;
              // Tapping the section that is already open: back to its top and a refresh.
              if (focused && landing && pathname === landing) {
                emitTabReselect(landing);
                return;
              }
              // A tab always opens its landing page, even when a detail in that tab was opened
              // from another section. Merely navigating to the tab preserves its nested stack.
              if (landing && (route.name === 'movements' || route.name === 'budgets' || route.name === 'more')) {
                router.navigate(landing as never);
                return;
              }
              if (!focused) navigateToTab(route.key);
            };

            return (
              <Fragment key={route.key}>
                <Pressable accessibilityRole="button" accessibilityLabel={options.tabBarAccessibilityLabel ?? options.title} accessibilityState={{ selected: focused }} onPress={onPress} style={styles.item}>
                  {options.tabBarIcon?.({ focused, color: focused ? activeColor : inactive, size: 24 }) as ReactNode}
                </Pressable>
                {wideBar && route.name === 'movements' && extra('projections')}
                {wideBar && route.name === 'budgets' && extra('analyzer')}
              </Fragment>
            );
          })}
        </GlassSurface>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 16,
    right: 16,
  },
  bar: {
    height: BAR_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
  },
  item: {
    flex: 1,
    height: BAR_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glyph: {
    width: 52,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // The active mark: a narrow pill (42 × 40), the same as the tabs'.
  pill: {
    position: 'absolute',
    top: 2,
    left: 5,
    width: 42,
    height: 40,
    borderRadius: 20,
  },
  pillDark: {
    backgroundColor: 'rgba(168,85,247,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(233,213,255,0.55)',
  },
});
