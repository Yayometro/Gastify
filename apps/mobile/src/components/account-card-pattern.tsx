import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, Path, Pattern, Rect } from 'react-native-svg';

import { DEFAULT_CARD_PATTERN } from '@gastify/core/accounts/cardStyle';

// The decoration over a card's color. Every pattern is a small tile repeated across the card, drawn in the card's
// tint, so it reads on a light card and on a dark one alike. "circles" is the original soft circles.
const CANVAS_WIDTH = 1000;
const CANVAS_HEIGHT = 800;

export function CardPattern({ pattern = DEFAULT_CARD_PATTERN, tint }: { pattern?: string; tint: (alpha: number) => string }) {
  if (pattern === 'plain') return null;
  if (pattern === 'circles' || !['dots', 'stripes', 'grid', 'waves'].includes(pattern)) {
    return (
      <>
        <View pointerEvents="none" style={{ position: 'absolute', right: -40, top: -40, width: 150, height: 150, borderRadius: 75, backgroundColor: tint(0.12) }} />
        <View pointerEvents="none" style={{ position: 'absolute', right: 30, bottom: -60, width: 130, height: 130, borderRadius: 65, backgroundColor: tint(0.08) }} />
      </>
    );
  }
  const tile = pattern === 'waves' ? 24 : pattern === 'dots' ? 18 : 14;
  const stroke = tint(0.16);
  return (
    // A canvas larger than any card, clipped by the card's own edge: the pattern reaches every corner and edge.
    <Svg pointerEvents="none" style={[StyleSheet.absoluteFill, { top: 0, left: 0 }]} width={CANVAS_WIDTH} height={CANVAS_HEIGHT}>
      <Defs>
        <Pattern id={`gf-card-${pattern}`} x={0} y={0} width={tile} height={tile} patternUnits="userSpaceOnUse">
          {pattern === 'dots' && <Circle cx={tile / 2} cy={tile / 2} r={1.8} fill={tint(0.22)} />}
          {pattern === 'stripes' && <Path d={`M0 ${tile} L${tile} 0 M-${tile / 2} ${tile / 2} L${tile / 2} -${tile / 2} M${tile / 2} ${tile + tile / 2} L${tile + tile / 2} ${tile / 2}`} stroke={stroke} strokeWidth={2} />}
          {pattern === 'grid' && <Path d={`M0 0 L${tile} 0 L${tile} ${tile} L0 ${tile} Z`} fill="none" stroke={stroke} strokeWidth={1} />}
          {pattern === 'waves' && <Path d={`M0 12 Q6 4 12 12 T24 12`} fill="none" stroke={stroke} strokeWidth={2} />}
        </Pattern>
      </Defs>
      <Rect x={0} y={0} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} fill={`url(#gf-card-${pattern})`} />
    </Svg>
  );
}
