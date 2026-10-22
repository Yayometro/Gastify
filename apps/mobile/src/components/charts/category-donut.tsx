import { Pressable, Text, View, type GestureResponderEvent } from 'react-native';
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
  return { stroke, arcPath, radius, center };
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
  const { stroke: STROKE, arcPath, radius: RADIUS, center: CENTER } = geometry(size);
  const arcs = donutArcs(slices);
  const byKey = new Map(slices.map((slice) => [slice.key, slice]));

  // A touch on a thin painted arc often misses it, so one transparent area over the whole ring finds the slice from the
  // angle of the touch: it is clockwise from 12 o'clock, like the arcs themselves.
  const pick = (event: GestureResponderEvent) => {
    const { locationX, locationY } = event.nativeEvent;
    const dx = locationX - CENTER;
    const dy = locationY - CENTER;
    const distance = Math.sqrt(dx * dx + dy * dy);
    // Only the band of the ring counts: the middle (the text) and the outside are not slices.
    if (distance < RADIUS - STROKE / 2 - 6 || distance > RADIUS + STROKE / 2 + 6) return;
    let angle = (Math.atan2(dx, -dy) * 180) / Math.PI;
    if (angle < 0) angle += 360;
    const hit = arcs.find((arc) => angle >= arc.startAngle && angle < arc.endAngle);
    if (hit) onSelect(hit.key);
  };

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
            />
          );
        })}
      </Svg>
      {/* One touch area over the ring: it tells the slice from the angle, so a tap anywhere on the band works. */}
      <Pressable accessibilityRole="none" onPress={(event) => pick(event)} style={{ position: 'absolute', left: 0, top: 0, width: SIZE, height: SIZE }} />
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
