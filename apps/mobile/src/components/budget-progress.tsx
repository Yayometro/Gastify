import { useState } from 'react';
import { Text, View } from 'react-native';

import { ProgressBar } from '@/components/ui/progress-bar';

const moodOf = (ratio: number) => {
  if (ratio >= 1) return { face: '🔥', label: 'Límite alcanzado o superado' };
  if (ratio >= 0.9) return { face: '😰', label: 'Muy cerca del límite' };
  if (ratio >= 0.75) return { face: '😟', label: 'Acercándose al límite' };
  return { face: '🙂', label: 'Dentro del presupuesto' };
};

// The percentage follows the head of the bar while remaining fully visible at either end.
export function BudgetProgress({ ratio, color, saving = false }: { ratio: number; color: string; saving?: boolean }) {
  const [width, setWidth] = useState(0);
  const percent = Math.round(ratio * 100);
  const mood = moodOf(ratio);
  const markerWidth = 72;
  const position = Math.max(0, Math.min(width - markerWidth, Math.min(1, Math.max(0, ratio)) * width - markerWidth / 2));

  return (
    <View onLayout={(event) => setWidth(event.nativeEvent.layout.width)} style={{ height: 43, justifyContent: 'flex-end' }} accessibilityLabel={`${saving ? 'Meta' : mood.label}: ${percent}%`}>
      <View style={{ position: 'absolute', top: 0, left: position, width: markerWidth, alignItems: 'center' }}>
        <Text className="font-inter-bold text-sm text-gf-text">{saving ? '🎯' : mood.face} {percent}%</Text>
      </View>
      <ProgressBar ratio={ratio} color={color} />
    </View>
  );
}
