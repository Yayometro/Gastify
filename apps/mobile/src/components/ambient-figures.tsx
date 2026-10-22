import Svg, { Circle, Defs, Mask, Path, Pattern, RadialGradient, Rect, Stop } from 'react-native-svg';

// The figures that drift behind the page: a dot matrix that fades out and a few sparse crosses. Faint on purpose, so the glass
// cards over them keep a little to refract without any shape standing out.

export type FigureKind = 'dots' | 'sparks';

export function Figure({ kind, size, id }: { kind: FigureKind; size: number; id: string }) {
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
  // Sparse little crosses, like a star field seen through frosted glass.
  const marks = [[22, 30], [96, 14], [150, 58], [60, 92], [118, 126], [30, 160], [172, 170], [88, 188]];
  return (
    <Svg width={size} height={size}>
      {marks.map(([x, y], index) => {
        const arm = 3 + (index % 3);
        return <Path key={index} d={`M${x - arm} ${y} L${x + arm} ${y} M${x} ${y - arm} L${x} ${y + arm}`} stroke="#e9d5ff" strokeWidth={1} strokeLinecap="round" />;
      })}
    </Svg>
  );
}
