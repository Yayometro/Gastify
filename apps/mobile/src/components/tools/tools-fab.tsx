import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as SecureStore from 'expo-secure-store';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, PanResponder, Platform, Pressable, ScrollView, Text, View, useColorScheme, useWindowDimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Categorizer } from '@/components/tools/categorizer';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { SIDE_NAV_WIDTH } from '@/components/side-nav';
import { BottomTabInset, Colors } from '@/constants/theme';
import { useT } from "@/i18n/client";
import type { TranslateFn } from "@gastify/core/i18n/translate";

type Tool = { id: string; label: string; title: string; about: string; render: () => React.JSX.Element };

// Array-driven, like the web's: a new tool is one more entry here, and the tabs appear once there are two.
const TOOLS = (t: TranslateFn): Tool[] => ([
  {
    id: 'uncategorized',
    label: t("mobile.sin.categoria"),
    title: t("mobile.transaction.categorizer"),
    about: t("mobile.busca.tus.movimientos.sin.categoria.y.sugiere.una.segun.las."),
    render: () => <Categorizer />,
  },
]);

// The web's floating "Tools" button (the sparkles) and the sheet it opens. It floats above every screen and can be
// dragged to any border: the left or right edge at any height, or the top or bottom edge at any place along it. Let go,
// it settles on the nearest edge. Where it was left is remembered on the device. Tapping it opens the sheet.
const SIZE = 48;
const EDGE = 12;
const SPOT_KEY = 'tools_fab_spot';
const DEFAULT_SPOT: Spot = { edge: 'right', ratio: 1 };

type Edge = 'left' | 'right' | 'top' | 'bottom';
// A place on an edge: the edge, and how far along it (0 = the start, 1 = the end), so a rotation keeps it on that edge.
type Spot = { edge: Edge; ratio: number };
type Bounds = { minX: number; maxX: number; minY: number; maxY: number };

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

// The area the button may use: under the status bar, above the tab bar (or the bottom inset on the iPad), and right of the
// side bar on the iPad. Positions are the button's top-left corner, in the window.
function boundsFor(width: number, height: number, top: number, bottomOffset: number, leftOffset: number): Bounds {
  return { minX: leftOffset + EDGE, maxX: width - SIZE - EDGE, minY: top + EDGE, maxY: height - bottomOffset - SIZE };
}

function spotPosition(spot: Spot, b: Bounds): { x: number; y: number } {
  const r = clamp(spot.ratio, 0, 1);
  switch (spot.edge) {
    case 'left': return { x: b.minX, y: b.minY + r * (b.maxY - b.minY) };
    case 'right': return { x: b.maxX, y: b.minY + r * (b.maxY - b.minY) };
    case 'top': return { x: b.minX + r * (b.maxX - b.minX), y: b.minY };
    default: return { x: b.minX + r * (b.maxX - b.minX), y: b.maxY };
  }
}

// Where a let-go button settles: the nearest edge, keeping the place it was let go along that edge.
function snapOf(x: number, y: number, b: Bounds): { x: number; y: number; spot: Spot } {
  const cx = clamp(x, b.minX, b.maxX);
  const cy = clamp(y, b.minY, b.maxY);
  const distances: [Edge, number][] = [['left', cx - b.minX], ['right', b.maxX - cx], ['top', cy - b.minY], ['bottom', b.maxY - cy]];
  const edge = distances.reduce((best, item) => (item[1] < best[1] ? item : best))[0];
  const ratioX = (cx - b.minX) / (b.maxX - b.minX || 1);
  const ratioY = (cy - b.minY) / (b.maxY - b.minY || 1);
  switch (edge) {
    case 'left': return { x: b.minX, y: cy, spot: { edge, ratio: ratioY } };
    case 'right': return { x: b.maxX, y: cy, spot: { edge, ratio: ratioY } };
    case 'top': return { x: cx, y: b.minY, spot: { edge, ratio: ratioX } };
    default: return { x: cx, y: b.maxY, spot: { edge, ratio: ratioX } };
  }
}

function readSpot(raw: string | null): Spot | null {
  try {
    const value = raw ? (JSON.parse(raw) as Partial<Spot>) : null;
    const edges: Edge[] = ['left', 'right', 'top', 'bottom'];
    return value && edges.includes(value.edge as Edge) && typeof value.ratio === 'number' ? (value as Spot) : null;
  } catch {
    return null;
  }
}

