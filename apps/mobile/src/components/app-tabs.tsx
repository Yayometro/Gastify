import { FontAwesome6, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Tabs } from 'expo-router';
import type { ReactNode } from 'react';
import { Animated, type ColorValue, Easing, StyleSheet, useColorScheme, useWindowDimensions, View } from 'react-native';

import { FloatingTabBar } from '@/components/floating-tab-bar';
import { SideNav } from '@/components/side-nav';
import { ToolsFab } from '@/components/tools/tools-fab';
import { Colors } from '@/constants/theme';
import { useBudgetAlerts } from '@/hooks/use-budget-alerts';
import { useLoadAppData } from '@/hooks/use-load-app-data';
import { useRecurringSync } from '@/hooks/use-recurring-sync';
import { RecurringPendingSheet } from '@/components/recurring/pending-sheet';
import { useT } from '@/i18n/client';

const ICON_SIZE = 25;

// Every tab switch slides and fades the same way: the screen of a tab further right enters from the right and the
// one it replaces leaves to the left (and the other way around going back). One interpolator for all of them keeps
// "Más" from animating differently from the rest.
const SLIDE_PX = 72;
const slideBetweenTabs = ({ current }: { current: { progress: Animated.Value } }) => ({
  sceneStyle: {
    opacity: current.progress.interpolate({ inputRange: [-1, 0, 1], outputRange: [0, 1, 0] }),
    transform: [{ translateX: current.progress.interpolate({ inputRange: [-1, 0, 1], outputRange: [-SLIDE_PX, 0, SLIDE_PX] }) }],
  },
});

// Gastify's bottom bar, drawn like the web app's mobile navbar: a floating rounded bar with
// icons only (same icon families as the web: FaWallet, FaMoneyBillTransfer, MdSavings, IoAdd),
// a purple gradient "+" in the middle, and a soft purple highlight behind the active icon.
export default function AppTabs() {
  const t = useT();
  // Only rendered for a signed-in, unlocked session (see AuthGate): the data loads start here, once.
  useLoadAppData();
  useBudgetAlerts();
  useRecurringSync();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  // Wide screens (iPad, landscape) get the web's left column instead of the floating bar.
  const wide = useWindowDimensions().width >= 768;
  const colors = Colors[isDark ? 'dark' : 'light'];

  // The icon of a regular tab; the active one gets the soft accent background.
  const glyph = (render: (color: string) => ReactNode) =>
    function TabGlyph({ focused, color }: { focused: boolean; color: ColorValue }) {
      return (
        <View style={styles.glyph}>
          {/* Always mounted, only its opacity changes: Android drops the rounded corners of a
              background that is switched on after the first render. */}
          <View style={[styles.highlight, isDark ? styles.highlightDark : { backgroundColor: colors.accentSoft }, { opacity: focused ? 1 : 0 }]} />
          {render(color as string)}
        </View>
      );
    };

  // Same colors as the web's .gf-glass-fab: three stops in dark mode, two in light.
  const fab = function AddGlyph() {
    return (
      <LinearGradient
        colors={isDark ? ['#e879f9', '#a855f7', '#7e22ce'] : ['#e879f9', '#9333ea']}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.6, y: 1 }}
        style={styles.fab}>
        <Ionicons name="add" size={32} color="#ffffff" />
      </LinearGradient>
    );
  };

  const tabs = (
    <Tabs tabBar={wide ? () => null : (props) => <FloatingTabBar {...props} />} screenOptions={wide ? { headerShown: false, animation: 'none' } : { headerShown: false, animation: 'shift', sceneStyleInterpolator: slideBetweenTabs, transitionSpec: { animation: 'timing', config: { duration: 280, easing: Easing.out(Easing.cubic) } } }}>
      <Tabs.Screen
        name="index"
        options={{
          title: t("shared.start"),
          tabBarAccessibilityLabel: t("shared.start"),
          tabBarIcon: glyph((color) => <FontAwesome6 name="wallet" size={ICON_SIZE - 2} color={color} />),
        }}
      />
      <Tabs.Screen
        name="movements"
        options={{
          title: t("mobile.movimientos"),
          tabBarAccessibilityLabel: t("mobile.movimientos"),
          // A tab is an entry point to its list, not to the last detail opened from Inicio.
          popToTopOnBlur: true,
          tabBarIcon: glyph((color) => <FontAwesome6 name="money-bill-transfer" size={ICON_SIZE - 2} color={color} />),
        }}
      />
      <Tabs.Screen
        name="add"
        options={{ title: t("budgets.add"), tabBarAccessibilityLabel: t("mobile.agregar.un.movimiento"), tabBarIcon: fab }}
      />
      <Tabs.Screen
        name="budgets"
        options={{
          title: t("budgets.title"),
          tabBarAccessibilityLabel: t("budgets.title"),
          popToTopOnBlur: true,
          tabBarIcon: glyph((color) => <MaterialIcons name="savings" size={ICON_SIZE + 3} color={color} />),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: t("mobile.mas"),
          tabBarAccessibilityLabel: t("mobile.mas"),
          popToTopOnBlur: true,
          tabBarIcon: glyph((color) => <Ionicons name="ellipsis-horizontal" size={ICON_SIZE + 2} color={color} />),
        }}
      />
      {/* Template leftover (src/app/explore.tsx): kept out of the bar until the file is removed. */}
      <Tabs.Screen name="explore" options={{ href: null }} />
    </Tabs>
  );

  if (!wide) {
    return (
      <View style={{ flex: 1 }}>
        {tabs}
        <ToolsFab />
        <RecurringPendingSheet />
      </View>
    );
  }
  return (
    <View style={{ flex: 1, flexDirection: 'row' }}>
      <SideNav />
      <View style={{ flex: 1 }}>{tabs}</View>
      <ToolsFab />
      <RecurringPendingSheet />
    </View>
  );
}

const styles = StyleSheet.create({
  glyph: {
    width: 52,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // The active mark is a narrow pill (42 × 40), the same as the bar's extra sections.
  highlight: {
    position: 'absolute',
    top: 2,
    left: 5,
    width: 42,
    height: 40,
    borderRadius: 20,
  },
  // The selected tab: a clear violet pill with a light edge, so it stands out on the dark bar.
  highlightDark: {
    backgroundColor: 'rgba(168,85,247,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(233,213,255,0.55)',
  },
  fab: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7e22ce',
    shadowOpacity: 0.55,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 8,
  },
});
