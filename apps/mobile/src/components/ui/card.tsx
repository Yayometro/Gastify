import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { InfoTip, type InfoText } from '@/components/info-tip';
import { GlassSurface } from '@/components/ui/glass';

// A rounded surface, the same as the web's cards. The optional title sits on the left; on the right, the optional
// action (a link, a button) and, when `info` is given, the "?" in the top right corner.
export function Card({ title, info, action, children }: { title?: string; info?: InfoText; action?: ReactNode; children?: ReactNode }) {
  return (
    <GlassSurface style={{ padding: 16, gap: 12 }}>
      {title || action || info ? (
        <View className="flex-row items-center justify-between gap-3">
          {title ? <Text className="flex-1 font-inter-semibold text-base text-gf-text">{title}</Text> : <View className="flex-1" />}
          <View className="flex-row items-center gap-3">
            {action}
            {info ? <InfoTip info={info} /> : null}
          </View>
        </View>
      ) : null}
      {children}
    </GlassSurface>
  );
}
