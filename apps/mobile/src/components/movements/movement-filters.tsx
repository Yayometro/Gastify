import { Pressable, Text, View, useColorScheme } from 'react-native';

import { ChipPicker, type ChipItem } from '@/components/chip-picker';
import { Card } from '@/components/ui/card';
import { TextField } from '@/components/ui/text-field';
import { Colors } from '@/constants/theme';
import { GfSwitch } from '@/components/ui/switch';
import type { AccountData } from '@gastify/core/features/accountsSlice';
import type { CategoryData } from '@gastify/core/features/categoriesSlice';
import type { SubCategoryData } from '@gastify/core/features/subCategorySlice';
import { idOf, subCategoriesOf } from '@gastify/core/categories/categoryForm';
import { SUPPORTED_CURRENCIES } from '@gastify/core/money/currencies';
import { EMPTY_FILTERS, type MovementFilters, type TypeFilter } from '@gastify/core/transactions/movementFilters';

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
      <TextField label="Buscar" value={filters.query} onChangeText={(text) => set('query', text)} placeholder="Nombre, categoría, etiqueta…" autoCorrect={false} />

      <View className="gap-2">
        <Text className="font-inter-medium text-sm text-gf-text-muted">Tipo</Text>
        <ChipPicker items={TYPES} value={filters.type} onChange={(id) => set('type', id as TypeFilter)} moreAfter={99} />
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

      <View className="gap-2 border-t border-gf-border pt-3">
        <View className="flex-row items-center justify-between gap-3">
          <Text className="flex-1 font-inter-medium text-base text-gf-text">Buscar posibles duplicados</Text>
          <GfSwitch value={duplicatesOn} onValueChange={onDuplicatesChange} accessibilityLabel="Buscar duplicados" />
        </View>
        {duplicatesOn && (
          <>
            <Text className="font-inter text-sm text-gf-text-muted">
              Mismo nombre, mismo día y mismo monto. {duplicateCount === 0 ? 'No encontramos repetidos.' : `${duplicateCount} movimientos se repiten.`}
            </Text>
            {duplicateCount > 0 && (
              <Pressable accessibilityRole="button" onPress={onSelectDuplicates}>
                <Text className="font-inter-semibold text-sm" style={{ color: colors.accent }}>Seleccionar los repetidos (dejando uno de cada grupo)</Text>
              </Pressable>
            )}
          </>
        )}
      </View>

      <Pressable accessibilityRole="button" onPress={() => onChange({ ...EMPTY_FILTERS, exactCurrency: filters.exactCurrency })} className="items-center py-1">
        <Text className="font-inter-semibold text-sm text-gf-text-muted">Limpiar filtros</Text>
      </Pressable>
    </Card>
  );
}
