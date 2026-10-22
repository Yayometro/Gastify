import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

// The figures that drift behind the page. Nothing has a hard edge: each one is a soft glow, or a circle like the ones on the
// account cards whose edge melts into the background, so the glass cards over them keep something to refract without any
// shape standing out.

export type FigureKind = 'nebula' | 'orb';

// `stops` lists the glow from its centre out: each is an opacity of the colour (0 at the rim, always).
export function Figure({ kind, size, id, color, opacity }: { kind: FigureKind; size: number; id: string; color: string; opacity: number }) {
  const stops = kind === 'nebula' ? [[0, opacity], [0.35, opacity * 0.6], [0.7, opacity * 0.18], [1, 0]] : [[0, opacity * 0.5], [0.62, opacity * 0.9], [0.9, opacity * 0.35], [1, 0]];
  return (
    <Svg width={size} height={size}>
      <Defs>
        <RadialGradient id={`${id}-g`} cx="50%" cy="50%" r="50%">
          {stops.map(([offset, alpha], index) => (
            <Stop key={index} offset={offset} stopColor={color} stopOpacity={alpha} />
          ))}
        </RadialGradient>
      </Defs>
      <Circle cx={size / 2} cy={size / 2} r={size / 2} fill={`url(#${id}-g)`} />
    </Svg>
  );
}
