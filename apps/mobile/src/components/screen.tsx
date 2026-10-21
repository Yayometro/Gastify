import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BottomTabInset, Colors, MaxContentWidth, TabletContentWidth } from '@/constants/theme';
import { useIsTablet } from '@/hooks/use-device-class';

// Layout shared by the phase 4 screens: a title, a line under it, and a scroll area that leaves room
// for the floating bar. Pulling down refreshes the data when onRefresh is given.
export function Screen({
  title,
  subtitle,
  refreshing = false,
  onRefresh,
  backLabel,
  onBack,
  hero,
  children,
}: {
  title: string;
  subtitle?: string;
  refreshing?: boolean;
  onRefresh?: () => void;
  // A screen opened from another one (Cuentas, from Más) shows a link back above its title.
  backLabel?: string;
  onBack?: () => void;
  // On the tablet, a screen can replace its title with the web's own hero (the Wallet's name and panels).
  hero?: ReactNode;
  children?: ReactNode;
}) {
  const tablet = useIsTablet();
  const scheme = useColorScheme();
  const iconColor = Colors[scheme === 'dark' ? 'dark' : 'light'].text;
  return (
    <View className="flex-1 bg-gf-bg">
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView
          contentContainerClassName="w-full gap-4 self-center p-6"
          contentContainerStyle={{ paddingBottom: BottomTabInset + 84, maxWidth: tablet ? TabletContentWidth : MaxContentWidth }}
          refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} /> : undefined}>
          {onBack ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={backLabel ? `Volver a ${backLabel}` : 'Volver'}
              onPress={onBack}
              hitSlop={8}
              className="-ml-1 flex-row items-center gap-1 self-start">
              <Ionicons name="chevron-back" size={22} color={iconColor} />
              <Text className="font-inter-medium text-base text-gf-text">{backLabel ?? 'Volver'}</Text>
            </Pressable>
          ) : null}
          {tablet && hero ? hero : (
            <View className="gap-1">
              <Text className="font-inter-bold text-4xl text-gf-text">{title}</Text>
              {subtitle ? <Text className="font-inter text-base text-gf-text-muted">{subtitle}</Text> : null}
            </View>
          )}
          {children}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
