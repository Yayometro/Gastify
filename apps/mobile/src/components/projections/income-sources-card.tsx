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

import { useT, useInfo } from "@/i18n/client";
import type { TranslateFn } from "@gastify/core/i18n/translate";

type AnyRecord = Record<string, unknown>;

const RECURRENCE = (t: TranslateFn): { id: string; label: string }[] => ([
  { id: 'monthly', label: t("mobile.mensual") },
  { id: 'semimonthly', label: t("mobile.quincenal.dias.fijos") },
  { id: 'biweekly', label: t("mobile.cada.14.dias") },
  { id: 'weekly', label: t("mobile.semanal") },
]);

// Income sources: what comes in each period, as the web's panel. Listed, created and removed here.
export function IncomeSourcesCard({ sources, currency, onChanged }: { sources: AnyRecord[]; currency: string; onChanged: () => void }) {
  const { APP_INFO } = useInfo();
  const t = useT();
  const tr = useT();
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
    if (!name.trim()) return setError(tr("mobile.escribe.un.nombre.para.la"));
    if (!(value > 0)) return setError(tr("mobile.escribe.un.monto.mayor.que"));
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
    Alert.alert(tr("mobile.borrar.esta.fuente"), tr("mobile.deja.de.contar.en.las"), [
      { text: tr("mobile.cancelar"), style: 'cancel' },
      {
        text: tr("mobile.borrar"),
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
    <Card title={tr("mobile.fuentes.de.ingreso")} info={APP_INFO.fuentes_de_ingreso}>
      {sources.length === 0 && <Text className="font-inter text-sm text-gf-text-muted">{tr("mobile.todavia.no.tienes.fuentes.de")}</Text>}
      {sources.map((source) => (
        <View key={idOf(source as never)} className="flex-row items-center gap-3">
          <View className="flex-1">
            <Text className="font-inter-medium text-base text-gf-text" numberOfLines={1}>{String(source.name ?? 'Fuente')}</Text>
            <Text className="font-inter text-sm text-gf-text-muted">
              {formatMoneyMajor(Number(source.amount) || 0, String(source.currency ?? currency))} · {RECURRENCE(t).find((r) => r.id === source.recurrence)?.label ?? String(source.recurrence ?? '')}
            </Text>
          </View>
          <Pressable accessibilityRole="button" onPress={() => remove(source)} hitSlop={8}>
            <Text className="font-inter-medium text-sm text-red-500">{tr("mobile.borrar")}</Text>
          </Pressable>
        </View>
      ))}

      {!open ? (
        <Pressable accessibilityRole="button" onPress={() => setOpen(true)} className="items-center rounded-full border border-gf-border py-3">
          <Text className="font-inter-semibold text-base text-gf-text">{tr("mobile.nueva.fuente.de.ingreso")}</Text>
        </Pressable>
      ) : (
        <View className="gap-3">
          <TextField label={tr("mobile.nombre")} value={name} onChangeText={setName} placeholder={tr("mobile.sueldo")} maxLength={60} autoCapitalize="sentences" />
          <TextField label={t("mobile.projections.monthlyApprox", { p1: code })} value={amount} onChangeText={(t) => setAmount(t.replace(/[^0-9.,]/g, ''))} placeholder="0.00" keyboardType="decimal-pad" />
          <View className="gap-2">
            <Text className="font-inter-medium text-sm text-gf-text-muted">{tr("mobile.moneda")}</Text>
            <ChipPicker items={SUPPORTED_CURRENCIES.map((c) => ({ id: c, label: c }))} value={code} onChange={setCode} moreAfter={99} />
          </View>
          <View className="gap-2">
            <Text className="font-inter-medium text-sm text-gf-text-muted">{tr("mobile.recurrencia")}</Text>
            <ChipPicker items={RECURRENCE(t)} value={recurrence} onChange={setRecurrence} moreAfter={99} />
          </View>
          <DateField label={tr("mobile.primer.pago")} value={anchor} onChange={setAnchor} />
          <FormError message={error} />
          <GradientButton label={tr("mobile.guardar.fuente")} onPress={save} loading={saving} disabled={saving} />
          <Pressable accessibilityRole="button" onPress={() => setOpen(false)} className="items-center py-1">
            <Text className="font-inter-semibold text-sm text-gf-text-muted">{tr("mobile.cancelar")}</Text>
          </Pressable>
        </View>
      )}
    </Card>
  );
}
