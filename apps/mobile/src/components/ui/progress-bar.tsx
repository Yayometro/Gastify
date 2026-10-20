import { useColorScheme, View } from 'react-native';

import { Colors } from '@/constants/theme';

// A budget's bar: the fill is capped at the full width; going over the goal is shown by the color
// that the caller picks (getBudgetBarColor), not by a longer bar.
export function ProgressBar({ ratio, color }: { ratio: number; color: string }) {
  const scheme = useColorScheme();
  const track = Colors[scheme === 'dark' ? 'dark' : 'light'].border;
  const fill = Math.min(Math.max(Number.isFinite(ratio) ? ratio : 0, 0), 1);
  return (
    <View className="h-2.5 overflow-hidden rounded-full" style={{ backgroundColor: track }}>
      <View className="rounded-full" style={{ height: '100%', width: `${fill * 100}%`, backgroundColor: color }} />
    </View>
  );
}
