import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { InfoTip, type InfoText } from '@/components/info-tip';
import { BottomTabInset, Colors, MaxContentWidth, TabletContentWidth } from '@/constants/theme';
import { useIsTablet } from '@/hooks/use-device-class';
import { useRefreshAppData } from '@/hooks/use-load-app-data';

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
  titleInfo,
  headerAction,
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
  // A "?" next to the title that explains the whole screen.
  titleInfo?: InfoText;
  // An action at the right of the title (the bell of Inicio).
  headerAction?: ReactNode;
  children?: ReactNode;
}) {
  const tablet = useIsTablet();
  // Every screen can be pulled down to reload the data; a screen with its own reload passes `onRefresh`.
  const appRefresh = useRefreshAppData();
  const scheme = useColorScheme();
  const iconColor = Colors[scheme === 'dark' ? 'dark' : 'light'].text;
  return (
    <View className="flex-1 bg-gf-bg">
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView
          contentContainerClassName="w-full gap-4 self-center p-6"
          contentContainerStyle={{ paddingBottom: BottomTabInset + 84, maxWidth: tablet ? TabletContentWidth : MaxContentWidth }}
          refreshControl={<RefreshControl refreshing={onRefresh ? refreshing : appRefresh.refreshing} onRefresh={onRefresh ?? appRefresh.refresh} />}>
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
              <View className="flex-row items-center gap-3">
                <Text className="font-inter-bold text-4xl text-gf-text">{title}</Text>
                {titleInfo ? <InfoTip info={titleInfo} /> : null}
                {headerAction ? <View className="ml-auto" style={{ marginRight: 56 }}>{headerAction}</View> : null}
              </View>
              {subtitle ? <Text className="font-inter text-base text-gf-text-muted">{subtitle}</Text> : null}
            </View>
          )}
          {children}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
