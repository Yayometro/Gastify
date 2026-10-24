import { useState } from 'react';
import { Pressable, ScrollView, Text, View, useColorScheme } from 'react-native';

import { BankBadge } from '@/components/bank-badge';
import { TextField } from '@/components/ui/text-field';
import { Colors } from '@/constants/theme';
import { normalizeText } from '@gastify/core/search/normalizeText';
import { banksForCountry, type Bank } from '@gastify/core/banks/banks';
import { useT } from "@/i18n/client";

// The banks of a country as small tiles, the main ones first and the rest below. Each group is one row that scrolls sideways,
// with a button that opens all of its banks at once. Tapping the chosen one again clears it (the bank is optional).
export function BankPicker({ country, value, onChange }: { country: string; value: string | null; onChange: (id: string | null) => void }) {
  const t = useT();
  const colors = Colors[useColorScheme() === 'dark' ? 'dark' : 'light'];
  const [query, setQuery] = useState('');
  const [openAll, setOpenAll] = useState<Record<string, boolean>>({});
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
        className="items-center gap-1 rounded-2xl px-1.5 py-2"
        style={{ width: 74, borderWidth: 1, borderColor: selected ? colors.accent : colors.border, backgroundColor: selected ? colors.accentSoft : 'rgba(255,255,255,0.05)' }}>
        <BankBadge bankId={bank.id} size={32} />
        <Text className="text-center font-inter-medium text-[10px] text-gf-text" numberOfLines={2}>{bank.name}</Text>
      </Pressable>
    );
  };
  const group = (key: string, title: string, banks: Bank[]) => {
    if (banks.length === 0) return null;
    const expanded = Boolean(openAll[key]) || needle.length > 0;
    return (
      <View className="gap-2">
        <View className="flex-row items-center justify-between">
          <Text className="font-inter-semibold text-xs uppercase text-gf-text-muted">{title}</Text>
          {banks.length > 4 && needle.length === 0 ? (
            <Pressable accessibilityRole="button" onPress={() => setOpenAll((current) => ({ ...current, [key]: !current[key] }))} hitSlop={8}>
              <Text className="font-inter-semibold text-xs" style={{ color: colors.accent }}>{expanded ? 'Ver menos ‹' : `Ver todos (${banks.length}) ›`}</Text>
            </Pressable>
          ) : null}
        </View>
        {expanded ? (
          <View className="flex-row flex-wrap gap-2">{banks.map(tile)}</View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>{banks.map(tile)}</ScrollView>
        )}
      </View>
    );
  };
  return (
    <View className="gap-4">
      <TextField label={t("mobile.buscar.banco")} value={query} onChangeText={setQuery} onClear={() => setQuery('')} placeholder={t("mobile.por.ejemplo.nu.o.bbva")} />
      {main.length === 0 && other.length === 0 && <Text className="font-inter text-sm text-gf-text-muted">{t("mobile.ningun.banco.coincide.con.p1", { p1: query })}</Text>}
      {group('main', 'Principales', main)}
      {group('other', 'Otros bancos y digitales', other)}
    </View>
  );
}
