import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { TextField } from '@/components/ui/text-field';
import { CATEGORY_COLORS } from '@gastify/core/categories/categoryForm';
import { COLOR_GRID, normalizeHex } from '@gastify/core/colors/palette';
import { useT } from "@/i18n/client";

function Swatch({ color, selected, onPress, size = 34 }: { color: string; selected: boolean; onPress: () => void; size?: number }) {
  const t = useT();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={t("mobile.colorLabel", { p1: color })}
      accessibilityState={{ selected }}
      onPress={onPress}
      className="items-center justify-center rounded-full"
      style={{ width: size + 8, height: size + 8, borderWidth: selected ? 3 : 0, borderColor: '#7e22ce' }}>
      <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color }} />
    </Pressable>
  );
}

// Any color: the web's own palette first, then a wide grid, and a field for an exact hexadecimal color.
export function ColorPicker({ value, onChange }: { value: string; onChange: (color: string) => void }) {
  const t = useT();
  const [hex, setHex] = useState(value);
  const valid = normalizeHex(hex);

  return (
    <View className="gap-4">
      <View className="gap-2">
        <Text className="font-inter-medium text-sm text-gf-text-muted">{t("mobile.los.de.siempre")}</Text>
        <View className="flex-row flex-wrap gap-1">
          {CATEGORY_COLORS.map((color) => (
            <Swatch key={color} color={color} selected={color.toUpperCase() === value.toUpperCase()} onPress={() => { onChange(color); setHex(color); }} />
          ))}
        </View>
      </View>
      <View className="gap-2">
        <Text className="font-inter-medium text-sm text-gf-text-muted">{t("mobile.mas.colores")}</Text>
        <View className="flex-row flex-wrap gap-1">
          {COLOR_GRID.map((color) => (
            <Swatch key={color} color={color} size={26} selected={color.toUpperCase() === value.toUpperCase()} onPress={() => { onChange(color); setHex(color); }} />
          ))}
        </View>
      </View>
      <View className="flex-row items-end gap-3">
        <View className="flex-1">
          <TextField
            label={t("mobile.color.exacto.hexadecimal")}
            value={hex}
            onChangeText={(text) => {
              setHex(text);
              const normalized = normalizeHex(text);
              if (normalized) onChange(normalized);
            }}
            placeholder="#F57C00"
            autoCapitalize="characters"
            maxLength={7}
          />
        </View>
        <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: valid ?? value, borderWidth: 1, borderColor: 'rgba(128,128,128,0.4)', marginBottom: 0 }} />
      </View>
      {hex.trim() !== '' && !valid && <Text className="font-inter text-sm text-red-500">{t("mobile.usa.un.color.como.f57c00")}</Text>}
    </View>
  );
}
