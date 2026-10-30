import { Text, View, useColorScheme } from 'react-native';

import { TourPressable } from '@/components/tour/tour-target';
import { glassFill } from '@/components/ui/glass-fill';
import { Colors } from '@/constants/theme';

// Two or three exclusive options side by side (Gasto / Ingreso / Transferencia). `tourIds` names an option for the tutorial, which can press it.
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  tourIds,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  tourIds?: Partial<Record<T, string>>;
}) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  return (
    <View className="flex-row rounded-full p-1" style={glassFill(scheme === 'dark', colors.backgroundElement)}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <TourPressable
            key={option.value}
            id={tourIds?.[option.value]}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            className="flex-1 items-center rounded-full py-2.5"
            style={{ backgroundColor: selected ? '#7e22ce' : 'transparent' }}>
            <Text className="font-inter-semibold text-sm" style={{ color: selected ? '#ffffff' : colors.text }}>
              {option.label}
            </Text>
          </TourPressable>
        );
      })}
    </View>
  );
}
