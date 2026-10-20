import { useMemo, useRef, useState } from 'react';
import { PanResponder, Text, View, useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';

// A thin rail on the right edge of a long list: drag a finger along it to jump between its sections (the days of
// the movements list). A bubble shows the section under the finger. The rail has one tick per section, thinned out
// when there are too many to touch one by one.
export function DateRail({ labels, onJump, topInset = 0 }: { labels: string[]; onJump: (index: number) => void; topInset?: number }) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const [active, setActive] = useState<number | null>(null);
  const height = useRef(0);
  const latest = useRef({ labels, onJump });
  latest.current = { labels, onJump };

  const handlers = useMemo(() => {
    const at = (y: number) => {
      const { labels: list, onJump: jump } = latest.current;
      if (height.current <= 0 || list.length === 0) return;
      const index = Math.max(0, Math.min(list.length - 1, Math.floor((y / height.current) * list.length)));
      setActive(index);
      jump(index);
    };
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (event) => at(event.nativeEvent.locationY),
      onPanResponderMove: (event) => at(event.nativeEvent.locationY),
      onPanResponderRelease: () => setActive(null),
      onPanResponderTerminate: () => setActive(null),
    }).panHandlers;
  }, []);

  if (labels.length < 4) return null;
  const step = Math.max(1, Math.ceil(labels.length / 24));

  return (
    <>
      <View
        {...handlers}
        accessibilityLabel="Saltar entre fechas"
        onLayout={(event) => {
          height.current = event.nativeEvent.layout.height;
        }}
        style={{ position: 'absolute', right: 2, top: topInset + 90, bottom: 120, width: 26, alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4, backgroundColor: 'rgba(147,51,234,0.08)', borderRadius: 13 }}>
        {labels.map((label, index) => (
          <View key={`${label}-${index}`} pointerEvents="none" style={{ width: index % step === 0 ? 10 : 4, height: 3, borderRadius: 2, backgroundColor: active === index ? colors.accent : colors.textSecondary, opacity: active === index ? 1 : 0.55 }} />
        ))}
      </View>
      {active !== null && (
        <View pointerEvents="none" style={{ position: 'absolute', right: 40, top: '38%', maxWidth: 230, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 18, backgroundColor: colors.accent }}>
          <Text className="font-inter-semibold text-sm" numberOfLines={2} style={{ color: scheme === 'dark' ? '#1e1533' : '#ffffff' }}>{labels[active]}</Text>
        </View>
      )}
    </>
  );
}
