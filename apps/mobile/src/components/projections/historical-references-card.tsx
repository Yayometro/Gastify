import { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';

import { ChipPicker } from '@/components/chip-picker';
import { DateField } from '@/components/date-field';
import { FormError } from '@/components/auth/auth-layout';
import { useToast } from '@/components/toast';
import { Card } from '@/components/ui/card';
import { GradientButton } from '@/components/ui/gradient-button';
import { TextField } from '@/components/ui/text-field';
import { messageOf, sendWrite } from '@/lib/write';
import { monthTitleEs } from '@gastify/core/format/spanishDates';
import { formatMoneyMajor, SUPPORTED_CURRENCIES } from '@gastify/core/money/currencies';
import { dateText, parseDateText } from '@gastify/core/transactions/movementForm';

type AnyRecord = Record<string, unknown>;
type Kind = 'income' | 'expense';

const KIND_LABEL: Record<Kind, string> = { income: 'Ingreso', expense: 'Gasto' };

// The historical references: the amounts each month that the projections start from (real income and spending
// of the past, or an estimate that holds for a while). Income and spending are kept apart, as on the web.
export function HistoricalReferencesCard({ baseline, currency, onChanged }: { baseline: AnyRecord | null; currency: string; onChanged: () => void }) {
  const toast = useToast();
  const [kind, setKind] = useState<Kind>('income');
  const [open, setOpen] = useState(false);
  const [from, setFrom] = useState(dateText(new Date()));
  const [to, setTo] = useState('');
  const [amount, setAmount] = useState('');
  const [code, setCode] = useState(currency);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const entriesOf = (k: Kind) => {
    const list = baseline?.[k === 'income' ? 'incomeHistory' : 'expenseHistory'];
    return Array.isArray(list) ? (list as AnyRecord[]) : [];
  };
  const entries = entriesOf(kind);

  const save = async () => {
    setError(null);
    const value = Number(amount.replace(/,/g, ''));
    const start = parseDateText(from);
    if (!start) return setError('Elige el mes en que empieza.');
    const end = to ? parseDateText(to) : null;
    if (end && end <= start) return setError('El mes final tiene que ser posterior al inicial.');
    if (!(value >= 0)) return setError('Escribe un monto.');
    setSaving(true);
    try {
      await sendWrite('general-data/projection-baseline/update', {
        kind,
        effectiveFrom: new Date(start.getFullYear(), start.getMonth(), 1),
        effectiveTo: end ? new Date(end.getFullYear(), end.getMonth(), 1) : null,
        amount: value,
        currency: code,
      });
      toast.show('Referencia guardada');
      setAmount('');
      setTo('');
      setOpen(false);
      onChanged();
    } catch (e) {
      setError(messageOf(e));
    } finally {
      setSaving(false);
    }
  };

  const remove = (entry: AnyRecord) => {
    Alert.alert('Borrar esta referencia', 'Las proyecciones dejan de usarla. No se puede deshacer.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Borrar',
        style: 'destructive',
        onPress: async () => {
          try {
            await sendWrite('general-data/projection-baseline/delete', { kind, entryId: String(entry._id ?? '') });
            toast.show('Referencia borrada');
            onChanged();
          } catch (e) {
            toast.show(messageOf(e), 'error');
          }
        },
      },
    ]);
  };

  const label = (value: unknown) => (value ? monthTitleEs(new Date(value as string)) : '');

  return (
    <Card
      title="Referencias históricas"
      info={{ title: 'Referencias históricas', text: 'Montos por mes que las proyecciones usan como punto de partida: lo que de verdad ingresó o gastó, o un estimado que vale por un tiempo. Ingresos y gastos se guardan por separado.' }}>
      <ChipPicker
        items={[{ id: 'income', label: 'Ingresos' }, { id: 'expense', label: 'Gastos' }]}
        value={kind}
        onChange={(id) => setKind(id as Kind)}
        moreAfter={99}
      />
      {entries.length === 0 && <Text className="font-inter text-sm text-gf-text-muted">Todavía no hay referencias de {KIND_LABEL[kind].toLowerCase()}s.</Text>}
      {entries.map((entry) => (
        <View key={String(entry._id ?? entry.effectiveFrom)} className="flex-row items-center gap-3">
          <View className="flex-1">
            <Text className="font-inter-medium text-base text-gf-text">
              Desde {label(entry.effectiveFrom)}
              {entry.effectiveTo ? ` hasta ${label(entry.effectiveTo)}` : ' (en curso)'}
            </Text>
            <Text className="font-inter text-sm text-gf-text-muted">
              {formatMoneyMajor(Number(entry.amount) || 0, String(entry.currency ?? currency))} al mes
            </Text>
          </View>
          <Pressable accessibilityRole="button" onPress={() => remove(entry)} hitSlop={8}>
            <Text className="font-inter-medium text-sm text-red-500">Borrar</Text>
          </Pressable>
        </View>
      ))}

      {!open ? (
        <Pressable accessibilityRole="button" onPress={() => setOpen(true)} className="items-center rounded-full border border-gf-border py-3">
          <Text className="font-inter-semibold text-base text-gf-text">Agregar referencia de {KIND_LABEL[kind].toLowerCase()}</Text>
        </Pressable>
      ) : (
        <View className="gap-3">
          <DateField label="Desde (mes)" value={from} onChange={setFrom} />
          <DateField label="Hasta (opcional)" value={to} onChange={setTo} />
          <TextField label="Monto mensual" value={amount} onChangeText={(t) => setAmount(t.replace(/[^0-9.,]/g, ''))} placeholder="0.00" keyboardType="decimal-pad" />
          <View className="gap-2">
            <Text className="font-inter-medium text-sm text-gf-text-muted">Moneda</Text>
            <ChipPicker items={SUPPORTED_CURRENCIES.map((c) => ({ id: c, label: c }))} value={code} onChange={setCode} moreAfter={99} />
          </View>
          <FormError message={error} />
          <GradientButton label="Guardar referencia" onPress={save} loading={saving} disabled={saving} />
          <Pressable accessibilityRole="button" onPress={() => setOpen(false)} className="items-center py-1">
            <Text className="font-inter-semibold text-sm text-gf-text-muted">Cancelar</Text>
          </Pressable>
        </View>
      )}
    </Card>
  );
}
