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
import { monthTitle } from "@gastify/core/i18n/dates";
import { formatMoneyMajor, SUPPORTED_CURRENCIES } from '@gastify/core/money/currencies';
import { dateText, parseDateText } from '@gastify/core/transactions/movementForm';

import { useT, useInfo, useLocale } from "@/i18n/client";
import { tNow } from '@/i18n/now';

import { TourPressable, TourTarget } from '@/components/tour/tour-target';
type AnyRecord = Record<string, unknown>;
type Kind = 'income' | 'expense';


// The historical references: the amounts each month that the projections start from (real income and spending
// of the past, or an estimate that holds for a while). Income and spending are kept apart, as on the web.
export function HistoricalReferencesCard({ baseline, currency, onChanged }: { baseline: AnyRecord | null; currency: string; onChanged: () => void }) {
  const t = useT();
  const KIND_LABEL: Record<Kind, string> = { income: t("analyzer.income"), expense: t("analyzer.bill") };
  const locale = useLocale();
  const { APP_INFO } = useInfo();
  const tr = useT();
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
    if (!start) return setError(tr("mobile.elige.el.mes.en.que"));
    const end = to ? parseDateText(to) : null;
    if (end && end <= start) return setError(tr("mobile.el.mes.final.tiene.que"));
    if (!(value >= 0)) return setError(tr("mobile.escribe.un.monto"));
    setSaving(true);
    try {
      await sendWrite('general-data/projection-baseline/update', {
        kind,
        effectiveFrom: new Date(start.getFullYear(), start.getMonth(), 1),
        effectiveTo: end ? new Date(end.getFullYear(), end.getMonth(), 1) : null,
        amount: value,
        currency: code,
      });
      toast.show(t("mobile.referencia.guardada"));
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
    Alert.alert(tr("mobile.borrar.esta.referencia"), tr("mobile.las.proyecciones.dejan.de.usarla"), [
      { text: tr("mobile.cancelar"), style: 'cancel' },
      {
        text: tr("mobile.borrar"),
        style: 'destructive',
        onPress: async () => {
          try {
            await sendWrite('general-data/projection-baseline/delete', { kind, entryId: String(entry._id ?? '') });
            toast.show(t("mobile.referencia.borrada"));
            onChanged();
          } catch (e) {
            toast.show(messageOf(e), 'error');
          }
        },
      },
    ]);
  };

  const label = (value: unknown) => (value ? monthTitle(new Date(value as string), locale) : '');

  return (
    <Card
      tour="m-proj-baseline"
      title={tr("mobile.referencias.historicas")}>
      <ChipPicker
        items={[{ id: 'income', label: tr("mobile.ingresos") }, { id: 'expense', label: tr("mobile.gastos") }]}
        value={kind}
        onChange={(id) => setKind(id as Kind)}
        moreAfter={99}
      />
      {entries.length === 0 && <Text className="font-inter text-sm text-gf-text-muted">{tr("mobile.todavia.no.hay.referencias.de", { p1: KIND_LABEL[kind].toLowerCase() })}</Text>}
      {entries.map((entry) => (
        <View key={String(entry._id ?? entry.effectiveFrom)} className="flex-row items-center gap-3">
          <View className="flex-1">
            <Text className="font-inter-medium text-base text-gf-text">
              {tr("mobile.desde.p1.p2", { p1: label(entry.effectiveFrom), p2: entry.effectiveTo ? ` ${tNow("mobile.hasta.p1", { p1: label(entry.effectiveTo) })}` : ' (en curso)' })}
            </Text>
            <Text className="font-inter text-sm text-gf-text-muted">
              {tr("mobile.p1.al.mes", { p1: formatMoneyMajor(Number(entry.amount) || 0, String(entry.currency ?? currency)) })}
            </Text>
          </View>
          <Pressable accessibilityRole="button" onPress={() => remove(entry)} hitSlop={8}>
            <Text className="font-inter-medium text-sm text-red-500">{tr("mobile.borrar")}</Text>
          </Pressable>
        </View>
      ))}

      {!open ? (
        <TourPressable id="m-proj-baseline-new" accessibilityRole="button" onPress={() => setOpen(true)} className="items-center rounded-full border border-gf-border py-3">
          <Text className="font-inter-semibold text-base text-gf-text">{tr("mobile.agregar.referencia.de.p1", { p1: KIND_LABEL[kind].toLowerCase() })}</Text>
        </TourPressable>
      ) : (
        <View className="gap-3">
          <TourTarget id="m-proj-baseline-from"><DateField label={tr("mobile.desde.mes")} value={from} onChange={setFrom} /></TourTarget>
          <TourTarget id="m-proj-baseline-to"><DateField label={tr("mobile.hasta.opcional")} value={to} onChange={setTo} /></TourTarget>
          <TourTarget id="m-proj-baseline-amount"><TextField label={tr("mobile.monto.mensual")} value={amount} onChangeText={(t) => setAmount(t.replace(/[^0-9.,]/g, ''))} placeholder="0.00" keyboardType="decimal-pad" /></TourTarget>
          <TourTarget id="m-proj-baseline-currency" className="gap-2">
            <Text className="font-inter-medium text-sm text-gf-text-muted">{tr("mobile.moneda")}</Text>
            <ChipPicker items={SUPPORTED_CURRENCIES.map((c) => ({ id: c, label: c }))} value={code} onChange={setCode} moreAfter={99} />
          </TourTarget>
          <FormError message={error} />
          <TourTarget id="m-proj-baseline-save"><GradientButton label={tr("mobile.guardar.referencia")} onPress={save} loading={saving} disabled={saving} /></TourTarget>
          <Pressable accessibilityRole="button" onPress={() => setOpen(false)} className="items-center py-1">
            <Text className="font-inter-semibold text-sm text-gf-text-muted">{tr("mobile.cancelar")}</Text>
          </Pressable>
        </View>
      )}
    </Card>
  );
}
