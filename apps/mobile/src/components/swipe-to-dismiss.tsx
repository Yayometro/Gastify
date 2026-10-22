import { useMemo, useRef, type ReactNode } from 'react';
import { Animated, PanResponder, useWindowDimensions } from 'react-native';

// A row that goes away when it is swiped to the left or to the right (and only there: a vertical gesture scrolls the list).
// Released short of the edge, it springs back.
export function SwipeToDismiss({ onDismiss, children }: { onDismiss: () => void; children: ReactNode }) {
  const width = useWindowDimensions().width;
  const x = useRef(new Animated.Value(0)).current;
  const pan = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_event, gesture) => Math.abs(gesture.dx) > 10 && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.5,
        onPanResponderMove: (_event, gesture) => x.setValue(gesture.dx),
        onPanResponderRelease: (_event, gesture) => {
          if (Math.abs(gesture.dx) > 110 || Math.abs(gesture.vx) > 0.9) {
            Animated.timing(x, { toValue: (gesture.dx >= 0 ? 1 : -1) * width, duration: 180, useNativeDriver: true }).start(() => onDismiss());
          } else {
            Animated.spring(x, { toValue: 0, useNativeDriver: true }).start();
          }
        },
        onPanResponderTerminate: () => {
          Animated.spring(x, { toValue: 0, useNativeDriver: true }).start();
        },
      }),
    [x, width, onDismiss]
  );
  return <Animated.View {...pan.panHandlers} style={{ transform: [{ translateX: x }] }}>{children}</Animated.View>;
}
