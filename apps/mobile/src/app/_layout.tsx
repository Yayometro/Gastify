import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, useFonts } from '@expo-google-fonts/inter';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { Provider } from 'react-redux';

import '@/global.css';

import AppTabs from '@/components/app-tabs';
import { AuthGate } from '@/components/auth/auth-gate';
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

  // Inter, the same typeface as the web app. The splash screen stays until it is loaded.
  const [fontsLoaded] = useFonts({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold });
  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <Provider store={store}>
      <ThemeProvider value={theme}>
        <AuthGate>
          <AppTabs />
        </AuthGate>
      </ThemeProvider>
    </Provider>
  );
}
