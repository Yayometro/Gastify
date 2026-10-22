import { useState } from 'react';
import { Animated, StyleSheet, View, useColorScheme } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

import { Figure, type FigureKind } from '@/components/ambient-figures';

import { ambientScrollY } from '@/lib/ambient-scroll';

// The five blobs of the web's `.walllet-bg` mesh (violet, magenta, indigo, plum), drawn as radial
// gradients over its dark base. Dark mode only, like the web: in light mode the screens keep the flat
// lavender background and there is nothing for the glass surfaces to react to.
const BLOBS = [
  { id: 'a', cx: '18%', cy: '12%', r: '55%', color: '#7c3aed', opacity: 0.5 },
  { id: 'b', cx: '85%', cy: '8%', r: '48%', color: '#c026d3', opacity: 0.45 },
  { id: 'c', cx: '55%', cy: '55%', r: '60%', color: '#6d28d9', opacity: 0.32 },
  { id: 'd', cx: '12%', cy: '85%', r: '55%', color: '#86198f', opacity: 0.32 },
  { id: 'e', cx: '90%', cy: '90%', r: '52%', color: '#7c3aed', opacity: 0.28 },
] as const;

type Blob = { cx: string; cy: string; r: string; color: string; opacity: number };

// More colour as the page goes down: each layer fades in over its own stretch of scroll (points), so a long page
// (the dashboard) keeps finding new hues the further down it goes. The layers stack over the mesh above.
const LAYERS: { from: number; to: number; blobs: Blob[] }[] = [
  {
    from: 420,
    to: 880,
    blobs: [
      { cx: '94%', cy: '40%', r: '55%', color: '#6b21a8', opacity: 0.4 },
      { cx: '6%', cy: '64%', r: '50%', color: '#4a044e', opacity: 0.42 },
    ],
  },
  {
    from: 1100,
    to: 1640,
    blobs: [
      { cx: '20%', cy: '42%', r: '56%', color: '#3b0764', opacity: 0.5 },
      { cx: '98%', cy: '74%', r: '46%', color: '#1e1b4b', opacity: 0.5 },
    ],
  },
  {
    from: 1900,
    to: 2480,
    blobs: [
      { cx: '50%', cy: '94%', r: '62%', color: '#581c87', opacity: 0.45 },
      { cx: '4%', cy: '18%', r: '44%', color: '#2e1065', opacity: 0.5 },
      // The only light touch: a faint glimmer now and then.
      { cx: '96%', cy: '28%', r: '30%', color: '#c084fc', opacity: 0.07 },
    ],
  },
];

// Figures that drift behind the page, each slower than the page itself (a parallax). `top` is where it starts on the
// screen, in points; `speed` is the share of the scroll it travels.
const SHAPES: { kind: FigureKind; color: string; opacity: number; left: string; top: number; size: number; speed: number }[] = [
  { kind: 'circle', color: '#7e22ce', opacity: 0.1, left: '-6%', top: 140, size: 230, speed: 0.12 },
  { kind: 'circle', color: '#c026d3', opacity: 0.1, left: '70%', top: 380, size: 160, speed: 0.18 },
  { kind: 'circle', color: '#4c1d95', opacity: 0.1, left: '12%', top: 620, size: 280, speed: 0.1 },
  { kind: 'circle', color: '#a21caf', opacity: 0.1, left: '64%', top: 900, size: 120, speed: 0.22 },
  { kind: 'circle', color: '#6d28d9', opacity: 0.1, left: '-10%', top: 1180, size: 260, speed: 0.14 },
  { kind: 'circle', color: '#e879f9', opacity: 0.1, left: '72%', top: 1460, size: 190, speed: 0.16 },
  { kind: 'circle', color: '#581c87', opacity: 0.1, left: '50%', top: 1760, size: 320, speed: 0.09 },
  { kind: 'circle', color: '#9333ea', opacity: 0.1, left: '-4%', top: 2040, size: 150, speed: 0.2 },
  { kind: 'circle', color: '#701a75', opacity: 0.1, left: '68%', top: 2300, size: 240, speed: 0.12 },
  { kind: 'circle', color: '#7c3aed', opacity: 0.1, left: '20%', top: 2600, size: 180, speed: 0.18 },
];

