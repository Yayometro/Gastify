import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, Text, View, useColorScheme } from 'react-native';

import { ChipPicker, type ChipItem } from '@/components/chip-picker';
import { Card } from '@/components/ui/card';
import { GradientButton } from '@/components/ui/gradient-button';
import { TextField } from '@/components/ui/text-field';
import { Colors } from '@/constants/theme';
import { GfSwitch } from '@/components/ui/switch';
import type { AccountData } from '@gastify/core/features/accountsSlice';
import type { CategoryData } from '@gastify/core/features/categoriesSlice';
import type { SubCategoryData } from '@gastify/core/features/subCategorySlice';
import { idOf, subCategoriesOf } from '@gastify/core/categories/categoryForm';
import { SUPPORTED_CURRENCIES } from '@gastify/core/money/currencies';
import { DUPLICATE_CRITERIA_LABELS, toleranceFrom, type DuplicateSettings } from '@gastify/core/transactions/duplicateSettings';
import { EMPTY_FILTERS, type MovementFilters, type ReadableFilter, type TypeFilter } from '@gastify/core/transactions/movementFilters';

const READABLE: { id: ReadableFilter; label: string }[] = [
  { id: 'all', label: 'Todos' },
  { id: 'readable', label: 'Legibles' },
  { id: 'unreadable', label: 'No legibles' },
];

const TYPES: { id: TypeFilter; label: string }[] = [
  { id: 'all', label: 'Todos' },
  { id: 'income', label: 'Ingresos' },
  { id: 'expense', label: 'Gastos' },
  { id: 'transfer', label: 'Transferencias' },
];

// The filters of the Movements list, like the web's: search, type, category, sub-category, account, exact
// amount (in the main currency or the account's own) and the duplicate finder.
export function MovementFiltersPanel({
  filters,
  onChange,
  categories,
  subCategories,
  accounts,
  duplicatesOn,
  onDuplicatesChange,
  duplicateCount,
  onSelectDuplicates,
  dupDraft,
  onDupDraftChange,
  onRunDuplicates,
  onResetDuplicates,
}: {
  filters: MovementFilters;
  onChange: (next: MovementFilters) => void;
  categories: CategoryData[];
  subCategories: SubCategoryData[];
  accounts: AccountData[];
  duplicatesOn: boolean;
  onDuplicatesChange: (on: boolean) => void;
  duplicateCount: number;
  onSelectDuplicates: () => void;
  dupDraft: DuplicateSettings;
  onDupDraftChange: (next: DuplicateSettings) => void;
  onRunDuplicates: () => void;
  onResetDuplicates: () => void;
}) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const set = <K extends keyof MovementFilters>(key: K, value: MovementFilters[K]) => onChange({ ...filters, [key]: value });

  const categoryItems: ChipItem[] = [{ id: '', label: 'Todas' }, ...categories.map((c) => ({ id: idOf(c), label: c.name || 'Categoría', icon: c.icon, color: c.color }))];
  const subItems: ChipItem[] = [{ id: '', label: 'Todas' }, ...subCategoriesOf(subCategories, filters.categoryId).map((s) => ({ id: idOf(s), label: s.name || 'Subcategoría', icon: s.icon, color: s.color }))];
  const accountItems: ChipItem[] = [{ id: '', label: 'Todas' }, ...accounts.map((a) => ({ id: idOf(a), label: `${a.name} · ${a.currency}` }))];
  const hasSubs = filters.categoryId !== '' && subItems.length > 1;

  return (
    <Card title="Filtros">
      <TextField label="Buscar" value={filters.query} onChangeText={(text) => set('query', text)} onClear={() => set('query', '')} placeholder="Nombre, categoría, etiqueta…" autoCorrect={false} />

      <View className="gap-2">
        <Text className="font-inter-medium text-sm text-gf-text-muted">Tipo</Text>
        <ChipPicker items={TYPES} value={filters.type} onChange={(id) => set('type', id as TypeFilter)} moreAfter={99} />
      </View>

      <View className="gap-2">
        <Text className="font-inter-medium text-sm text-gf-text-muted">Legibilidad</Text>
        <ChipPicker items={READABLE} value={filters.readable} onChange={(id) => set('readable', id as ReadableFilter)} moreAfter={99} />
      </View>

      <View className="gap-2">
        <Text className="font-inter-medium text-sm text-gf-text-muted">Categoría</Text>
        <ChipPicker items={categoryItems} value={filters.categoryId} onChange={(id) => onChange({ ...filters, categoryId: id, subCategoryId: '' })} title="Categorías" />
      </View>

      {hasSubs && (
        <View className="gap-2">
          <Text className="font-inter-medium text-sm text-gf-text-muted">Subcategoría</Text>
          <ChipPicker items={subItems} value={filters.subCategoryId} onChange={(id) => set('subCategoryId', id)} title="Subcategorías" />
        </View>
      )}

      <View className="gap-2">
        <Text className="font-inter-medium text-sm text-gf-text-muted">Cuenta</Text>
        <ChipPicker items={accountItems} value={filters.accountId} onChange={(id) => set('accountId', id)} title="Cuentas" />
      </View>

      <View className="gap-2">
        <TextField label="Monto exacto" value={filters.exactAmount} onChangeText={(text) => set('exactAmount', text.replace(/[^0-9.,]/g, ''))} placeholder="Por ejemplo 250.00" keyboardType="decimal-pad" />
        {filters.exactAmount.trim() !== '' && (
          <>
            <ChipPicker
              items={[
                { id: 'primary', label: 'En mi moneda principal' },
                { id: 'native', label: 'En la moneda de la cuenta' },
              ]}
              value={filters.exactMode}
              onChange={(id) => set('exactMode', id as 'primary' | 'native')}
              moreAfter={99}
            />
            {filters.exactMode === 'native' && (
              <ChipPicker items={SUPPORTED_CURRENCIES.map((code) => ({ id: code, label: code }))} value={filters.exactCurrency} onChange={(code) => set('exactCurrency', code)} moreAfter={99} />
            )}
          </>
        )}
      </View>

      <View className="gap-3 border-t border-gf-border pt-3">
        <View className="flex-row items-center justify-between gap-3">
          <Text className="flex-1 font-inter-medium text-base text-gf-text">Buscar posibles duplicados</Text>
          <GfSwitch value={duplicatesOn} onValueChange={onDuplicatesChange} accessibilityLabel="Buscar duplicados" />
        </View>
        {duplicatesOn && (
          <DuplicateSubfilters
            draft={dupDraft}
            onChange={onDupDraftChange}
            onRun={onRunDuplicates}
            onReset={onResetDuplicates}
            count={duplicateCount}
            onSelect={onSelectDuplicates}
            accent={colors.accent}
          />
        )}
      </View>

      <Pressable accessibilityRole="button" onPress={() => onChange({ ...EMPTY_FILTERS, exactCurrency: filters.exactCurrency })} className="items-center py-1">
        <Text className="font-inter-semibold text-sm text-gf-text-muted">Limpiar filtros</Text>
      </Pressable>
    </Card>
  );
}

