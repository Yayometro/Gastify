import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode, Ref } from 'react';
import { Platform, StyleSheet, View, type HostInstance, type StyleProp, type ViewStyle, useColorScheme } from 'react-native';

// The web's frosted-glass panes (`.gf-glass-card`, `.gf-nav-surface`), in dark mode only:
// a translucent white wash over the mesh background, a soft top highlight and a hairline border.
// On iPhone the blur is real (BlurView); on Android blurring needs a dedicated target view, so there
// the translucent wash alone does the job over the soft mesh. Light mode is a flat surface, like the web.
export function GlassSurface({
  children,
  style,
  radius = 24,
  variant = 'card',
  targetRef,
}: {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  radius?: number;
  variant?: 'card' | 'nav' | 'side';
  // The ref the guided tutorial measures to highlight this surface.
  targetRef?: Ref<HostInstance>;
}) {
  const scheme = useColorScheme();
  const dark = scheme === 'dark';

  // Android has no real blur here, so the floating bar uses the web's "smoked glass" (near-opaque
  // purple-black) instead of a see-through wash that would let the list text show through the icons.
  // The bar is see-through on both: the iPhone blurs what is behind and adds a dark wash; Android has no blur here, so
  // it gets the same dark wash, translucent enough to read as glass.
  const smoked = dark && variant === 'nav' && Platform.OS !== 'ios';
  const washColors: [string, string] = dark
    ? variant === 'side'
      ? ['rgba(255,255,255,0.22)', 'rgba(168,120,255,0.10)']
    : variant === 'nav'
      ? smoked
        ? ['rgba(78,52,140,0.46)', 'rgba(40,24,84,0.54)']
        : ['rgba(255,255,255,0.14)', 'rgba(70,40,130,0.20)']
      : ['rgba(255,255,255,0.14)', 'rgba(255,255,255,0.06)']
    : variant === 'nav'
      ? ['#ffffff', '#f1ecf9']
      : ['#ffffff', '#ffffff'];

  return (
    <View ref={targetRef} collapsable={false} style={[{ borderRadius: radius, overflow: 'hidden' }, style]}>
      {dark && Platform.OS === 'ios' && variant !== 'card' && (
        <BlurView intensity={variant === 'side' ? 90 : variant === 'nav' ? 70 : 30} tint="dark" style={StyleSheet.absoluteFill} />
      )}
      <LinearGradient colors={washColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} pointerEvents="none" />
      {dark && (
        <>
          <View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: radius, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }]} />
          <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: radius * 0.6, right: radius * 0.6, height: 1, backgroundColor: variant === 'side' ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.25)' }} />
        </>
      )}
      {children}
    </View>
  );
}
