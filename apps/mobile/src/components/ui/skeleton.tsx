import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, View, useColorScheme, type DimensionValue } from 'react-native';

// A placeholder block with a soft light sweeping across it, for what is still loading.
export function SkeletonBlock({ width = '100%', height = 16, radius = 10 }: { width?: DimensionValue; height?: number; radius?: number }) {
  const dark = useColorScheme() === 'dark';
  const sweep = useRef(new Animated.Value(0)).current;
  const [w, setW] = useState(0);
  useEffect(() => {
    const loop = Animated.loop(Animated.timing(sweep, { toValue: 1, duration: 1300, easing: Easing.inOut(Easing.quad), useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [sweep]);
  const translateX = sweep.interpolate({ inputRange: [0, 1], outputRange: [-w, w] });
  return (
    <View onLayout={(event) => setW(event.nativeEvent.layout.width)} style={{ width, height, borderRadius: radius, overflow: 'hidden', backgroundColor: dark ? 'rgba(255,255,255,0.08)' : 'rgba(27,16,61,0.07)' }}>
      {w > 0 && (
        <Animated.View style={{ ...({ position: 'absolute', top: 0, bottom: 0, left: 0, width: w } as const), transform: [{ translateX }] }}>
          <LinearGradient colors={['transparent', dark ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.8)', 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ flex: 1 }} />
        </Animated.View>
      )}
    </View>
  );
}

// A few rows that look like movements (a round badge and two lines), while the list loads.
export function SkeletonRows({ count = 4 }: { count?: number }) {
  return (
    <View className="gap-4" accessibilityLabel="Cargando" accessibilityRole="progressbar">
      {Array.from({ length: count }, (_, index) => (
        <View key={index} className="flex-row items-center gap-3">
          <SkeletonBlock width={44} height={44} radius={22} />
          <View className="flex-1 gap-2">
            <SkeletonBlock width={`${60 + ((index * 13) % 30)}%`} height={14} />
            <SkeletonBlock width={`${35 + ((index * 17) % 25)}%`} height={11} />
          </View>
          <SkeletonBlock width={64} height={16} />
        </View>
      ))}
    </View>
  );
}

// The look of a card while it loads: a title and a few lines.
export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <View className="gap-3" accessibilityLabel="Cargando" accessibilityRole="progressbar">
      <SkeletonBlock width="45%" height={18} />
      {Array.from({ length: lines }, (_, index) => <SkeletonBlock key={index} width={`${100 - index * 12}%`} height={14} />)}
    </View>
  );
}
