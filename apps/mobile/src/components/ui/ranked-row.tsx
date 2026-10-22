import type { ReactNode } from 'react';
import { Text, View, useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';

// One line of a Top list, as on the web: its position (1, 2, 3...) on the left of the icon and a thin line above and
// below. Pass `last` on the final row so the line between two rows is drawn once.
export function RankedRow({ rank, last = false, children }: { rank: number; last?: boolean; children: ReactNode }) {
  const dark = useColorScheme() === 'dark';
  const colors = Colors[dark ? 'dark' : 'light'];
  void last;
  // Each row is its own glass tile (like the movements), with its number on the left.
  return (
    <View
      className="flex-row items-center gap-2 rounded-2xl px-2"
      style={{ marginVertical: 3, minHeight: 68, backgroundColor: dark ? 'rgba(255,255,255,0.08)' : colors.backgroundElement, borderWidth: 1, borderColor: dark ? 'rgba(255,255,255,0.10)' : colors.border }}>
      <Text className="w-6 text-center font-inter-bold text-sm text-gf-text-muted">{rank}</Text>
      <View className="flex-1">{children}</View>
    </View>
  );
}
