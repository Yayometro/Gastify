import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Animated, Easing, Modal, Pressable, StyleSheet, View, useColorScheme, type DimensionValue, useWindowDimensions } from 'react-native';

import { AmbientBackground, DARK_BASE } from '@/components/ambient-background';
import { Colors } from '@/constants/theme';

// The one sheet every pop-up uses: the dark backdrop only fades in (it does not travel), the sheet alone slides up
// from the bottom, a tap outside closes it, and a hairline border drawn over everything keeps the rounded edge one
// uniform color. On wide screens (iPad) it is a centered card instead.
export function BottomSheet({ visible, onClose, children, maxHeight = '88%' }: { visible: boolean; onClose: () => void; children: ReactNode; maxHeight?: DimensionValue }) {
  const dark = useColorScheme() === 'dark';
  const colors = Colors[dark ? 'dark' : 'light'];
  const { width, height } = useWindowDimensions();
  const wide = width >= 768;
  const [mounted, setMounted] = useState(visible);
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(height)).current;

  useEffect(() => {
    if (visible) {
      setMounted(true);
      slide.setValue(height);
      Animated.parallel([
        Animated.timing(fade, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(slide, { toValue: 0, duration: 280, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fade, { toValue: 0, duration: 160, useNativeDriver: true }),
        Animated.timing(slide, { toValue: height, duration: 200, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
      ]).start(({ finished }) => {
        if (finished) setMounted(false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const bottomRadius = wide ? 28 : 0;
  const radii = { borderTopLeftRadius: 28, borderTopRightRadius: 28, borderBottomLeftRadius: bottomRadius, borderBottomRightRadius: bottomRadius };

  return (
    <Modal visible={mounted} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <View style={{ flex: 1, justifyContent: wide ? 'center' : 'flex-end', alignItems: 'center' }}>
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: fade }]}>
          <Pressable accessibilityRole="button" accessibilityLabel="Cerrar" onPress={onClose} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }} />
        </Animated.View>
        <Animated.View style={{ width: wide ? 640 : '100%', maxHeight, transform: [{ translateY: slide }] }}>
          <View style={[radii, { overflow: 'hidden', backgroundColor: dark ? DARK_BASE : colors.background }]}>
            <AmbientBackground />
            {children}
            <View pointerEvents="none" style={[StyleSheet.absoluteFill, radii, { borderWidth: 1, borderColor: dark ? 'rgba(255,255,255,0.12)' : 'rgba(27,16,61,0.08)' }]} />
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