export const DARK_BASE = '#140b26';

// `baseOpacity` < 1 lets whatever is behind show through the dark base (the sheets' light see-through glass).
export function AmbientBackground({ baseOpacity = 1 }: { baseOpacity?: number } = {}) {
  const scheme = useColorScheme();
  // The mesh is drawn at the size its container really has, re-measured on every layout. On iOS a '100%' SVG kept the
  // size of its first layout, so after turning the iPad, or when a sheet grew once its content arrived, an edge of the
  // screen was left without the gradient.
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  if (scheme !== 'dark') return null;
  const svgKey = size ? `${size.width}x${size.height}` : 'initial';
  const svgSize = { width: size ? size.width : '100%', height: size ? size.height : '100%' } as const;
  return (
    <View
      pointerEvents="none"
      style={StyleSheet.absoluteFill}
      onLayout={(event) => {
        const { width, height } = event.nativeEvent.layout;
        setSize((current) => (current && current.width === width && current.height === height ? current : { width, height }));
      }}>
      <Svg key={svgKey} {...svgSize} preserveAspectRatio="none">
        <Defs>
          {BLOBS.map((blob) => (
            <RadialGradient key={blob.id} id={blob.id} cx={blob.cx} cy={blob.cy} r={blob.r} gradientUnits="objectBoundingBox">
              <Stop offset="0" stopColor={blob.color} stopOpacity={blob.opacity} />
              <Stop offset="1" stopColor={blob.color} stopOpacity={0} />
            </RadialGradient>
          ))}
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill={DARK_BASE} fillOpacity={baseOpacity} />
        {BLOBS.map((blob) => (
          <Rect key={blob.id} x="0" y="0" width="100%" height="100%" fill={`url(#${blob.id})`} />
        ))}
      </Svg>

      {LAYERS.map((layer, index) => (
        <Animated.View
          key={`layer-${index}`}
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, { opacity: ambientScrollY.interpolate({ inputRange: [layer.from, layer.to], outputRange: [0, 1], extrapolate: 'clamp' }) }]}>
          <Svg key={`${svgKey}-${index}`} {...svgSize} preserveAspectRatio="none">
            <Defs>
              {layer.blobs.map((blob, blobIndex) => (
                <RadialGradient key={blobIndex} id={`layer-${index}-${blobIndex}`} cx={blob.cx} cy={blob.cy} r={blob.r} gradientUnits="objectBoundingBox">
                  <Stop offset="0" stopColor={blob.color} stopOpacity={blob.opacity} />
                  <Stop offset="1" stopColor={blob.color} stopOpacity={0} />
                </RadialGradient>
              ))}
            </Defs>
            {layer.blobs.map((_, blobIndex) => (
              <Rect key={blobIndex} x="0" y="0" width="100%" height="100%" fill={`url(#layer-${index}-${blobIndex})`} />
            ))}
          </Svg>
        </Animated.View>
      ))}

      {SHAPES.map((shape, index) => (
        <Animated.View
          key={`shape-${index}`}
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: shape.left as `${number}%`,
            top: shape.top,
            width: shape.size,
            height: shape.size,
            opacity: shape.opacity,
            transform: [
              {
                translateY: ambientScrollY.interpolate({ inputRange: [0, 1000], outputRange: [0, -1000 * shape.speed], extrapolate: 'extend' }),
              },
            ],
          }}>
          <Figure kind={shape.kind} size={shape.size} id={`fig-${index}`} color={shape.color} opacity={shape.opacity} />
        </Animated.View>
      ))}
    </View>
  );
}
