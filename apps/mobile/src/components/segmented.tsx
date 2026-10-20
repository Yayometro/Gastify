import { Pressable, Text, View, useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';

// Two or three exclusive options side by side (Gasto / Ingreso / Transferencia).
export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  return (
    <View className="flex-row rounded-full bg-gf-surface p-1">
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            className="flex-1 items-center rounded-full py-2.5"
            style={{ backgroundColor: selected ? colors.accent : 'transparent' }}>
            <Text className="font-inter-semibold text-sm" style={{ color: selected ? '#ffffff' : colors.text }}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
