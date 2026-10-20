import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator, Pressable, Text } from 'react-native';

// The main button: the same purple gradient as the web's "+" button (.gf-glass-fab).
export function GradientButton({
  label,
  onPress,
  loading = false,
  disabled = false,
}: {
  label: string;
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
      style={{ opacity: inactive ? 0.6 : 1 }}>
      <LinearGradient
        colors={['#e879f9', '#a855f7', '#7e22ce']}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={{ height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' }}>
        {loading ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text className="font-inter-semibold text-base text-white">{label}</Text>
        )}
      </LinearGradient>
    </Pressable>
  );
}