export function ToolsFab() {
  const t = useT();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const wide = width >= 768;
  const [open, setOpen] = useState(false);
  const [spot, setSpot] = useState<Spot>(DEFAULT_SPOT);
  const bounds = useMemo(
    () => boundsFor(width, height, insets.top, wide ? insets.bottom + 16 : BottomTabInset + 8, wide ? SIDE_NAV_WIDTH : 0),
    [width, height, insets.top, insets.bottom, wide]
  );
  const pos = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  // Where the button is now, kept by hand (the native driver does not report it while it springs).
  const last = useRef({ x: 0, y: 0 });
  const dragStart = useRef({ x: 0, y: 0 });
  const dragging = useRef(false);
  // Alive: it pops in with a bounce, wiggles now and then, swells when picked up and rebounds when let go.
  const scale = useRef(new Animated.Value(0)).current;
  const wiggle = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scale, { toValue: 1, friction: 4, tension: 110, useNativeDriver: true }).start();
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(4200),
        ...[1, -1, 0.7, -0.7, 0.35, 0].map((value) => Animated.timing(wiggle, { toValue: value, duration: 90, useNativeDriver: true })),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [scale, wiggle]);

  useEffect(() => {
    SecureStore.getItemAsync(SPOT_KEY).then((raw) => {
      const saved = readSpot(raw);
      if (saved) setSpot(saved);
    }).catch(() => {});
  }, []);

  // Sits on its spot whenever the spot or the window changes (a rotation keeps it on the same edge), unless it is being dragged.
  useEffect(() => {
    if (dragging.current) return;
    const target = spotPosition(spot, bounds);
    last.current = target;
    pos.setValue(target);
  }, [spot, bounds, pos]);

  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          dragging.current = true;
          dragStart.current = last.current;
          Animated.spring(scale, { toValue: 1.2, friction: 5, tension: 180, useNativeDriver: true }).start();
        },
        onPanResponderMove: (_, gesture) => {
          pos.setValue({ x: dragStart.current.x + gesture.dx, y: dragStart.current.y + gesture.dy });
        },
        onPanResponderRelease: (_, gesture) => {
          dragging.current = false;
          Animated.spring(scale, { toValue: 1, friction: 3, tension: 150, useNativeDriver: true }).start();
          if (Math.abs(gesture.dx) + Math.abs(gesture.dy) <= 6) {
            setOpen(true);
            return;
          }
          const next = snapOf(dragStart.current.x + gesture.dx, dragStart.current.y + gesture.dy, bounds);
          last.current = { x: next.x, y: next.y };
          Animated.spring(pos, { toValue: { x: next.x, y: next.y }, useNativeDriver: true, friction: 6, tension: 70 }).start();
          setSpot(next.spot);
          SecureStore.setItemAsync(SPOT_KEY, JSON.stringify(next.spot)).catch(() => {});
        },
        onPanResponderTerminate: () => {
          dragging.current = false;
          Animated.spring(scale, { toValue: 1, friction: 3, tension: 150, useNativeDriver: true }).start();
          pos.setValue(last.current);
        },
      }),
    [bounds, pos, scale]
  );

  return (
    <>
      <Animated.View
        {...responder.panHandlers}
        accessible
        accessibilityRole="button"
        accessibilityLabel={t("mobile.abrir.herramientas")}
        accessibilityHint={t("mobile.arrastralo.a.otro.borde.o")}
        style={[
          { position: 'absolute', left: 0, top: 0, width: SIZE, height: SIZE, zIndex: 50, transform: pos.getTranslateTransform() },
          Platform.select({ ios: { shadowColor: '#7e22ce', shadowOpacity: 0.5, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } }, default: { elevation: 8 } }),
        ]}>
        <Animated.View style={{ flex: 1, transform: [{ scale }, { rotate: wiggle.interpolate({ inputRange: [-1, 1], outputRange: ['-16deg', '16deg'] }) }] }}>
          <LinearGradient colors={['#e879f9', '#9333ea']} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }} style={{ flex: 1, borderRadius: 24, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="sparkles" size={22} color="#ffffff" />
          </LinearGradient>
        </Animated.View>
      </Animated.View>

      <ToolsSheet visible={open} onClose={() => setOpen(false)} />
    </>
  );
}

// The Tools sheet itself (the Transaction Categorizer and whatever tools come next). The floating button opens it, and so
// does the visible "Categorizar" button of the Movements screen.
export function ToolsSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const t = useT();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const [active, setActive] = useState(TOOLS(t)[0].id);
  const current = TOOLS(t).find((tool) => tool.id === active) ?? TOOLS(t)[0];
  return (
      <BottomSheet visible={visible} onClose={onClose} maxHeight="90%">
            <SafeAreaView edges={['bottom']} style={{ flexShrink: 1 }}>
              <View className="items-center px-6 pb-2 pt-5">
                <Pressable accessibilityRole="button" accessibilityLabel={t("mobile.cerrar")} onPress={onClose} hitSlop={10} style={{ position: 'absolute', right: 20, top: 18 }}>
                  <Ionicons name="close" size={26} color={colors.text} />
                </Pressable>
                <Text className="font-inter-bold text-2xl text-gf-text">{t("mobile.tools")}</Text>
                <Text className="font-inter-semibold text-sm" style={{ color: colors.accent }}>{current.title}</Text>
                <Text className="pt-1 text-center font-inter text-xs text-gf-text-muted">{current.about}</Text>
              </View>
              {TOOLS(t).length > 1 && (
                <View className="flex-row justify-center gap-2 pb-2">
                  {TOOLS(t).map((tool) => (
                    <Pressable
                      key={tool.id}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active === tool.id }}
                      onPress={() => setActive(tool.id)}
                      className="rounded-full px-4 py-1.5"
                      style={{ backgroundColor: active === tool.id ? '#9333ea' : undefined }}>
                      <Text className="font-inter-medium text-sm" style={{ color: active === tool.id ? '#ffffff' : colors.textSecondary }}>{tool.label}</Text>
                    </Pressable>
                  ))}
                </View>
              )}
              <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 28 }} keyboardShouldPersistTaps="handled">
                {visible && current.render()}
              </ScrollView>
            </SafeAreaView>
      </BottomSheet>
  );
}
