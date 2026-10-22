import { useState } from 'react';
import { Pressable, Text, View, useColorScheme } from 'react-native';

import { BankBadge } from '@/components/bank-badge';
import { TextField } from '@/components/ui/text-field';
import { Colors } from '@/constants/theme';
import { normalizeText } from '@gastify/core/search/normalizeText';
import { banksForCountry, type Bank } from '@gastify/core/banks/banks';

// The banks of a country as tiles, the main ones first and the rest below. Tapping the chosen one again clears it (the bank
// is optional).
export function BankPicker({ country, value, onChange }: { country: string; value: string | null; onChange: (id: string | null) => void }) {
  const colors = Colors[useColorScheme() === 'dark' ? 'dark' : 'light'];
  const [query, setQuery] = useState('');
  const needle = normalizeText(query);
  const found = (bank: Bank) => !needle || normalizeText(`${bank.name} ${bank.short}`).includes(needle);
  const { main: allMain, other: allOther } = banksForCountry(country);
  const main = allMain.filter(found);
  const other = allOther.filter(found);
  const tile = (bank: Bank) => {
    const selected = value === bank.id;
    return (
      <Pressable
        key={bank.id}
        accessibilityRole="radio"
        accessibilityState={{ selected }}
        accessibilityLabel={bank.name}
        onPress={() => onChange(selected ? null : bank.id)}
        className="items-center gap-1.5 rounded-2xl px-2 py-3"
        style={{ width: '31%', borderWidth: 1, borderColor: selected ? colors.accent : colors.border, backgroundColor: selected ? colors.accentSoft : 'rgba(255,255,255,0.05)' }}>
        <BankBadge bankId={bank.id} size={44} />
        <Text className="text-center font-inter-medium text-xs text-gf-text" numberOfLines={2}>{bank.name}</Text>
      </Pressable>
    );
  };
  return (
    <View className="gap-4">
      <TextField label="Buscar banco" value={query} onChangeText={setQuery} onClear={() => setQuery('')} placeholder="Por ejemplo, Nu o BBVA" />
      {main.length === 0 && other.length === 0 && <Text className="font-inter text-sm text-gf-text-muted">Ningún banco coincide con «{query}».</Text>}
      {main.length > 0 && (
        <View className="gap-2">
          <Text className="font-inter-semibold text-xs uppercase text-gf-text-muted">Principales</Text>
          <View className="flex-row flex-wrap gap-2">{main.map(tile)}</View>
        </View>
      )}
      {other.length > 0 && (
        <View className="gap-2">
          <Text className="font-inter-semibold text-xs uppercase text-gf-text-muted">Otros bancos y digitales</Text>
          <View className="flex-row flex-wrap gap-2">{other.map(tile)}</View>
        </View>
      )}
    </View>
  );
}
