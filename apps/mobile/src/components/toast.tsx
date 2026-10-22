import { Ionicons } from '@expo/vector-icons';
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { router } from 'expo-router';
import { Animated, Easing, Modal, PanResponder, Pressable, Text, View, useColorScheme, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AlarmEdges, FireEffect } from '@/components/alarm-edges';
import { Celebration } from '@/components/celebration';
import { GradientButton } from '@/components/ui/gradient-button';
import { GlassSurface } from '@/components/ui/glass';
import { MOOD_COLOR, type AlertMood } from '@/lib/alert-presentation';
import { TABLET_MIN_WIDTH } from '@/hooks/use-device-class';

// alarm and fire are the budget notices (70 to 90 % and past 100 %); celebrate the congratulations.
type ToastKind = 'ok' | 'error' | 'warning' | 'celebrate' | 'alarm' | 'fire';

export type ToastOptions = { title?: string; href?: string };

const ToastContext = createContext<{
  show: (message: string, kind?: ToastKind, titleOrOptions?: string | ToastOptions) => void;
  // Opens the notice's own window right away (the Notifications list does this, without the toast first).
  present: (message: string, mood: AlertMood, options?: ToastOptions) => void;
}>({ show: () => {}, present: () => {} });

// "Se guardó" and its siblings: a short message that drops in from the top with its icon in a soft
// circle, and goes away by itself. Success is green, errors rose, like the money colors of the app.
export function useToast() {
  return useContext(ToastContext);
}

const TONES: Record<ToastKind, { icon: 'checkmark' | 'alert' | 'sparkles' | 'flame'; color: string; circle: string; title: string }> = {
  ok: { icon: 'checkmark', color: '#34d399', circle: 'rgba(52, 211, 153, 0.18)', title: 'Listo' },
  error: { icon: 'alert', color: '#fb7185', circle: 'rgba(251, 113, 133, 0.18)', title: 'Revisa esto' },
  warning: { icon: 'alert', color: '#f59e0b', circle: 'rgba(245, 158, 11, 0.20)', title: 'Aviso' },
  celebrate: { icon: 'sparkles', color: '#c084fc', circle: 'rgba(192, 132, 252, 0.22)', title: '¡Felicidades!' },
  alarm: { icon: 'alert', color: '#f43f5e', circle: 'rgba(244, 63, 94, 0.20)', title: '¡Aguas!' },
  fire: { icon: 'flame', color: '#f97316', circle: 'rgba(249, 115, 22, 0.22)', title: '¡Se está incendiando!' },
};

const isMood = (kind: ToastKind): kind is AlertMood => kind === 'celebrate' || kind === 'alarm' || kind === 'fire';

