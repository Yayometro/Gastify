import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { Provider } from 'react-redux';

import AppTabs from '@/components/app-tabs';
import { Colors } from '@/constants/theme';
import { store } from '@/store';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme === 'dark' ? 'dark' : 'light'];

  // The navigation screens use the Gastify palette instead of React Navigation's default colors.
  const baseTheme = colorScheme === 'dark' ? DarkTheme : DefaultTheme;
  const theme = {
    ...baseTheme,
    colors: { ...baseTheme.colors, background: colors.background, card: colors.backgroundElement, text: colors.text, border: colors.border },
  };

  // The first frame is ready: hide the splash screen.
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <Provider store={store}>
      <ThemeProvider value={theme}>
        <AppTabs />
      </ThemeProvider>
    </Provider>
  );
}
