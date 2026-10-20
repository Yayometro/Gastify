import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle, useColorScheme } from 'react-native';

// The web's frosted-glass panes (`.gf-glass-card`, `.gf-nav-surface`), in dark mode only:
// a translucent white wash over the mesh background, a soft top highlight and a hairline border.
// On iPhone the blur is real (BlurView); on Android blurring needs a dedicated target view, so there
// the translucent wash alone does the job over the soft mesh. Light mode is a flat surface, like the web.
export function GlassSurface({
  children,
  style,
  radius = 24,
  variant = 'card',
}: {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  radius?: number;
  variant?: 'card' | 'nav';
}) {
  const scheme = useColorScheme();
  const dark = scheme === 'dark';

  // Android has no real blur here, so the floating bar uses the web's "smoked glass" (near-opaque
  // purple-black) instead of a see-through wash that would let the list text show through the icons.
  const smoked = dark && variant === 'nav' && Platform.OS !== 'ios';
  const washColors: [string, string] = dark
    ? variant === 'nav'
      ? smoked
        ? ['rgba(52,32,98,0.95)', 'rgba(30,18,60,0.97)']
        : ['rgba(255,255,255,0.09)', 'rgba(255,255,255,0.05)']
      : ['rgba(255,255,255,0.14)', 'rgba(255,255,255,0.06)']
    : variant === 'nav'
      ? ['#ffffff', '#f1ecf9']
      : ['#ffffff', '#ffffff'];

  return (
    <View style={[{ borderRadius: radius, overflow: 'hidden' }, style]}>
      {dark && Platform.OS === 'ios' && (
        <BlurView intensity={variant === 'nav' ? 45 : 30} tint="dark" style={StyleSheet.absoluteFill} />
      )}
      <LinearGradient colors={washColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} pointerEvents="none" />
      {dark && (
        <>
          <View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: radius, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }]} />
          <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: radius * 0.6, right: radius * 0.6, height: 1, backgroundColor: 'rgba(255,255,255,0.25)' }} />
        </>
      )}
      {children}
    </View>
  );
}
