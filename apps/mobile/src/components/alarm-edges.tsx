import { useEffect, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';

// The alarm around the screen: a colored frame at the edges that flashes a few times and goes away by itself. The fire
// flickers faster than the alarm.
export function AlarmEdges({ color, fast = false }: { color: string; fast?: boolean }) {
  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const beat = fast ? 220 : 420;
    const flashes = Array.from({ length: 3 }, () => [
      Animated.timing(opacity, { toValue: 1, duration: beat, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0.2, duration: beat, useNativeDriver: true }),
    ]).flat();
    const run = Animated.sequence([...flashes, Animated.timing(opacity, { toValue: 0, duration: 600, useNativeDriver: true })]);
    run.start();
    return () => run.stop();
  }, [fast, opacity]);
  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity, borderWidth: 14, borderColor: color }]} />
  );
}
