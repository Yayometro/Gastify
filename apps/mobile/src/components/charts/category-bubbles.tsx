import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { packCircles } from '@gastify/core/charts/layouts';
import type { BreakdownSlice } from '@gastify/core/history/categoryBreakdown';

// The categories as packed circles (the web's bubble chart): the area of each circle is its share of the total.
// Tap a circle to choose it.
export function CategoryBubbles({
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
  const circles = useMemo(() => (width > 0 ? packCircles(slices.map((slice) => ({ ...slice })), width, height) : []), [slices, width, height]);

  return (
    <View onLayout={(event) => setWidth(event.nativeEvent.layout.width)} style={{ height, width: '100%' }}>
      {circles.map(({ node, x, y, r }) => {
        const share = total > 0 ? Math.round((node.value / total) * 100) : 0;
        const dimmed = selectedKey !== null && selectedKey !== node.key;
        return (
          <Pressable
            key={node.key}
            accessibilityRole="button"
            accessibilityLabel={`${node.name}, ${share}%`}
            onPress={() => onSelect(node.key)}
            style={{ position: 'absolute', left: x - r, top: y - r, width: r * 2, height: r * 2, borderRadius: r, backgroundColor: node.color, opacity: dimmed ? 0.4 : 0.95, alignItems: 'center', justifyContent: 'center', padding: 4 }}>
            {r > 26 && (
              <Text className="text-center font-inter-semibold" numberOfLines={2} style={{ color: '#ffffff', fontSize: r > 44 ? 12 : 10, textShadowColor: 'rgba(0,0,0,0.35)', textShadowRadius: 3 }}>
                {node.name}
              </Text>
            )}
            {r > 38 && <Text className="font-inter" style={{ color: 'rgba(255,255,255,0.92)', fontSize: 11, textShadowColor: 'rgba(0,0,0,0.35)', textShadowRadius: 3 }}>{share}%</Text>}
          </Pressable>
        );
      })}
    </View>
  );
}
