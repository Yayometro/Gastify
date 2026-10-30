import { useState } from 'react';
import { Text, View } from 'react-native';

import { ChipPicker, type ChipItem } from '@/components/chip-picker';
import { DateField } from '@/components/date-field';
import { FormError } from '@/components/auth/auth-layout';
import { GradientButton } from '@/components/ui/gradient-button';
import { TourTarget } from '@/components/tour/tour-target';
import { TextField } from '@/components/ui/text-field';
import { useCatalog } from '@/hooks/use-catalog';
import { messageOf } from '@/lib/write';
import { idOf } from '@gastify/core/categories/categoryForm';
import { dateText, validateTransfer, buildTransferBody, type TransferErrors, type TransferValues } from '@gastify/core/transactions/movementForm';
import { useT } from "@/i18n/client";

// A transfer between two of the person's accounts. Across currencies it is an exchange: the form asks
// what arrives on the other side, and the server records both legs.
export function TransferForm({ onSubmit }: { onSubmit: (body: Record<string, unknown>) => Promise<void> }) {
  const t = useT();
  const { accounts } = useCatalog();
  const [values, setValues] = useState<TransferValues>(() => ({
    sourceAccountId: accounts[0] ? idOf(accounts[0]) : '',
    destinationAccountId: accounts[1] ? idOf(accounts[1]) : '',
    sourceAmount: '',
    destinationAmount: '',
    name: '',
    date: dateText(new Date()),
  }));
  const [errors, setErrors] = useState<TransferErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const currencies = Object.fromEntries(accounts.map((account) => [idOf(account), account.currency || 'MXN']));
  const items: ChipItem[] = accounts.map((account) => ({ id: idOf(account), label: `${account.name} · ${account.currency || 'MXN'}` }));
  const source = currencies[values.sourceAccountId];
  const destination = currencies[values.destinationAccountId];
  const crossCurrency = Boolean(source && destination && source !== destination);

  const set = <K extends keyof TransferValues>(key: K, value: TransferValues[K]) => setValues((current) => ({ ...current, [key]: value }));

  const submit = async () => {
    const found = validateTransfer(values, currencies);
    setErrors(found);
    setFormError(null);
    if (Object.keys(found).length > 0) return;
    setSubmitting(true);
    try {
      await onSubmit(buildTransferBody(values, currencies, { exchange: t("movements.transfer.defaultExchange"), transfer: t("movements.transfer.defaultTransfer") }));
    } catch (error) {
      setFormError(messageOf(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View className="gap-4">
      <TourTarget id="m-transferform-source" className="gap-2">
        <Text className="font-inter-medium text-sm text-gf-text-muted">{t("mobile.desde")}</Text>
        <ChipPicker items={items} value={values.sourceAccountId} onChange={(id) => set('sourceAccountId', id)} emptyText={t("mobile.primero.crea.dos.cuentas.en.mas.cuentas")} />
        {errors.sourceAccountId && <Text className="font-inter text-sm text-red-500">{t(errors.sourceAccountId)}</Text>}
      </TourTarget>
      <TourTarget id="m-transferform-dest" className="gap-2">
        <Text className="font-inter-medium text-sm text-gf-text-muted">{t("mobile.hacia")}</Text>
        <ChipPicker items={items} value={values.destinationAccountId} onChange={(id) => set('destinationAccountId', id)} />
        {errors.destinationAccountId && <Text className="font-inter text-sm text-red-500">{t(errors.destinationAccountId)}</Text>}
      </TourTarget>
      <View className="gap-2">
        <TourTarget id="m-transferform-amount"><TextField label={source ? t("mobile.transfer.sourceAmountWith", { p1: source }) : t("mobile.transfer.sourceAmount")} value={values.sourceAmount} onChangeText={(text) => set('sourceAmount', text.replace(/[^0-9.,]/g, ''))} placeholder="0.00" keyboardType="decimal-pad" /></TourTarget>
        {errors.sourceAmount && <Text className="font-inter text-sm text-red-500">{t(errors.sourceAmount)}</Text>}
      </View>
      {crossCurrency && (
        <View className="gap-2">
          <TourTarget id="m-transferform-amount-dest"><TextField label={destination ? t("mobile.transfer.destAmountWith", { p1: destination }) : t("mobile.transfer.destAmount")} value={values.destinationAmount} onChangeText={(text) => set('destinationAmount', text.replace(/[^0-9.,]/g, ''))} placeholder="0.00" keyboardType="decimal-pad" /></TourTarget>
          {errors.destinationAmount && <Text className="font-inter text-sm text-red-500">{t(errors.destinationAmount)}</Text>}
        </View>
      )}
      <TourTarget id="m-transferform-date"><DateField label={t("mobile.fecha")} value={values.date} onChange={(day) => set('date', day)} /></TourTarget>
      {errors.date && <Text className="font-inter text-sm text-red-500">{t(errors.date)}</Text>}
      <TourTarget id="m-transferform-name"><TextField label={t("mobile.nombre.opcional")} value={values.name} onChangeText={(text) => set('name', text)} placeholder={t("mobile.pago.de.tarjeta")} maxLength={80} /></TourTarget>
      <FormError message={formError} />
      <TourTarget id="m-transferform-save"><GradientButton label={crossCurrency ? t("movements.bulk.changeCurrency") : t("mobile.transferir")} onPress={submit} loading={submitting} disabled={submitting} /></TourTarget>
    </View>
  );
}
