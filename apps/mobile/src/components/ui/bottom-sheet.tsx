import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Animated, Easing, Keyboard, Modal, Platform, Pressable, StyleSheet, View, useColorScheme, type DimensionValue, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BlurView } from 'expo-blur';

import { AmbientBackground } from '@/components/ambient-background';
import { Colors } from '@/constants/theme';

// The one window every pop-up uses: a card that opens in the middle of the screen (it grows from a little smaller) on the
// phone and the iPad alike, sized by what it holds (or by its `maxHeight`). A tap on the dark backdrop outside the card
// closes it, as does the "×" of each window; the back gesture of Android closes it too. The hairline border drawn over
// everything keeps the rounded edge one uniform color.
export function BottomSheet({ visible, onClose, children, maxHeight = '88%', dismissible = true, wideWidth = 640, ambient = true, fill = false }: { visible: boolean; onClose: () => void; children: ReactNode; maxHeight?: DimensionValue; dismissible?: boolean; wideWidth?: number; ambient?: boolean; fill?: boolean }) {
  const dark = useColorScheme() === 'dark';
  const colors = Colors[dark ? 'dark' : 'light'];
  const { width, height: screenHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const wide = width >= 768;
  const [mounted, setMounted] = useState(visible);
  // The keyboard rises over the window: lift it by the keyboard's height so the field being typed in stays visible.
  const [keyboard, setKeyboard] = useState(0);
  useEffect(() => {
    const show = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', (event) => setKeyboard(event.endCoordinates.height));
    const hide = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => setKeyboard(0));
    return () => { show.remove(); hide.remove(); };
  }, []);
  const fade = useRef(new Animated.Value(0)).current;
  const grow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fade.stopAnimation();
    grow.stopAnimation();
    if (visible) {
      setMounted(true);
      const animation = Animated.parallel([
        Animated.timing(fade, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(grow, { toValue: 1, duration: 260, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]);
      animation.start();
      return () => animation.stop();
    }
    const animation = Animated.parallel([
      Animated.timing(fade, { toValue: 0, duration: 160, useNativeDriver: true }),
      Animated.timing(grow, { toValue: 0, duration: 180, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
    ]);
    animation.start(({ finished }) => {
      if (finished) setMounted(false);
    });
    return () => animation.stop();
  }, [visible, fade, grow]);

  // The cap in pixels, so the window is never taller than the screen allows and a long list scrolls inside it. The window is
  // centred, so it keeps clear of the top of the screen on both sides: under the notch or the Dynamic Island, by 5 points.
  const topClearance = insets.top + 5;
  const available = Math.max(200, screenHeight - keyboard - 2 * topClearance);
  const maxPx = typeof maxHeight === 'string' && maxHeight.endsWith('%') ? Math.min((screenHeight * parseFloat(maxHeight)) / 100, available - 24) : typeof maxHeight === 'number' ? Math.min(maxHeight, available - 24) : undefined;
  const radius = { borderRadius: 28 };

  return (
    <Modal visible={mounted} transparent animationType="none" onRequestClose={dismissible ? onClose : undefined} statusBarTranslucent>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: wide ? 0 : 16, paddingBottom: keyboard }}>
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: fade }]}>
          <Pressable accessibilityRole="button" accessibilityLabel="Cerrar" disabled={!dismissible} onPress={onClose} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }} />
        </Animated.View>
        <Animated.View style={{ width: wide ? wideWidth : '100%', maxHeight, transform: [{ scale: grow.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }) }], opacity: grow }}>
          <View style={[radius, { overflow: 'hidden', maxHeight: maxPx, height: fill ? maxPx : undefined, backgroundColor: dark ? 'transparent' : colors.background }]}>
            {/* Dark mode: the web's violet glass, a very light see-through: a blur of what is behind (iPhone) and a base that is
                a touch transparent (Android has no blur here). Light mode stays solid, as the web's light modals do. */}
            {dark && Platform.OS === 'ios' && <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />}
            {ambient && <AmbientBackground baseOpacity={dark ? 0.84 : 1} />}
            {!ambient && dark && <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(20,11,38,0.84)' }]} />}
            <View style={fill ? { flex: 1 } : { flexShrink: 1 }}>{children}</View>
            <View pointerEvents="none" style={[StyleSheet.absoluteFill, radius, { borderWidth: 1, borderColor: dark ? 'rgba(255,255,255,0.12)' : 'rgba(27,16,61,0.08)' }]} />
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
