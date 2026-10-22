import { Pressable, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { CategoryBadge } from '@/components/category-badge';
import { donutArcs, type BreakdownSlice } from '@gastify/core/history/categoryBreakdown';

const DEFAULT_SIZE = 230;

function geometry(size: number) {
  const stroke = Math.round(size * 0.13);
  const radius = (size - stroke) / 2 - 4;
  const center = size / 2;
  const point = (angleDegrees: number) => {
    const radians = (angleDegrees * Math.PI) / 180;
    return { x: center + radius * Math.sin(radians), y: center - radius * Math.cos(radians) };
  };
  const arcPath = (startAngle: number, endAngle: number) => {
    const start = point(startAngle);
    const end = point(endAngle);
    const large = endAngle - startAngle > 180 ? 1 : 0;
    return `M ${start.x.toFixed(2)} ${start.y.toFixed(2)} A ${radius} ${radius} 0 ${large} 1 ${end.x.toFixed(2)} ${end.y.toFixed(2)}`;
  };
  return { stroke, arcPath };
}

// The donut of a breakdown (the web's sunburst): one arc per slice, the chosen one standing out, and
// the label of the chosen slice (or the total) in the middle. Tapping an arc chooses it; the middle is
// a button the screen can use to go back.
export function CategoryDonut({
  slices,
  selectedKey,
  onSelect,
  centerTitle,
  centerValue,
  centerHint,
  onCenterPress,
  centerIcon,
  trackColor,
  size = DEFAULT_SIZE,
}: {
  slices: BreakdownSlice[];
  selectedKey: string | null;
  onSelect: (key: string) => void;
  centerTitle: string;
  centerValue: string;
  centerHint?: string;
  onCenterPress?: () => void;
  // The icon of the category that is open, shown above its name in the middle of the ring.
  centerIcon?: { icon?: string; color?: string } | null;
  trackColor: string;
  size?: number;
}) {
  const SIZE = size;
  const { stroke: STROKE, arcPath } = geometry(size);
  const arcs = donutArcs(slices);
  const byKey = new Map(slices.map((slice) => [slice.key, slice]));

  return (
    <View style={{ width: SIZE, height: SIZE, alignSelf: 'center' }}>
      <Svg width={SIZE} height={SIZE}>
        <Path d={arcPath(0, 359.99)} stroke={trackColor} strokeWidth={STROKE} fill="none" />
        {arcs.map((arc) => {
          const slice = byKey.get(arc.key);
          const dimmed = selectedKey !== null && selectedKey !== arc.key;
          return (
            <Path
              key={arc.key}
              d={arcPath(arc.startAngle, arc.endAngle)}
              stroke={slice?.color ?? '#9ca3af'}
              strokeWidth={selectedKey === arc.key ? STROKE + 8 : STROKE}
              strokeOpacity={dimmed ? 0.35 : 1}
              fill="none"
              onPress={() => onSelect(arc.key)}
            />
          );
        })}
      </Svg>
      <Pressable
        accessibilityRole={onCenterPress ? 'button' : 'text'}
        accessibilityLabel={`${centerTitle}, ${centerValue}`}
        disabled={!onCenterPress}
        onPress={onCenterPress}
        style={{ position: 'absolute', left: STROKE + 14, right: STROKE + 14, top: STROKE + 14, bottom: STROKE + 14, alignItems: 'center', justifyContent: 'center' }}>
        {centerIcon?.icon ? <CategoryBadge icon={centerIcon.icon} color={centerIcon.color} size={34} /> : null}
        <Text className="text-center font-inter-medium text-xs text-gf-text-muted" numberOfLines={1}>{centerTitle}</Text>
        <Text className="text-center font-inter-bold text-lg text-gf-text" numberOfLines={1} adjustsFontSizeToFit>{centerValue}</Text>
        {centerHint ? <Text className="text-center font-inter text-xs text-gf-text-muted" numberOfLines={1}>{centerHint}</Text> : null}
      </Pressable>
    </View>
  );
}
