import { useState } from 'react';
import { Text, View, useColorScheme } from 'react-native';

import { ChipPicker } from '@/components/chip-picker';
import { DateField } from '@/components/date-field';
import { DetailSheet } from '@/components/analyzer/detail-sheet';
import { useToast } from '@/components/toast';
import { GradientButton } from '@/components/ui/gradient-button';
import { TextField } from '@/components/ui/text-field';
import { Colors } from '@/constants/theme';
import { messageOf, sendWrite } from '@/lib/write';
import { dateText, movementInstant } from '@gastify/core/transactions/movementForm';

// One field of every selected movement at a time (rename, date, type, category, account), or every field at once
// ("edición general"). What a person leaves blank keeps each movement's own value.
export type BulkField = 'name' | 'date' | 'type' | 'category' | 'account' | 'general';

const TITLES: Record<BulkField, string> = {
  name: 'Cambiar el nombre',
  date: 'Cambiar la fecha',
  type: 'Cambiar el tipo',
  category: 'Cambiar la categoría',
  account: 'Cambiar la cuenta',
  general: 'Edición general',
};

export type BulkOption = { id: string; label: string; icon?: string; color?: string };

export function BulkEditSheet({
  field,
  ids,
  accounts,
  categories,
  onClose,
  onDone,
}: {
  field: BulkField;
  ids: string[];
  accounts: BulkOption[];
  categories: BulkOption[];
  onClose: () => void;
  onDone: () => void;
}) {
  const colors = Colors[useColorScheme() === 'dark' ? 'dark' : 'light'];
  const toast = useToast();
  const [name, setName] = useState('');
  // Only the date field starts with a day; in the general edit the date stays as it is unless one is picked.
  const [date, setDate] = useState(field === 'date' ? dateText(new Date()) : '');
  const [type, setType] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [tags, setTags] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const count = ids.length;

  // The body for the server: only the fields that were filled, each one listed in `fields`.
  const payload = (): Record<string, unknown> | null => {
    const body: Record<string, unknown> = { transactions: ids };
    const fields: string[] = [];
    if (field === 'name' || (field === 'general' && name.trim())) {
      if (!name.trim()) return null;
      fields.push('name');
      body.name = name.trim();
    }
    if (field === 'date' || (field === 'general' && date !== '')) {
      fields.push('date');
      body.date = movementInstant(date, new Date()).toISOString();
    }
    if (field === 'type' || (field === 'general' && type !== '')) {
      if (!type) return null;
      fields.push('isIncome', 'isBill');
      body.isIncome = type === 'income';
      body.isBill = type === 'expense';
    }
    if (field === 'category' || (field === 'general' && categoryId !== '')) {
      if (!categoryId) return null;
      fields.push('category', 'subCategory');
      body.category = categoryId;
      body.subCategory = null;
    }
    if (field === 'account' || (field === 'general' && accountId !== '')) {
      if (!accountId) return null;
      fields.push('account');
      body.account = accountId;
    }
    if (field === 'general' && amount.trim()) {
      fields.push('amount');
      body.amount = amount.replace(',', '.');
    }
    if (field === 'general' && tags.trim()) {
      fields.push('tags');
      body.tags = tags.split(',').map((tag) => tag.trim()).filter(Boolean);
    }
    if (fields.length === 0) return null;
    return { ...body, fields };
  };

  const save = async () => {
    setError(null);
    const body = payload();
    if (!body) {
      setError(field === 'general' ? 'Llena al menos un campo: lo que dejes en blanco se queda igual.' : 'Elige un valor para cambiar.');
      return;
    }
    setBusy(true);
    try {
      await sendWrite('general-data/transactions/edit-many', body);
      toast.show(count === 1 ? 'Movimiento actualizado' : `${count} movimientos actualizados`);
      onDone();
    } catch (failure) {
      setError(messageOf(failure));
    } finally {
      setBusy(false);
    }
  };

  const button = (label: string) => <GradientButton label={busy ? 'Guardando…' : label} onPress={save} loading={busy} disabled={busy} />;

  return (
    <DetailSheet
      visible
      onClose={onClose}
      title={TITLES[field]}
      subtitle={`${count} ${count === 1 ? 'movimiento seleccionado' : 'movimientos seleccionados'}`}
      info={field === 'general' ? { title: 'Edición general', text: 'Edita todos los campos a la vez. Lo que llenes se escribe en TODOS los movimientos seleccionados; lo que dejes en blanco se queda como estaba en cada uno.' } : undefined}>
      {(field === 'name' || field === 'general') && (
        <TextField label={field === 'general' ? 'Nombre (opcional)' : 'Nombre nuevo'} value={name} onChangeText={setName} maxLength={80} placeholder="Si lo dejas vacío, no cambia" />
      )}
      {field === 'general' && (
        <TextField label="Monto (opcional)" value={amount} onChangeText={(text) => setAmount(text.replace(/[^0-9.,]/g, ''))} keyboardType="decimal-pad" placeholder="Sin cambio" />
      )}
      {(field === 'date' || field === 'general') && <DateField label={field === 'general' ? 'Fecha (opcional)' : 'Fecha nueva'} value={date} onChange={setDate} />}
      {(field === 'type' || field === 'general') && (
        <View className="gap-2">
          <Text className="font-inter-medium text-sm text-gf-text-muted">{field === 'general' ? 'Tipo (opcional)' : 'Tipo'}</Text>
          <ChipPicker items={[{ id: 'expense', label: 'Gasto' }, { id: 'income', label: 'Ingreso' }]} value={type} onChange={setType} />
        </View>
      )}
      {(field === 'account' || field === 'general') && (
        <View className="gap-2">
          <Text className="font-inter-medium text-sm text-gf-text-muted">{field === 'general' ? 'Cuenta (opcional)' : 'Cuenta'}</Text>
          <ChipPicker items={accounts} value={accountId} onChange={setAccountId} title="Cuentas" emptyText="Todavía no tienes cuentas." />
        </View>
      )}
      {(field === 'category' || field === 'general') && (
        <View className="gap-2">
          <Text className="font-inter-medium text-sm text-gf-text-muted">{field === 'general' ? 'Categoría (opcional)' : 'Categoría'}</Text>
          <ChipPicker items={categories} value={categoryId} onChange={setCategoryId} title="Categorías" emptyText="Todavía no tienes categorías." />
          <Text className="font-inter text-xs text-gf-text-muted">Al cambiar la categoría, la subcategoría se quita.</Text>
        </View>
      )}
      {field === 'general' && <TextField label="Etiquetas (opcional, separadas por comas)" value={tags} onChangeText={setTags} placeholder="viaje, trabajo" autoCapitalize="none" />}
      {error && <Text className="font-inter text-sm text-red-500">{error}</Text>}
      {button(field === 'general' ? 'Guardar en todos' : 'Guardar')}
      <Text className="font-inter text-xs" style={{ color: colors.textSecondary }}>Se aplica a los {count} seleccionados.</Text>
    </DetailSheet>
  );
}
