import type { ViewStyle } from 'react-native';

// The flat fill of a small control (a chip, a segmented bar, a button) as frosted glass in dark mode: a translucent white
// wash and a hairline edge, like the web's `.gf-glass-card`. Light mode keeps the plain surface.
export function glassFill(dark: boolean, surface: string): ViewStyle {
  return dark ? { backgroundColor: 'rgba(255,255,255,0.10)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)' } : { backgroundColor: surface };
}
