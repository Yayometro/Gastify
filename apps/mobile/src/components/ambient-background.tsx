import { useState } from 'react';
import { StyleSheet, View, useColorScheme } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

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

export const DARK_BASE = '#140b26';

// `baseOpacity` < 1 lets whatever is behind show through the dark base (the sheets' light see-through glass).
export function AmbientBackground({ baseOpacity = 1 }: { baseOpacity?: number } = {}) {
  const scheme = useColorScheme();
  // The mesh is drawn at the size its container really has, re-measured on every layout. On iOS a '100%' SVG kept the
  // size of its first layout, so after turning the iPad, or when a sheet grew once its content arrived, an edge of the
  // screen was left without the gradient.
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  if (scheme !== 'dark') return null;
  return (
    <View
      pointerEvents="none"
      style={StyleSheet.absoluteFill}
      onLayout={(event) => {
        const { width, height } = event.nativeEvent.layout;
        setSize((current) => (current && current.width === width && current.height === height ? current : { width, height }));
      }}>
      <Svg key={size ? `${size.width}x${size.height}` : 'initial'} width={size ? size.width : '100%'} height={size ? size.height : '100%'} preserveAspectRatio="none">
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
    </View>
  );
}
