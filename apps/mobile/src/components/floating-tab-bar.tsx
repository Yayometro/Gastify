import { Tabs, router, usePathname } from 'expo-router';
import type { ComponentProps, ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, useColorScheme, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassSurface } from '@/components/ui/glass';
import { Colors } from '@/constants/theme';
import { NAV_ICON } from '@/lib/nav-icons';

type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

const BAR_HEIGHT = 64;
// From this width (the largest iPhones) the bar also holds Proyecciones at the left and the Analizador at the right.
const WIDE_BAR_MIN_WIDTH = 428;

// Gastify's bottom bar: a rounded bar floating above the bottom edge with icons only, like the
// web app's mobile navbar. It only draws the bar; each screen sets its own icon (tabBarIcon)
// in app-tabs.tsx, and Expo Router still handles the navigation.
export function FloatingTabBar({ state, descriptors, navigation }: TabBarProps) {
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
  // The two extra sections of the wide bar: the same glyph and the same active mark as the rest of the bar.
  const extra = (key: string, href: '/more/projections' | '/more/analyzer', label: string, glyph: (color: string) => ReactNode) => {
    const active = pathname.startsWith(href);
    return (
      <Pressable key={key} accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ selected: active }} onPress={() => router.navigate(href)} style={styles.item}>
        <View style={[styles.extraGlyph, { backgroundColor: active ? colors.accentSoft : 'transparent' }]}>{glyph(active ? activeColor : inactive)}</View>
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
        {wideBar && extra('projections', '/more/projections', 'Proyecciones', (color) => NAV_ICON.projections(color, 24))}
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          // Screens hidden with `href: null` come through as display: 'none'.
          if (StyleSheet.flatten(options.tabBarItemStyle)?.display === 'none') return null;

          const focused = state.index === index;
          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (event.defaultPrevented) return;
            // A tab always opens its landing page, even when a detail in that tab was opened
            // from another section. Merely navigating to the tab preserves its nested stack.
            if (route.name === 'movements' || route.name === 'budgets' || route.name === 'more') {
              navigation.navigate(route.name, { screen: 'index' });
              return;
            }
            if (!focused) navigation.navigate(route.name, route.params);
          };

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityLabel={options.tabBarAccessibilityLabel ?? options.title}
              accessibilityState={{ selected: focused }}
              onPress={onPress}
              style={styles.item}>
              {options.tabBarIcon?.({
                focused,
                color: isDark ? (focused ? '#ffffff' : 'rgba(255,255,255,0.88)') : focused ? colors.accent : colors.textSecondary,
                size: 24,
              })}
            </Pressable>
          );
        })}
        {wideBar && extra('analyzer', '/more/analyzer', 'Analizador de cartera', (color) => NAV_ICON.analyzer(color, 24))}
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
  extraGlyph: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
