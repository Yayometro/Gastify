import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, View, useColorScheme, useWindowDimensions } from 'react-native';
import Svg, { Defs, Mask, Rect as SvgRect } from 'react-native-svg';

import { Colors } from '@/constants/theme';
import { useT } from '@/i18n/client';
import { cardPlacement, cardWidth, spotlightFor, type CardSide, type Rect, type Safe } from '@gastify/core/tour/geometry';

// What the overlay draws: the card of one step and the control it highlights (null: a centered card with nothing highlighted).
export interface ShownCard {
  title: string;
  body: string;
  rect: Rect | null;
  side?: CardSide;
  // "3 of 9", or "Step 3" while the count is still open.
  progress: string;
  first: boolean;
  last: boolean;
  // The last card of the welcome offers the walk through every screen.
  offerFull: boolean;
  // Present while a section of the full tour is running: "Screen 2 of 9".
  section?: string;
}

const DIM = 'rgba(10, 5, 24, 0.78)';

// The dark layer over the whole app with a hole where the control is, and the card that explains it. It swallows every touch (the
// app underneath waits until the tour ends); the card's buttons are the only way to move.
export function TourOverlay({
  card,
  safe,
  onNext,
  onPrev,
  onClose,
  onFull,
  onCardHeight,
}: {
  card: ShownCard;
  safe: Safe;
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
  onFull: () => void;
  onCardHeight: (height: number) => void;
}) {
  const t = useT();
  const { width, height } = useWindowDimensions();
  const dark = useColorScheme() === 'dark';
  const colors = Colors[dark ? 'dark' : 'light'];
  const [measured, setMeasured] = useState(0);
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fade.setValue(0);
    Animated.timing(fade, { toValue: 1, duration: 180, useNativeDriver: true }).start();
  }, [card, fade]);

  const cw = cardWidth(width);
  const placement = cardPlacement({ target: card.rect, safe, card: { width: cw, height: measured || 220 }, prefer: card.side });
  const hole = card.rect ? spotlightFor(card.rect, width) : null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="auto" accessibilityViewIsModal>
      {/* Swallows the touches that fall on the dark layer. */}
      <Pressable style={StyleSheet.absoluteFill} onPress={() => {}} accessible={false} />
      <Svg width={width} height={height} style={StyleSheet.absoluteFill} pointerEvents="none">
        <Defs>
          <Mask id="tour-hole">
            <SvgRect x={0} y={0} width={width} height={height} fill="#ffffff" />
            {hole ? <SvgRect x={hole.x} y={hole.y} width={hole.width} height={hole.height} rx={16} ry={16} fill="#000000" /> : null}
          </Mask>
        </Defs>
        <SvgRect x={0} y={0} width={width} height={height} fill={DIM} mask="url(#tour-hole)" />
        {hole ? <SvgRect x={hole.x} y={hole.y} width={hole.width} height={hole.height} rx={16} ry={16} fill="none" stroke="#d8b4fe" strokeWidth={2} /> : null}
      </Svg>

      <Animated.View
        pointerEvents="box-none"
        onLayout={(event) => {
          const next = Math.round(event.nativeEvent.layout.height);
          if (next !== measured) {
            setMeasured(next);
            onCardHeight(next);
          }
        }}
        style={{
          position: 'absolute',
          left: placement.left,
          top: placement.top,
          width: cw,
          opacity: fade,
          borderRadius: 24,
          padding: 18,
          gap: 10,
          backgroundColor: dark ? '#241543' : '#ffffff',
          borderWidth: 1,
          borderColor: dark ? 'rgba(216,180,254,0.35)' : 'rgba(126,34,206,0.2)',
          shadowColor: '#000000',
          shadowOpacity: 0.4,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: 8 },
          elevation: 16,
        }}>
        <View className="flex-row items-start gap-3">
          <Text accessibilityRole="header" className="flex-1 font-inter-bold text-lg" style={{ color: colors.text }}>{card.title}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel={t('tour.ui.close')} onPress={onClose} hitSlop={12}>
            <Ionicons name="close" size={22} color={colors.textSecondary} />
          </Pressable>
        </View>
        <ScrollView style={{ maxHeight: Math.max(120, (safe.bottom - safe.top) * 0.42) }} showsVerticalScrollIndicator={false}>
          <Text className="font-inter text-base" style={{ color: colors.text, lineHeight: 22 }}>{card.body}</Text>
        </ScrollView>
        <View className="flex-row items-center justify-between gap-3 pt-1">
          <Text className="font-inter-medium text-xs" style={{ color: colors.textSecondary }}>{card.section ? `${card.section} · ${card.progress}` : card.progress}</Text>
          <View className="flex-row items-center gap-2">
            {!card.first ? (
              <Pressable accessibilityRole="button" onPress={onPrev} className="rounded-full px-4 py-2.5" style={{ borderWidth: 1, borderColor: colors.border }}>
                <Text className="font-inter-semibold text-sm" style={{ color: colors.text }}>{t('tour.ui.prev')}</Text>
              </Pressable>
            ) : null}
            {card.offerFull ? (
              <Pressable accessibilityRole="button" onPress={onFull} className="rounded-full px-4 py-2.5" style={{ borderWidth: 1, borderColor: colors.border }}>
                <Text className="font-inter-semibold text-sm" style={{ color: colors.text }}>{t('tour.ui.fullTour')}</Text>
              </Pressable>
            ) : null}
            <Pressable accessibilityRole="button" onPress={onNext}>
              <LinearGradient colors={['#e879f9', '#a855f7', '#7e22ce']} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }} style={{ borderRadius: 22, paddingHorizontal: 20, paddingVertical: 11 }}>
                <Text className="font-inter-semibold text-sm text-white">{card.last ? t('tour.ui.done') : t('tour.ui.next')}</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}
