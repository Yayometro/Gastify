import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { InfoTip, type InfoText } from '@/components/info-tip';
import { GlassSurface } from '@/components/ui/glass';

// A rounded surface, the same as the web's cards. The optional title sits on the left (with a "?" when
// `info` is given) and the optional action (a link, a button) on the right.
export function Card({ title, info, action, children }: { title?: string; info?: InfoText; action?: ReactNode; children?: ReactNode }) {
  return (
    <GlassSurface style={{ padding: 16, gap: 12 }}>
      {title || action ? (
        <View className="flex-row items-center justify-between gap-3">
          {title ? (
            <View className="flex-row items-center gap-2">
              <Text className="font-inter-semibold text-base text-gf-text">{title}</Text>
              {info ? <InfoTip info={info} /> : null}
            </View>
          ) : (
            <View />
          )}
          {action}
        </View>
      ) : null}
      {children}
    </GlassSurface>
  );
}
