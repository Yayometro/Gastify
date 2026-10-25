import { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, View, useWindowDimensions } from 'react-native';

// The alarm around the screen: a colored frame at the edges that keeps pulsing for as long as the notice is open (it
// stops only when the window is closed). The fire pulses faster and thicker.
export function AlarmEdges({ color, fast = false }: { color: string; fast?: boolean }) {
  const opacity = useRef(new Animated.Value(0.2)).current;
  useEffect(() => {
    const half = fast ? 170 : 460;
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: half, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.15, duration: half, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [fast, opacity]);
  return <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity, borderWidth: fast ? 18 : 14, borderColor: color }]} />;
}

const FIRE = ['🔥', '💥', '🔥', '✨', '🔥', '💥', '🔥'];

// The fire of the 100 %: flames and bursts that rise over the screen again and again, behind the window's text.
export function FireEffect() {
  const { width, height } = useWindowDimensions();
  const particles = useMemo(
    () =>
      Array.from({ length: 16 }, (_, index) => ({
        id: index,
        x: Math.random() * (width - 40),
        size: 22 + Math.random() * 20,
        delay: Math.random() * 1600,
        duration: 1300 + Math.random() * 1000,
        glyph: FIRE[index % FIRE.length],
      })),
    [width]
  );
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {particles.map((particle) => (
        <Flame key={particle.id} {...particle} height={height} />
      ))}
    </View>
  );
}

function Flame({ x, size, delay, duration, glyph, height }: { x: number; size: number; delay: number; duration: number; glyph: string; height: number }) {
  const rise = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.timing(rise, { toValue: 1, duration, delay, easing: Easing.out(Easing.quad), useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [rise, duration, delay]);
  return (
    <Animated.Text
      style={{
        position: 'absolute',
        left: x,
        bottom: 60,
        fontSize: size,
        opacity: rise.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 1, 0] }),
        transform: [
          { translateY: rise.interpolate({ inputRange: [0, 1], outputRange: [0, -height * 0.75] }) },
          { scale: rise.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.4] }) },
        ],
      }}>
      {glyph}
    </Animated.Text>
  );
}
