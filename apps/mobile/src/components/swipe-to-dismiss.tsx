import { Ionicons } from '@expo/vector-icons';
import { useMemo, useRef, useState, type ReactNode } from 'react';
import { Animated, PanResponder, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

// How far the row must travel to go away (a short flick is enough too). Past it, the hint says "Suelta para quitar".
const ARM_DISTANCE = 72;
const FLICK_SPEED = 0.35;

// A row that goes away when it is swiped to the left or to the right (a vertical gesture still scrolls the list). Behind
// it, a red hint says what is happening ("Quitar", then "Suelta para quitar"). Released short of the mark, it springs back.
export function SwipeToDismiss({ onDismiss, children }: { onDismiss: () => void; children: ReactNode }) {
  const width = useWindowDimensions().width;
  const x = useRef(new Animated.Value(0)).current;
  const [dx, setDx] = useState(0);
  const pan = useMemo(
    () =>
      PanResponder.create({
        // The row takes a horizontal drag as soon as it leads, before the list can scroll: a small sideways move is enough.
        onMoveShouldSetPanResponderCapture: (_event, gesture) => Math.abs(gesture.dx) > 4 && Math.abs(gesture.dx) > Math.abs(gesture.dy),
        onPanResponderTerminationRequest: () => false,
        onPanResponderMove: (_event, gesture) => {
          x.setValue(gesture.dx);
          setDx(gesture.dx);
        },
        onPanResponderRelease: (_event, gesture) => {
          if (Math.abs(gesture.dx) > ARM_DISTANCE || Math.abs(gesture.vx) > FLICK_SPEED) {
            Animated.timing(x, { toValue: (gesture.dx >= 0 ? 1 : -1) * width, duration: 160, useNativeDriver: true }).start(() => onDismiss());
          } else {
            setDx(0);
            Animated.spring(x, { toValue: 0, useNativeDriver: true }).start();
          }
        },
        onPanResponderTerminate: () => {
          setDx(0);
          Animated.spring(x, { toValue: 0, useNativeDriver: true }).start();
        },
      }),
    [x, width, onDismiss]
  );
  const armed = Math.abs(dx) > ARM_DISTANCE;
  const fromLeft = dx > 0;
  return (
    <View style={{ borderRadius: 24 }}>
      {dx !== 0 && (
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            {
              borderRadius: 24,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: fromLeft ? 'flex-start' : 'flex-end',
              paddingHorizontal: 20,
              gap: 8,
              backgroundColor: armed ? '#e11d48' : 'rgba(244,63,94,0.78)',
              opacity: Math.min(1, Math.abs(dx) / 36),
            },
          ]}>
          <Ionicons name={armed ? 'checkmark-circle' : 'trash-outline'} size={22} color="#ffffff" />
          <Text className="font-inter-semibold text-sm" style={{ color: '#ffffff' }}>{armed ? 'Suelta para quitar' : 'Quitar'}</Text>
        </View>
      )}
      <Animated.View {...pan.panHandlers} style={{ transform: [{ translateX: x }] }}>
        {children}
      </Animated.View>
    </View>
  );
}
