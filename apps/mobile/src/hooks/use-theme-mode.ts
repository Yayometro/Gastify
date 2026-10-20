import { useCallback, useEffect, useState } from 'react';

import { loadThemeMode, saveThemeMode, type ThemeMode } from '@/lib/theme-mode';

// The saved light / dark choice, and a setter that applies and saves it.
export function useThemeMode() {
  const [mode, setModeState] = useState<ThemeMode>('system');

  useEffect(() => {
    loadThemeMode().then(setModeState);
  }, []);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    saveThemeMode(next);
  }, []);

  return { mode, setMode };
}
