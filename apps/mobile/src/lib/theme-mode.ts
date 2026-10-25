import * as SecureStore from 'expo-secure-store';
import { Appearance } from 'react-native';

// The light / dark choice of the person. "system" follows the phone; the other two force a mode.
export type ThemeMode = 'light' | 'dark' | 'system';

const KEY = 'gastify-theme-mode';

export async function loadThemeMode(): Promise<ThemeMode> {
  try {
    const saved = await SecureStore.getItemAsync(KEY);
    return saved === 'light' || saved === 'dark' ? saved : 'system';
  } catch {
    return 'system';
  }
}

// Applies the mode to the whole app: every useColorScheme() reads it from here.
export function applyThemeMode(mode: ThemeMode): void {
  // 'unspecified' clears the override (back to the phone's setting). null is not accepted by the native module.
  Appearance.setColorScheme(mode === 'system' ? 'unspecified' : mode);
}

export async function saveThemeMode(mode: ThemeMode): Promise<void> {
  applyThemeMode(mode);
  try {
    if (mode === 'system') await SecureStore.deleteItemAsync(KEY);
    else await SecureStore.setItemAsync(KEY, mode);
  } catch {
    // Not saved: the choice still applies until the app restarts.
  }
}
