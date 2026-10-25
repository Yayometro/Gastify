import Svg, { Circle } from 'react-native-svg';

// The figures that drift behind the page: solid circles with crisp edges, like the ones on the debit cards, at a strong
// opacity so they read as shapes (not as glow).
export type FigureKind = 'circle';

export function Figure({ size, color, opacity }: { kind?: FigureKind; size: number; id?: string; color: string; opacity: number }) {
  return (
    <Svg width={size} height={size}>
      <Circle cx={size / 2} cy={size / 2} r={size / 2} fill={color} fillOpacity={opacity} />
    </Svg>
  );
}
