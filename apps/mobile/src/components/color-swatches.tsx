import { Pressable, View } from 'react-native';

import { CATEGORY_COLORS } from '@gastify/core/categories/categoryForm';

// The palette of the category editor: a circle per color, the chosen one ringed.
export function ColorSwatches({ value, onChange }: { value: string; onChange: (color: string) => void }) {
  return (
    <View className="flex-row flex-wrap gap-3">
      {CATEGORY_COLORS.map((color) => {
        const selected = color === value;
        return (
          <Pressable
            key={color}
            accessibilityRole="radio"
            accessibilityLabel={`Color ${color}`}
            accessibilityState={{ selected }}
            onPress={() => onChange(color)}
            className="h-10 w-10 items-center justify-center rounded-full"
            style={{ borderWidth: selected ? 3 : 0, borderColor: '#7e22ce' }}>
            <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: color }} />
          </Pressable>
        );
      })}
    </View>
  );
}
