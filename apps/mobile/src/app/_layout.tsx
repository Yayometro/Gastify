import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, useFonts } from '@expo-google-fonts/inter';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { View, useColorScheme } from 'react-native';
import { Provider } from 'react-redux';

import '@/global.css';

import { AmbientBackground, DARK_BASE } from '@/components/ambient-background';
import AppTabs from '@/components/app-tabs';
import { AuthGate } from '@/components/auth/auth-gate';
import { ToastProvider } from '@/components/toast';
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
    // Dark mode: transparent screens, the mesh drawn once by the root view below shows through them.
    colors: { ...baseTheme.colors, background: colorScheme === 'dark' ? 'transparent' : colors.background, card: colors.backgroundElement, text: colors.text, border: colors.border },
  };

  // Inter, the same typeface as the web app. The splash screen stays until it is loaded.
  const [fontsLoaded] = useFonts({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold });
  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <Provider store={store}>
      <View style={{ flex: 1, backgroundColor: colorScheme === 'dark' ? DARK_BASE : colors.background }}>
        <AmbientBackground />
        <ThemeProvider value={theme}>
          <ToastProvider>
            <AuthGate>
              <AppTabs />
            </AuthGate>
          </ToastProvider>
        </ThemeProvider>
      </View>
    </Provider>
  );
}
