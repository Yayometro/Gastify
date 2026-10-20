import { Ionicons } from '@expo/vector-icons';
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { Animated, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassSurface } from '@/components/ui/glass';

type ToastKind = 'ok' | 'error';

const ToastContext = createContext<{ show: (message: string, kind?: ToastKind) => void }>({ show: () => {} });

// "Se guardó" and its siblings: a short message that slides in at the top and goes away by itself.
export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<{ id: number; message: string; kind: ToastKind } | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback(
    (message: string, kind: ToastKind = 'ok') => {
      if (timer.current) clearTimeout(timer.current);
      setToast({ id: Date.now(), message, kind });
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }).start();
      timer.current = setTimeout(() => {
        Animated.timing(opacity, { toValue: 0, duration: 240, useNativeDriver: true }).start(() => setToast(null));
      }, 2800);
    },
    [opacity]
  );

  const value = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast && (
        <Animated.View
          pointerEvents="none"
          accessibilityLiveRegion="polite"
          style={{ position: 'absolute', top: insets.top + 8, left: 16, right: 16, opacity, zIndex: 100 }}>
          <GlassSurface radius={20} style={{ shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 12, elevation: 10 }}>
            <View className="flex-row items-center gap-3 px-4 py-3.5">
              <Ionicons name={toast.kind === 'ok' ? 'checkmark-circle' : 'alert-circle'} size={24} color={toast.kind === 'ok' ? '#34d399' : '#fb7185'} />
              <Text className="flex-1 font-inter-medium text-base text-gf-text">{toast.message}</Text>
            </View>
          </GlassSurface>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}
