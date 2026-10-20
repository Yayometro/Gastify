import { Text, TextInput, type TextInputProps, useColorScheme, View } from 'react-native';

import { Colors } from '@/constants/theme';

// A labelled text input in the Gastify style.
export function TextField({ label, ...inputProps }: TextInputProps & { label: string }) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  return (
    <View className="gap-2">
      <Text className="font-inter-medium text-sm text-gf-text-muted">{label}</Text>
      <TextInput
        className="rounded-2xl border border-gf-border bg-gf-surface px-4 py-3 font-inter text-base text-gf-text"
        placeholderTextColor={colors.textSecondary}
        autoCapitalize="none"
        autoCorrect={false}
        accessibilityLabel={label}
        {...inputProps}
      />
    </View>
  );
}
