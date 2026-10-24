import { useState } from 'react';
import { Text, View, useColorScheme } from 'react-native';

import { ChipPicker } from '@/components/chip-picker';
import { DateField } from '@/components/date-field';
import { DetailSheet } from '@/components/analyzer/detail-sheet';
import { useToast } from '@/components/toast';
import { GradientButton } from '@/components/ui/gradient-button';
import { TextField } from '@/components/ui/text-field';
import { Colors } from '@/constants/theme';
import { messageOf, sendWrite, sendWriteAnswer } from '@/lib/write';
import { ACCOUNT_CURRENCIES } from '@gastify/core/accounts/accountForm';
import { dateText, movementInstant } from '@gastify/core/transactions/movementForm';
import { useT } from "@/i18n/client";

// One field of every selected movement at a time (rename, date, type, category, account, currency), or every field at
// once ("edición general"). What a person leaves blank keeps each movement's own value.
export type BulkField = 'name' | 'date' | 'type' | 'category' | 'account' | 'currency' | 'general';

const TITLES: Record<BulkField, string> = {
  name: 'Cambiar el nombre',
  date: 'Cambiar la fecha',
  type: 'Cambiar el tipo',
  category: 'Cambiar la categoría',
  account: 'Cambiar la cuenta',
  currency: 'Cambiar la divisa',
  general: 'Edición general',
};

export type BulkOption = { id: string; label: string; icon?: string; color?: string; currency?: string };