// The duplicate finder's sub-filters, like the web's: what must match, the tolerances, and the two buttons.
function DuplicateSubfilters({
  draft,
  onChange,
  onRun,
  onReset,
  count,
  onSelect,
  accent,
}: {
  draft: DuplicateSettings;
  onChange: (next: DuplicateSettings) => void;
  onRun: () => void;
  onReset: () => void;
  count: number;
  onSelect: () => void;
  accent: string;
}) {
  // The tolerance boxes keep what is typed ("0." while writing a decimal) and send the number upward.
  const [dateText, setDateText] = useState(String(draft.dateTolerance));
  const [amountText, setAmountText] = useState(String(draft.amountTolerance));

  return (
    <View className="gap-3">
      <Text className="font-inter text-sm text-gf-text-muted">Coincidencias</Text>
      <View className="flex-row flex-wrap gap-2">
        {DUPLICATE_CRITERIA_LABELS.map(({ key, label }) => {
          const on = draft.criteria[key];
          return (
            <Pressable
              key={key}
              accessibilityRole="switch"
              accessibilityState={{ checked: on }}
              accessibilityLabel={label}
              onPress={() => onChange({ ...draft, criteria: { ...draft.criteria, [key]: !on } })}
              className="flex-row items-center gap-2 rounded-full border border-gf-border px-4 py-2"
              style={{ backgroundColor: on ? 'rgba(147, 51, 234, 0.18)' : undefined }}>
              <Ionicons name={on ? 'checkbox' : 'square-outline'} size={18} color={on ? accent : '#9ca3af'} />
              <Text className="font-inter-medium text-sm text-gf-text">{label}</Text>
            </Pressable>
          );
        })}
      </View>
      <View className="flex-row gap-3">
        <View className="flex-1">
          <TextField
            label="Tolerancia de fecha (días)"
            value={dateText}
            onChangeText={(text) => {
              setDateText(text);
              onChange({ ...draft, dateTolerance: toleranceFrom(text) });
            }}
            keyboardType="decimal-pad"
          />
        </View>
        <View className="flex-1">
          <TextField
            label="Tolerancia de monto"
            value={amountText}
            onChangeText={(text) => {
              setAmountText(text);
              onChange({ ...draft, amountTolerance: toleranceFrom(text) });
            }}
            keyboardType="decimal-pad"
          />
        </View>
      </View>
      <GradientButton label="Buscar duplicados" onPress={onRun} />
      <Pressable
        accessibilityRole="button"
        onPress={() => {
          setDateText('0');
          setAmountText('0');
          onReset();
        }}
        className="items-center py-1">
        <Text className="font-inter-semibold text-sm text-gf-text-muted">Restablecer valores</Text>
      </Pressable>
      <Text className="font-inter text-sm text-gf-text-muted">
        {count === 0 ? 'No encontramos repetidos.' : `${count} movimientos se repiten.`}
      </Text>
      {count > 0 && (
        <Pressable accessibilityRole="button" onPress={onSelect}>
          <Text className="font-inter-semibold text-sm" style={{ color: accent }}>Seleccionar los repetidos (dejando uno de cada grupo)</Text>
        </Pressable>
      )}
    </View>
  );
}
