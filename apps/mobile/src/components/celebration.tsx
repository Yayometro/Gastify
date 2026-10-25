import { useEffect, useMemo, useRef } from 'react';
import { Animated, Dimensions, Easing, StyleSheet, View } from 'react-native';

const COLORS = ['#f472b6', '#c084fc', '#60a5fa', '#34d399', '#fbbf24', '#fb7185', '#ffffff'];

// Confetti falling over the whole screen and three fireworks bursting at different places, for the congratulation
// notices. It draws over everything and does not take touches.
export function Celebration({ active }: { active: boolean }) {
  const { width, height } = Dimensions.get('window');
  const confetti = useMemo(
    () => Array.from({ length: 46 }, (_, index) => ({ id: index, x: Math.random() * width, size: 6 + Math.random() * 8, color: COLORS[index % COLORS.length], delay: Math.random() * 900, duration: 2600 + Math.random() * 1800, spin: Math.random() > 0.5 ? 1 : -1 })),
    [width, active] // eslint-disable-line react-hooks/exhaustive-deps
  );
  const bursts = useMemo(() => [{ x: width * 0.25, y: height * 0.28, delay: 200 }, { x: width * 0.75, y: height * 0.22, delay: 900 }, { x: width * 0.5, y: height * 0.38, delay: 1600 }], [width, height]);
  if (!active) return null;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {confetti.map((piece) => <Confetto key={piece.id} piece={piece} height={height} />)}
      {bursts.map((burst, index) => <Firework key={index} {...burst} />)}
    </View>
  );
}

function Confetto({ piece, height }: { piece: { x: number; size: number; color: string; delay: number; duration: number; spin: number }; height: number }) {
  const fall = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.timing(fall, { toValue: 1, duration: piece.duration, delay: piece.delay, easing: Easing.linear, useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [fall, piece.delay, piece.duration]);
  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: piece.x,
        top: -20,
        width: piece.size,
        height: piece.size * 0.6,
        backgroundColor: piece.color,
        borderRadius: 2,
        transform: [
          { translateY: fall.interpolate({ inputRange: [0, 1], outputRange: [0, height + 40] }) },
          { translateX: fall.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 24 * piece.spin, -10 * piece.spin] }) },
          { rotate: fall.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${540 * piece.spin}deg`] }) },
        ],
      }}
    />
  );
}

function Firework({ x, y, delay }: { x: number; y: number; delay: number }) {
  const burst = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([Animated.delay(delay), Animated.timing(burst, { toValue: 1, duration: 1400, easing: Easing.out(Easing.cubic), useNativeDriver: true }), Animated.timing(burst, { toValue: 0, duration: 0, useNativeDriver: true }), Animated.delay(900)]));
    loop.start();
    return () => loop.stop();
  }, [burst, delay]);
  const sparks = Array.from({ length: 16 }, (_, index) => ({ angle: (index / 16) * Math.PI * 2, color: COLORS[index % COLORS.length] }));
  return (
    <>
      {sparks.map((spark, index) => (
        <Animated.View
          key={index}
          style={{
            position: 'absolute',
            left: x,
            top: y,
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: spark.color,
            opacity: burst.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 1, 0] }),
            transform: [
              { translateX: burst.interpolate({ inputRange: [0, 1], outputRange: [0, Math.cos(spark.angle) * 120] }) },
              { translateY: burst.interpolate({ inputRange: [0, 1], outputRange: [0, Math.sin(spark.angle) * 120 + 30] }) },
              { scale: burst.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0.4, 1.2, 0.3] }) },
            ],
          }}
        />
      ))}
    </>
  );
}
