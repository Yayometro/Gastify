import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { squarify } from '@gastify/core/charts/layouts';
import type { BreakdownSlice } from '@gastify/core/history/categoryBreakdown';

const GAP = 3;

// The categories as a treemap (the web's TreeMap): one rectangle per slice, its area proportional to the amount.
// Tap a rectangle to choose it.
export function CategoryTreemap({
  slices,
  selectedKey,
  onSelect,
  total,
  height = 260,
}: {
  slices: BreakdownSlice[];
  selectedKey: string | null;
  onSelect: (key: string) => void;
  total: number;
  height?: number;
}) {
  const [width, setWidth] = useState(0);
  const rects = useMemo(() => (width > 0 ? squarify(slices.map((slice) => ({ ...slice })), 0, 0, width, height) : []), [slices, width, height]);

  return (
    <View onLayout={(event) => setWidth(event.nativeEvent.layout.width)} style={{ height, width: '100%' }}>
      {rects.map(({ node, x, y, width: w, height: h }) => {
        const share = total > 0 ? Math.round((node.value / total) * 100) : 0;
        const dimmed = selectedKey !== null && selectedKey !== node.key;
        const big = w > 90 && h > 60;
        return (
          <Pressable
            key={node.key}
            accessibilityRole="button"
            accessibilityLabel={`${node.name}, ${share}%`}
            onPress={() => onSelect(node.key)}
            style={{ position: 'absolute', left: x + GAP / 2, top: y + GAP / 2, width: Math.max(0, w - GAP), height: Math.max(0, h - GAP), borderRadius: 14, backgroundColor: node.color, opacity: dimmed ? 0.4 : 1, padding: 8, overflow: 'hidden' }}>
            {w > 54 && h > 40 && (
              <Text className="font-inter-semibold" numberOfLines={big ? 2 : 1} style={{ color: '#ffffff', fontSize: big ? 13 : 11, textShadowColor: 'rgba(0,0,0,0.35)', textShadowRadius: 3 }}>
                {node.name}
              </Text>
            )}
            {big && <Text className="font-inter" style={{ color: 'rgba(255,255,255,0.92)', fontSize: 12, textShadowColor: 'rgba(0,0,0,0.35)', textShadowRadius: 3 }}>{share}%</Text>}
          </Pressable>
        );
      })}
    </View>
  );
}
