import type { ReactNode } from 'react';
import { Text, View, useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';

// One line of a Top list, as on the web: its position (1, 2, 3...) on the left of the icon and a thin line above and
// below. Pass `last` on the final row so the line between two rows is drawn once.
export function RankedRow({ rank, last = false, children }: { rank: number; last?: boolean; children: ReactNode }) {
  const colors = Colors[useColorScheme() === 'dark' ? 'dark' : 'light'];
  return (
    <View className="flex-row items-center gap-2" style={{ borderTopWidth: 1, borderTopColor: colors.border, borderBottomWidth: last ? 1 : 0, borderBottomColor: colors.border, paddingVertical: 4 }}>
      <Text className="w-6 text-center font-inter-bold text-sm text-gf-text-muted">{rank}</Text>
      <View className="flex-1">{children}</View>
    </View>
  );
}
