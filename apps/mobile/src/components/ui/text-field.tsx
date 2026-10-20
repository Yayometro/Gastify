import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, TextInput, type TextInputProps, useColorScheme, View } from 'react-native';

import { Colors } from '@/constants/theme';

// A labelled text input in the Gastify style. With `onClear`, a small × appears at the right while the
// field has text, so one tap empties it (the search boxes use this).
export function TextField({ label, onClear, ...inputProps }: TextInputProps & { label: string; onClear?: () => void }) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const hasText = typeof inputProps.value === 'string' && inputProps.value.length > 0;
  const showClear = Boolean(onClear) && hasText;

  return (
    <View className="gap-2">
      <Text className="font-inter-medium text-sm text-gf-text-muted">{label}</Text>
      <View>
        <TextInput
          className={`rounded-2xl border border-gf-border bg-gf-surface px-4 py-3 font-inter text-base text-gf-text ${showClear ? 'pr-12' : ''}`}
          placeholderTextColor={colors.textSecondary}
          autoCapitalize="none"
          autoCorrect={false}
          accessibilityLabel={label}
          {...inputProps}
        />
        {showClear && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Borrar texto"
            onPress={onClear}
            hitSlop={10}
            style={{ position: 'absolute', top: 0, bottom: 0, right: 12, justifyContent: 'center' }}>
            <Ionicons name="close-circle" size={22} color={colors.textSecondary} />
          </Pressable>
        )}
      </View>
    </View>
  );
}
