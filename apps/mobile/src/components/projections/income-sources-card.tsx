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
import { idOf } from '@gastify/core/categories/categoryForm';
import { dateText, parseDateText } from '@gastify/core/transactions/movementForm';
import { formatMoneyMajor, SUPPORTED_CURRENCIES } from '@gastify/core/money/currencies';

type AnyRecord = Record<string, unknown>;

const RECURRENCE: { id: string; label: string }[] = [
  { id: 'monthly', label: 'Mensual' },
  { id: 'semimonthly', label: 'Quincenal (días fijos)' },
  { id: 'biweekly', label: 'Cada 14 días' },
  { id: 'weekly', label: 'Semanal' },
];

// Income sources: what comes in each period, as the web's panel. Listed, created and removed here.
export function IncomeSourcesCard({ sources, currency, onChanged }: { sources: AnyRecord[]; currency: string; onChanged: () => void }) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [code, setCode] = useState(currency);
  const [recurrence, setRecurrence] = useState('monthly');
  const [anchor, setAnchor] = useState(dateText(new Date()));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setError(null);
    const value = Number(amount.replace(/,/g, ''));
    if (!name.trim()) return setError('Escribe un nombre para la fuente de ingreso.');
    if (!(value > 0)) return setError('Escribe un monto mayor que cero.');
    setSaving(true);
    try {
      await sendWrite('general-data/income-sources/new', { name: name.trim(), amount: value, currency: code, recurrence, anchorDate: parseDateText(anchor) ?? new Date() });
      toast.show('Fuente de ingreso creada');
      setName('');
      setAmount('');
      setOpen(false);
      onChanged();
    } catch (e) {
      setError(messageOf(e));
    } finally {
      setSaving(false);
    }
  };

  const remove = (source: AnyRecord) => {
    Alert.alert('Borrar esta fuente', 'Deja de contar en las proyecciones. No se puede deshacer.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Borrar',
        style: 'destructive',
        onPress: async () => {
          try {
            await sendWrite('general-data/income-sources/remove', { id: idOf(source as never) });
            toast.show('Fuente borrada');
            onChanged();
          } catch (e) {
            toast.show(messageOf(e), 'error');
          }
        },
      },
    ]);
  };

  return (
    <Card title="Fuentes de ingreso" info={{ title: 'Fuentes de ingreso', text: 'Lo que entra cada periodo (sueldo, rentas...). Las proyecciones lo suman mes a mes, convertido a la moneda principal.' }}>
      {sources.length === 0 && <Text className="font-inter text-sm text-gf-text-muted">Todavía no tienes fuentes de ingreso.</Text>}
      {sources.map((source) => (
        <View key={idOf(source as never)} className="flex-row items-center gap-3">
          <View className="flex-1">
            <Text className="font-inter-medium text-base text-gf-text" numberOfLines={1}>{String(source.name ?? 'Fuente')}</Text>
            <Text className="font-inter text-sm text-gf-text-muted">
              {formatMoneyMajor(Number(source.amount) || 0, String(source.currency ?? currency))} · {RECURRENCE.find((r) => r.id === source.recurrence)?.label ?? String(source.recurrence ?? '')}
            </Text>
          </View>
          <Pressable accessibilityRole="button" onPress={() => remove(source)} hitSlop={8}>
            <Text className="font-inter-medium text-sm text-red-500">Borrar</Text>
          </Pressable>
        </View>
      ))}

      {!open ? (
        <Pressable accessibilityRole="button" onPress={() => setOpen(true)} className="items-center rounded-full border border-gf-border py-3">
          <Text className="font-inter-semibold text-base text-gf-text">Nueva fuente de ingreso</Text>
        </Pressable>
      ) : (
        <View className="gap-3">
          <TextField label="Nombre" value={name} onChangeText={setName} placeholder="Sueldo" maxLength={60} autoCapitalize="sentences" />
          <TextField label={`Monto mensual aproximado (${code})`} value={amount} onChangeText={(t) => setAmount(t.replace(/[^0-9.,]/g, ''))} placeholder="0.00" keyboardType="decimal-pad" />
          <View className="gap-2">
            <Text className="font-inter-medium text-sm text-gf-text-muted">Moneda</Text>
            <ChipPicker items={SUPPORTED_CURRENCIES.map((c) => ({ id: c, label: c }))} value={code} onChange={setCode} moreAfter={99} />
          </View>
          <View className="gap-2">
            <Text className="font-inter-medium text-sm text-gf-text-muted">Recurrencia</Text>
            <ChipPicker items={RECURRENCE} value={recurrence} onChange={setRecurrence} moreAfter={99} />
          </View>
          <DateField label="Primer pago" value={anchor} onChange={setAnchor} />
          <FormError message={error} />
          <GradientButton label="Guardar fuente" onPress={save} loading={saving} disabled={saving} />
          <Pressable accessibilityRole="button" onPress={() => setOpen(false)} className="items-center py-1">
            <Text className="font-inter-semibold text-sm text-gf-text-muted">Cancelar</Text>
          </Pressable>
        </View>
      )}
    </Card>
  );
}
