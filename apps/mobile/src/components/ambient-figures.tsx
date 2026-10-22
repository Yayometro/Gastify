import Svg, { Circle, Defs, LinearGradient, Mask, Path, Pattern, RadialGradient, Rect, Stop } from 'react-native-svg';

// The figures that drift behind the page. Fine line work instead of solid shapes, so the glass cards over them keep
// something to refract without any one shape standing out: flowing wave lines, a dot matrix that fades out, diagonal
// hatching inside a soft band and concentric rings that fade outward.

export type FigureKind = 'waves' | 'dots' | 'hatch' | 'rings';

function wave(width: number, y: number, amp: number, period: number, phase: number): string {
  let d = `M0 ${y}`;
  for (let x = 6; x <= width; x += 6) d += ` L${x} ${(y + amp * Math.sin(x / period + phase)).toFixed(1)}`;
  return d;
}

export function Figure({ kind, size, id }: { kind: FigureKind; size: number; id: string }) {
  if (kind === 'waves') {
    const height = size * 0.5;
    return (
      <Svg width={size} height={height}>
        <Defs>
          <LinearGradient id={`${id}-g`} x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="#c084fc" stopOpacity={0} />
            <Stop offset="0.5" stopColor="#f0abfc" stopOpacity={1} />
            <Stop offset="1" stopColor="#818cf8" stopOpacity={0} />
          </LinearGradient>
        </Defs>
        {[0, 1, 2, 3, 4].map((line) => (
          <Path key={line} d={wave(size, height / 2 + (line - 2) * 14, 18 - line * 2, 34 + line * 6, line * 0.7)} stroke={`url(#${id}-g)`} strokeWidth={1.1} fill="none" opacity={0.85 - line * 0.12} />
        ))}
      </Svg>
    );
  }
  if (kind === 'dots') {
    return (
      <Svg width={size} height={size}>
        <Defs>
          <Pattern id={`${id}-p`} width="16" height="16" patternUnits="userSpaceOnUse">
            <Circle cx="8" cy="8" r="1.3" fill="#e9d5ff" />
          </Pattern>
          <RadialGradient id={`${id}-r`} cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor="#fff" stopOpacity={1} />
            <Stop offset="1" stopColor="#fff" stopOpacity={0} />
          </RadialGradient>
          <Mask id={`${id}-m`}>
            <Rect width={size} height={size} fill={`url(#${id}-r)`} />
          </Mask>
        </Defs>
        <Rect width={size} height={size} fill={`url(#${id}-p)`} mask={`url(#${id}-m)`} />
      </Svg>
    );
  }
  if (kind === 'hatch') {
    return (
      <Svg width={size} height={size * 0.55}>
        <Defs>
          <Pattern id={`${id}-p`} width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
            <Path d="M0 0 L0 12" stroke="#f5d0fe" strokeWidth={1} />
          </Pattern>
          <LinearGradient id={`${id}-g`} x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="#fff" stopOpacity={0} />
            <Stop offset="0.5" stopColor="#fff" stopOpacity={1} />
            <Stop offset="1" stopColor="#fff" stopOpacity={0} />
          </LinearGradient>
          <Mask id={`${id}-m`}>
            <Rect width={size} height={size * 0.55} fill={`url(#${id}-g)`} />
          </Mask>
        </Defs>
        <Rect width={size} height={size * 0.55} fill={`url(#${id}-p)`} mask={`url(#${id}-m)`} />
      </Svg>
    );
  }
  return (
    <Svg width={size} height={size}>
      <Defs>
        <LinearGradient id={`${id}-g`} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#f0abfc" stopOpacity={1} />
          <Stop offset="1" stopColor="#818cf8" stopOpacity={0.2} />
        </LinearGradient>
      </Defs>
      {[1, 0.82, 0.64, 0.46, 0.3].map((scale, index) => (
        <Circle key={scale} cx={size / 2} cy={size / 2} r={(size / 2 - 2) * scale} stroke={`url(#${id}-g)`} strokeWidth={1} fill="none" opacity={1 - index * 0.17} />
      ))}
    </Svg>
  );
}
