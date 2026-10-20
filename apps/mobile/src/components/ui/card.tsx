import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { GlassSurface } from '@/components/ui/glass';

// A rounded surface, the same as the web's cards. The optional title sits on the left and the
// optional action (a link, a button) on the right.
export function Card({ title, action, children }: { title?: string; action?: ReactNode; children?: ReactNode }) {
  return (
    <GlassSurface style={{ padding: 16, gap: 12 }}>
      {title || action ? (
        <View className="flex-row items-center justify-between gap-3">
          {title ? <Text className="font-inter-semibold text-base text-gf-text">{title}</Text> : <View />}
          {action}
        </View>
      ) : null}
      {children}
    </GlassSurface>
  );
}
