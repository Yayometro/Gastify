/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://unistyl.es/), etc.
 */


import { Platform } from 'react-native';

// Gastify palette: the same values as the web app's --gf-* tokens (src/app/globals.css).
export const Colors = {
  light: {
    text: '#1e1533',
    background: '#f4f2fa',
    backgroundElement: '#ffffff',
    backgroundSelected: '#f1ecf9',
    textSecondary: '#6b6280',
    accent: '#7e22ce',
    accentSoft: 'rgba(147, 51, 234, 0.08)',
    border: 'rgba(27, 16, 61, 0.1)',
    // Money in and out (the web's green and red for incomes and bills).
    income: '#059669',
    expense: '#e11d48',
  },
  dark: {
    text: '#f3f0fb',
    background: '#180f2e',
    backgroundElement: '#251a45',
    backgroundSelected: '#302354',
    textSecondary: '#ada0c9',
    accent: '#d3b8fb',
    accentSoft: 'rgba(147, 51, 234, 0.18)',
    border: 'rgba(255, 255, 255, 0.1)',
    income: '#34d399',
    expense: '#fb7185',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

// Room a screen leaves at the bottom for the floating tab bar (64 high + its offset + a gap).
export const BottomTabInset = Platform.select({ ios: 104, default: 112 });
export const MaxContentWidth = 800;