export function ToastProvider({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const tablet = useWindowDimensions().width >= TABLET_MIN_WIDTH;
  const dark = useColorScheme() === 'dark';
  const [toast, setToast] = useState<{ id: number; message: string; kind: ToastKind; title?: string; href?: string } | null>(null);
  // The window a notice opens when it is tapped: its mood decides the effect (confetti, the alarm frame or the fire).
  const [presented, setPresented] = useState<{ mood: AlertMood; title: string; message: string; href?: string } | null>(null);
  const drag = useRef(new Animated.ValueXY()).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(-24)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hide = useCallback(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 0, duration: 220, useNativeDriver: true }),
      Animated.timing(slide, { toValue: -16, duration: 220, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
    ]).start(() => setToast(null));
  }, [opacity, slide]);

  const show = useCallback(
    (message: string, kind: ToastKind = 'ok', titleOrOptions?: string | ToastOptions) => {
      const options: ToastOptions = typeof titleOrOptions === 'string' ? { title: titleOrOptions } : titleOrOptions ?? {};
      if (timer.current) clearTimeout(timer.current);
      drag.setValue({ x: 0, y: 0 });
      setToast({ id: Date.now(), message, kind, title: options.title, href: options.href });
      opacity.setValue(0);
      slide.setValue(-24);
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.timing(slide, { toValue: 0, duration: 260, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]).start();
      timer.current = setTimeout(hide, kind === 'ok' ? 2800 : 5200);
    },
    [hide, opacity, slide, drag]
  );

  const present = useCallback((message: string, mood: AlertMood, options?: ToastOptions) => {
    setPresented({ mood, title: options?.title ?? TONES[mood].title, message, href: options?.href });
  }, []);

  const value = useMemo(() => ({ show, present }), [show, present]);

  // The notice can be pushed away in any direction, and a tap on it opens what it is about (a congratulation opens its own
  // window with confetti and fireworks).
  const current = useRef(toast);
  current.current = toast;
  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_event, gesture) => Math.abs(gesture.dx) + Math.abs(gesture.dy) > 6,
        onPanResponderGrant: () => { if (timer.current) clearTimeout(timer.current); },
        onPanResponderMove: (_event, gesture) => drag.setValue({ x: gesture.dx, y: gesture.dy }),
        onPanResponderRelease: (_event, gesture) => {
          const moved = Math.abs(gesture.dx) + Math.abs(gesture.dy);
          if (moved < 8) {
            const open = current.current;
            hide();
            if (open && isMood(open.kind)) present(open.message, open.kind, { title: open.title, href: open.href });
            else if (open?.href) router.push(open.href as never);
            return;
          }
          if (moved > 60) {
            Animated.timing(drag, { toValue: { x: gesture.dx * 6, y: gesture.dy * 6 }, duration: 180, useNativeDriver: false }).start(() => { setToast(null); drag.setValue({ x: 0, y: 0 }); });
          } else {
            Animated.spring(drag, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
            timer.current = setTimeout(hide, 3000);
          }
        },
      }),
    [drag, hide, present]
  );
  const tone = toast ? TONES[toast.kind] : null;

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast && tone && (
        <Animated.View
          accessibilityLiveRegion="polite"
          style={[{ position: 'absolute', top: insets.top + 8, opacity, transform: [{ translateY: slide }], zIndex: 100 }, tablet ? { right: 20, width: 380 } : { left: 16, right: 16 }]}>
          <Animated.View {...pan.panHandlers} style={{ transform: drag.getTranslateTransform() }}>
          <GlassSurface radius={24} style={{ backgroundColor: dark ? 'rgba(30,18,60,0.88)' : 'rgba(255,255,255,0.94)', borderWidth: 1, borderColor: dark ? 'rgba(255,255,255,0.18)' : 'rgba(27,16,61,0.10)', shadowColor: '#000', shadowOpacity: dark ? 0.5 : 0.2, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 14 }}>
            <View className="flex-row items-center gap-3 px-4 py-3">
              <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: tone.circle, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name={tone.icon} size={22} color={tone.color} />
              </View>
              <View className="flex-1 gap-0.5">
                <Text className="font-inter-semibold text-xs uppercase tracking-wider" style={{ color: tone.color }}>{toast.title ?? tone.title}</Text>
                <Text className="font-inter-medium text-base text-gf-text" numberOfLines={3}>{toast.message}</Text>
              </View>
            </View>
          </GlassSurface>
          </Animated.View>
        </Animated.View>
      )}
      <Modal visible={presented !== null} transparent animationType="fade" onRequestClose={() => setPresented(null)}>
        <View style={{ flex: 1, backgroundColor: presented?.mood === 'celebrate' || !presented ? 'rgba(10,5,25,0.82)' : 'rgba(26,4,12,0.78)', alignItems: 'center', justifyContent: 'center', padding: 28 }}>
          {presented?.mood === 'celebrate' && <Celebration active />}
          {presented && presented.mood !== 'celebrate' && <AlarmEdges color={MOOD_COLOR[presented.mood]} fast={presented.mood === 'fire'} />}
          {presented?.mood === 'fire' && <FireEffect />}
          <GlassSurface radius={28} style={{ width: '100%', maxWidth: 420, backgroundColor: 'rgba(40,22,82,0.96)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' }}>
            <View className="items-center gap-4 p-7">
              <Text style={{ fontSize: 56 }}>{presented?.mood === 'fire' ? '🔥' : presented?.mood === 'alarm' ? '😬' : '🎉'}</Text>
              <Text className="text-center font-inter-bold text-2xl" style={{ color: '#ffffff' }}>{presented?.title}</Text>
              <Text className="text-center font-inter text-base" style={{ color: 'rgba(255,255,255,0.85)' }}>{presented?.message}</Text>
              {presented?.href ? <View style={{ alignSelf: 'stretch' }}><GradientButton label="Ver mi presupuesto" onPress={() => { const href = presented.href; setPresented(null); if (href) router.push(href as never); }} /></View> : null}
              <Pressable accessibilityRole="button" onPress={() => setPresented(null)} hitSlop={10}><Text className="font-inter-semibold text-sm" style={{ color: 'rgba(255,255,255,0.8)' }}>Cerrar</Text></Pressable>
            </View>
          </GlassSurface>
        </View>
      </Modal>
    </ToastContext.Provider>
  );
}
