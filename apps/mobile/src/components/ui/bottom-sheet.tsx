import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Animated, Easing, Modal, Pressable, StyleSheet, View, useColorScheme, type DimensionValue, useWindowDimensions } from 'react-native';

import { AmbientBackground, DARK_BASE } from '@/components/ambient-background';
import { Colors } from '@/constants/theme';

// The one sheet every pop-up uses: the dark backdrop only fades in (it does not travel), the sheet alone slides up
// from the bottom, a tap outside closes it, and a hairline border drawn over everything keeps the rounded edge one
// uniform color. On wide screens (iPad) it is a centered card instead.
export function BottomSheet({ visible, onClose, children, maxHeight = '88%', dismissible = true, wideWidth = 640, ambient = true }: { visible: boolean; onClose: () => void; children: ReactNode; maxHeight?: DimensionValue; dismissible?: boolean; wideWidth?: number; ambient?: boolean }) {
  const dark = useColorScheme() === 'dark';
  const colors = Colors[dark ? 'dark' : 'light'];
  const { width, height } = useWindowDimensions();
  const wide = width >= 768;
  const [mounted, setMounted] = useState(visible);
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(height)).current;

  useEffect(() => {
    fade.stopAnimation();
    slide.stopAnimation();
    if (visible) {
      setMounted(true);
      slide.setValue(height);
      const animation = Animated.parallel([
        Animated.timing(fade, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(slide, { toValue: 0, duration: 280, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]);
      animation.start();
      return () => animation.stop();
    } else {
      const animation = Animated.parallel([
        Animated.timing(fade, { toValue: 0, duration: 160, useNativeDriver: true }),
        Animated.timing(slide, { toValue: height, duration: 200, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
      ]);
      animation.start(({ finished }) => {
        if (finished) setMounted(false);
      });
      return () => animation.stop();
    }
  }, [visible, height, fade, slide]);

  // The cap in pixels, so the sheet itself (and its ambient glow) is never taller than the screen allows and a long list scrolls inside it.
  const maxPx = typeof maxHeight === 'string' && maxHeight.endsWith('%') ? (height * parseFloat(maxHeight)) / 100 : typeof maxHeight === 'number' ? maxHeight : undefined;
  const bottomRadius = wide ? 28 : 0;
  const radii = { borderTopLeftRadius: 28, borderTopRightRadius: 28, borderBottomLeftRadius: bottomRadius, borderBottomRightRadius: bottomRadius };

  return (
    <Modal visible={mounted} transparent animationType="none" onRequestClose={dismissible ? onClose : undefined} statusBarTranslucent>
      <View style={{ flex: 1, justifyContent: wide ? 'center' : 'flex-end', alignItems: 'center' }}>
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: fade }]}>
          <Pressable accessibilityRole="button" accessibilityLabel="Cerrar" disabled={!dismissible} onPress={onClose} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }} />
        </Animated.View>
        <Animated.View style={{ width: wide ? wideWidth : '100%', maxHeight, transform: [{ translateY: slide }] }}>
          <View style={[radii, { overflow: 'hidden', maxHeight: maxPx, backgroundColor: dark ? DARK_BASE : colors.background }]}>
            {ambient && <AmbientBackground />}
            <View style={{ flexShrink: 1 }}>{children}</View>
            <View pointerEvents="none" style={[StyleSheet.absoluteFill, radii, { borderWidth: 1, borderColor: dark ? 'rgba(255,255,255,0.12)' : 'rgba(27,16,61,0.08)' }]} />
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
