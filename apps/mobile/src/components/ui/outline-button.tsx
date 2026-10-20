import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, Text } from 'react-native';

// The secondary button (Google, passkey): a surface-colored pill with a thin border.
export function OutlineButton({
  label,
  icon,
  onPress,
  loading = false,
  disabled = false,
}: {
  label: string;
  icon: ReactNode;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}) {
  const inactive = loading || disabled;
  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: inactive, busy: loading }}
      className="h-[52px] flex-row items-center justify-center gap-3 rounded-full border border-gf-border bg-gf-surface"
      style={{ opacity: inactive ? 0.6 : 1 }}>
      {loading ? <ActivityIndicator /> : icon}
      <Text className="font-inter-semibold text-base text-gf-text">{label}</Text>
    </Pressable>
  );
}
