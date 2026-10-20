import { Ionicons } from '@expo/vector-icons';
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { Animated, Easing, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassSurface } from '@/components/ui/glass';

type ToastKind = 'ok' | 'error';

const ToastContext = createContext<{ show: (message: string, kind?: ToastKind) => void }>({ show: () => {} });

// "Se guardó" and its siblings: a short message that drops in from the top with its icon in a soft
// circle, and goes away by itself. Success is green, errors rose, like the money colors of the app.
export function useToast() {
  return useContext(ToastContext);
}

const TONES: Record<ToastKind, { icon: 'checkmark' | 'alert'; color: string; circle: string; title: string }> = {
  ok: { icon: 'checkmark', color: '#34d399', circle: 'rgba(52, 211, 153, 0.18)', title: 'Listo' },
  error: { icon: 'alert', color: '#fb7185', circle: 'rgba(251, 113, 133, 0.18)', title: 'Revisa esto' },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<{ id: number; message: string; kind: ToastKind } | null>(null);
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
    (message: string, kind: ToastKind = 'ok') => {
      if (timer.current) clearTimeout(timer.current);
      setToast({ id: Date.now(), message, kind });
      opacity.setValue(0);
      slide.setValue(-24);
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.timing(slide, { toValue: 0, duration: 260, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]).start();
      timer.current = setTimeout(hide, kind === 'error' ? 4200 : 2800);
    },
    [hide, opacity, slide]
  );

  const value = useMemo(() => ({ show }), [show]);
  const tone = toast ? TONES[toast.kind] : null;

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast && tone && (
        <Animated.View
          pointerEvents="none"
          accessibilityLiveRegion="polite"
          style={{ position: 'absolute', top: insets.top + 8, left: 16, right: 16, opacity, transform: [{ translateY: slide }], zIndex: 100 }}>
          <GlassSurface radius={24} style={{ shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 12 }}>
            <View className="flex-row items-center gap-3 px-4 py-3">
              <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: tone.circle, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name={tone.icon === 'checkmark' ? 'checkmark' : 'alert'} size={22} color={tone.color} />
              </View>
              <View className="flex-1 gap-0.5">
                <Text className="font-inter-semibold text-xs uppercase tracking-wider" style={{ color: tone.color }}>{tone.title}</Text>
                <Text className="font-inter-medium text-base text-gf-text" numberOfLines={3}>{toast.message}</Text>
              </View>
            </View>
          </GlassSurface>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}
