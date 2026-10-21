import { FontAwesome6, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Tabs } from 'expo-router';
import type { ReactNode } from 'react';
import { Animated, type ColorValue, Easing, StyleSheet, useColorScheme, useWindowDimensions, View } from 'react-native';

import { FloatingTabBar } from '@/components/floating-tab-bar';
import { SideNav } from '@/components/side-nav';
import { ToolsFab } from '@/components/tools/tools-fab';
import { Colors } from '@/constants/theme';
import { useLoadAppData } from '@/hooks/use-load-app-data';

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
  // Only rendered for a signed-in, unlocked session (see AuthGate): the data loads start here, once.
  useLoadAppData();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  // Wide screens (iPad, landscape) get the web's left column instead of the floating bar.
  const wide = useWindowDimensions().width >= 768;
  const colors = Colors[isDark ? 'dark' : 'light'];

  // The icon of a regular tab; the active one gets the soft accent background.
  const glyph = (render: (color: ColorValue) => ReactNode) =>
    function TabGlyph({ focused, color }: { focused: boolean; color: ColorValue }) {
      return (
        <View style={styles.glyph}>
          {/* Always mounted, only its opacity changes: Android drops the rounded corners of a
              background that is switched on after the first render. */}
          <View style={[styles.highlight, isDark ? styles.highlightDark : { backgroundColor: colors.accentSoft }, { opacity: focused ? 1 : 0 }]} />
          {render(color)}
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
    <Tabs tabBar={wide ? () => null : (props) => <FloatingTabBar {...props} />} screenOptions={{ headerShown: false, animation: 'shift', sceneStyleInterpolator: slideBetweenTabs, transitionSpec: { animation: 'timing', config: { duration: 280, easing: Easing.out(Easing.cubic) } } }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarAccessibilityLabel: 'Inicio',
          tabBarIcon: glyph((color) => <FontAwesome6 name="wallet" size={ICON_SIZE - 2} color={color} />),
        }}
      />
      <Tabs.Screen
        name="movements"
        options={{
          title: 'Movimientos',
          tabBarAccessibilityLabel: 'Movimientos',
          // A tab is an entry point to its list, not to the last detail opened from Inicio.
          popToTopOnBlur: true,
          tabBarIcon: glyph((color) => <FontAwesome6 name="money-bill-transfer" size={ICON_SIZE - 2} color={color} />),
        }}
      />
      <Tabs.Screen
        name="add"
        options={{ title: 'Agregar', tabBarAccessibilityLabel: 'Agregar un movimiento', tabBarIcon: fab }}
      />
      <Tabs.Screen
        name="budgets"
        options={{
          title: 'Presupuestos',
          tabBarAccessibilityLabel: 'Presupuestos',
          popToTopOnBlur: true,
          tabBarIcon: glyph((color) => <MaterialIcons name="savings" size={ICON_SIZE + 3} color={color} />),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'Más',
          tabBarAccessibilityLabel: 'Más',
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
      </View>
    );
  }
  return (
    <View style={{ flex: 1, flexDirection: 'row' }}>
      <SideNav />
      <View style={{ flex: 1 }}>{tabs}</View>
      <ToolsFab />
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
  highlight: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: 22,
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
