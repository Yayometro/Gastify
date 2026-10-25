import type { ReactNode } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BottomTabInset, MaxContentWidth } from '@/constants/theme';

// Shared layout for the tab screens that are still empty. Styled with NativeWind classes that
// use the same color tokens as the web app (bg-gf-bg, text-gf-text, ...) and Inter.
export function PlaceholderScreen({
  title,
  text,
  children,
}: {
  title: string;
  text: string;
  children?: ReactNode;
}) {
  return (
    <View className="flex-1 bg-gf-bg">
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView
          contentContainerClassName="w-full gap-4 self-center p-6"
          contentContainerStyle={{ paddingBottom: BottomTabInset + 24, maxWidth: MaxContentWidth }}>
          <Text className="font-inter-bold text-4xl text-gf-text">{title}</Text>
          <Text className="font-inter text-base text-gf-text-muted">{text}</Text>
          {children}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
