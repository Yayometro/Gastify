import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

// A rounded surface, the same as the web's cards. The optional title sits on the left and the
// optional action (a link, a button) on the right.
export function Card({ title, action, children }: { title?: string; action?: ReactNode; children?: ReactNode }) {
  return (
    <View className="gap-3 rounded-3xl bg-gf-surface p-4">
      {title || action ? (
        <View className="flex-row items-center justify-between gap-3">
          {title ? <Text className="font-inter-semibold text-base text-gf-text">{title}</Text> : <View />}
          {action}
        </View>
      ) : null}
      {children}
    </View>
  );
}