// What the server could not change in a currency change, with its reason.
type Blocked = { id: string; name: string; accountCurrency: string; reason: string };

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
  const t = useT();
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
  const [currency, setCurrency] = useState('');
  // Currency change: the movements the server could not move, and the account they can go to instead.
  const [blocked, setBlocked] = useState<Blocked[]>([]);
  const [destinationId, setDestinationId] = useState('');
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

  // The currency change: the amounts are converted with the rate of each movement's date. The movements that cannot
  // go (their account is in another currency) come back with the reason, and the same sheet offers their account.
  const changeCurrency = async (ids: string[], destination: string | null) => {
    const body: Record<string, unknown> = { transactions: ids, currency, fields: destination ? ['currency', 'account'] : ['currency'] };
    if (destination) body.account = destination;
    const answer = await sendWriteAnswer<unknown[], { skipped?: Blocked[] }>('general-data/transactions/edit-many', body);
    const changed = Array.isArray(answer.data) ? answer.data.length : 0;
    const stillBlocked = answer.skipped ?? [];
    setBlocked(stillBlocked);
    if (stillBlocked.length === 0) {
      toast.show(changed === 1 ? 'Movimiento cambiado a ' + currency : `${changed} movimientos cambiados a ${currency}`);
      onDone();
    } else {
      toast.show(`${changed} cambiados · ${stillBlocked.length} no se pueden`, 'warning');
    }
  };

  const save = async () => {
    setError(null);
    if (field === 'currency') {
      if (!currency) return setError(t("mobile.elige.la.nueva.divisa"));
      setBusy(true);
      try {
        await changeCurrency(ids, null);
      } catch (failure) {
        setError(messageOf(failure));
      } finally {
        setBusy(false);
      }
      return;
    }
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

  // The blocked movements, moved to the account chosen here (the same currency as the change).
  const changeBlockedAccounts = async () => {
    if (!destinationId) return setError(t("mobile.elige.la.cuenta.destino"));
    setError(null);
    setBusy(true);
    try {
      await changeCurrency(blocked.map((item) => item.id), destinationId);
    } catch (failure) {
      setError(messageOf(failure));
    } finally {
      setBusy(false);
    }
  };

  const button = (label: string) => <GradientButton label={busy ? 'Guardando…' : label} onPress={save} loading={busy} disabled={busy} />;
  const currencyAccounts = accounts.filter((account) => account.currency === currency);

  return (
    <DetailSheet
      visible
      onClose={onClose}
      title={TITLES[field]}
      subtitle={`${count} ${count === 1 ? 'movimiento seleccionado' : 'movimientos seleccionados'}`}
      info={
        field === 'general'
          ? { title: t("mobile.edicion.general"), text: t("mobile.edita.todos.los.campos.a") }
          : field === 'currency'
            ? { title: t("mobile.cambiar.la.divisa"), text: t("mobile.convierte.el.monto.de.cada") }
            : undefined
      }>
      {(field === 'name' || field === 'general') && (
        <TextField label={field === 'general' ? 'Nombre (opcional)' : 'Nombre nuevo'} value={name} onChangeText={setName} maxLength={80} placeholder={t("mobile.si.lo.dejas.vacio.no")} />
      )}
      {field === 'general' && (
        <TextField label={t("mobile.monto.opcional")} value={amount} onChangeText={(text) => setAmount(text.replace(/[^0-9.,]/g, ''))} keyboardType="decimal-pad" placeholder={t("mobile.sin.cambio")} />
      )}
      {(field === 'date' || field === 'general') && <DateField label={field === 'general' ? 'Fecha (opcional)' : 'Fecha nueva'} value={date} onChange={setDate} />}
      {(field === 'type' || field === 'general') && (
        <View className="gap-2">
          <Text className="font-inter-medium text-sm text-gf-text-muted">{field === 'general' ? 'Tipo (opcional)' : 'Tipo'}</Text>
          <ChipPicker items={[{ id: 'expense', label: t("mobile.gasto") }, { id: 'income', label: t("mobile.ingreso") }]} value={type} onChange={setType} />
        </View>
      )}
      {(field === 'account' || field === 'general') && (
        <View className="gap-2">
          <Text className="font-inter-medium text-sm text-gf-text-muted">{field === 'general' ? 'Cuenta (opcional)' : 'Cuenta'}</Text>
          <ChipPicker items={accounts} value={accountId} onChange={setAccountId} title={t("mobile.cuentas")} emptyText="Todavía no tienes cuentas." />
        </View>
      )}
      {(field === 'category' || field === 'general') && (
        <View className="gap-2">
          <Text className="font-inter-medium text-sm text-gf-text-muted">{field === 'general' ? 'Categoría (opcional)' : 'Categoría'}</Text>
          <ChipPicker items={categories} value={categoryId} onChange={setCategoryId} title={t("mobile.categorias")} emptyText="Todavía no tienes categorías." />
          <Text className="font-inter text-xs text-gf-text-muted">{t("mobile.al.cambiar.la.categoria.la")}</Text>
        </View>
      )}
      {field === 'general' && <TextField label={t("mobile.etiquetas.opcional.separadas.por.comas")} value={tags} onChangeText={setTags} placeholder={t("mobile.viaje.trabajo")} autoCapitalize="none" />}

      {field === 'currency' && (
        <View className="gap-3">
          <View className="gap-2">
            <Text className="font-inter-medium text-sm text-gf-text-muted">{t("mobile.nueva.divisa")}</Text>
            <ChipPicker items={ACCOUNT_CURRENCIES.map((code) => ({ id: code, label: code }))} value={currency} onChange={(code) => { setCurrency(code); setBlocked([]); setDestinationId(''); }} moreAfter={99} />
          </View>
          {blocked.length > 0 && (
            <View className="gap-3 rounded-2xl border p-3" style={{ borderColor: colors.border }}>
              <Text className="font-inter-semibold text-sm text-gf-text">
                {t("mobile.p1.con.su.cuenta.actual", { p1: blocked.length === 1 ? '1 movimiento no se puede cambiar' : `${blocked.length} movimientos no se pueden cambiar` })}
              </Text>
              {blocked.map((item) => (
                <Text key={item.id} className="font-inter text-xs text-gf-text-muted">• {item.name}: {item.reason}</Text>
              ))}
              <View className="gap-2">
                <Text className="font-inter-medium text-sm text-gf-text-muted">{t("mobile.pasarlos.a.una.cuenta.en", { p1: currency })}</Text>
                <ChipPicker items={currencyAccounts} value={destinationId} onChange={setDestinationId} title={t("mobile.cuentas")} emptyText={`No tienes cuentas en ${currency}.`} />
              </View>
              <GradientButton label={busy ? 'Guardando…' : `Cambiar también su cuenta (${blocked.length})`} onPress={changeBlockedAccounts} loading={busy} disabled={busy || !destinationId} />
            </View>
          )}
        </View>
      )}

      {error && <Text className="font-inter text-sm text-red-500">{error}</Text>}
      {blocked.length === 0 && button(field === 'general' ? 'Guardar en todos' : field === 'currency' ? 'Cambiar la divisa' : 'Guardar')}
      <Text className="font-inter text-xs" style={{ color: colors.textSecondary }}>{t("mobile.se.aplica.a.los.p1", { p1: count })}</Text>
    </DetailSheet>
  );
}
