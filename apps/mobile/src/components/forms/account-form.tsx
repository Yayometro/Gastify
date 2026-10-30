import { useState } from 'react';
import { Text, View } from 'react-native';

import { BankPicker } from '@/components/bank-picker';
import { ChipPicker } from '@/components/chip-picker';
import { TourTarget } from '@/components/tour/tour-target';
import { FormError } from '@/components/auth/auth-layout';
import { GradientButton } from '@/components/ui/gradient-button';
import { TextField } from '@/components/ui/text-field';
import { messageOf } from '@/lib/write';
import { ACCOUNT_CURRENCIES, ACCOUNT_TYPES, validateAccount, type AccountErrors } from '@gastify/core/accounts/accountForm';
import { bankCountryForCurrency, normalizeCardNumber } from '@gastify/core/banks/banks';
import { parseSignedMoneyText } from '@gastify/core/transactions/movementForm';
import { useT } from "@/i18n/client";
import { tNow } from '@/i18n/now';

export type AccountSubmit = { name: string; amount: number; accountType: string; currency: string; bankId: string | null; cardNumber: string | null };

// An account: name, kind, currency (fixed once created) and balance. Used by "Nueva cuenta", the edit
// screen and the "+" menu.
export function AccountForm({
  initial,
  submitLabel,
  currencyLocked = false,
  onSubmit,
}: {
  initial?: { name: string; accountType: string; currency: string; amount: string; bankId?: string | null; cardNumber?: string | null };
  submitLabel: string;
  currencyLocked?: boolean;
  onSubmit: (values: AccountSubmit) => Promise<void>;
}) {
  const t = useT();
  const [name, setName] = useState(initial?.name ?? '');
  const [accountType, setAccountType] = useState(initial?.accountType ?? 'debit');
  const [currency, setCurrency] = useState(initial?.currency ?? 'MXN');
  const [amount, setAmount] = useState(initial?.amount ?? '0');
  const [bankId, setBankId] = useState<string | null>(initial?.bankId ?? null);
  const [cardNumber, setCardNumber] = useState((initial?.cardNumber ?? '').slice(-4));
  const [errors, setErrors] = useState<AccountErrors & { cardNumber?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const found: AccountErrors & { cardNumber?: string } = validateAccount({ name, amount, accountType, currency });
    setFormError(null);
    const card = normalizeCardNumber(cardNumber);
    if (!card.ok) found.cardNumber = card.message;
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    setSaving(true);
    try {
      await onSubmit({ name: name.trim(), amount: parseSignedMoneyText(amount) ?? 0, accountType, currency, bankId, cardNumber: card.value });
    } catch (e) {
      setFormError(messageOf(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <View className="gap-4">
      <TourTarget id="m-accform-name" className="gap-2">
        <TextField label={t("mobile.nombre")} value={name} onChangeText={setName} placeholder={t("mobile.cuenta.nomina")} maxLength={40} autoCapitalize="sentences" />
        {errors.name && <Text className="font-inter text-sm text-red-500">{t(errors.name)}</Text>}
      </TourTarget>
      <TourTarget id="m-accform-type" className="gap-2">
        <Text className="font-inter-medium text-sm text-gf-text-muted">{t("mobile.tipo")}</Text>
        <ChipPicker items={ACCOUNT_TYPES.map((type) => ({ id: type.value, label: t(type.label) }))} value={accountType} onChange={setAccountType} />
      </TourTarget>
      <TourTarget id="m-accform-currency" className="gap-2">
        <Text className="font-inter-medium text-sm text-gf-text-muted">{currencyLocked ? tNow("mobile.moneda.p1.no.se.cambia", { p1: currency }) : t("mobile.moneda.no.se.cambia.despues")}</Text>
        {!currencyLocked && <ChipPicker items={ACCOUNT_CURRENCIES.map((code) => ({ id: code, label: code }))} value={currency} onChange={setCurrency} moreAfter={99} />}
      </TourTarget>
      <TourTarget id="m-accform-balance" className="gap-2">
        <TextField label={t("mobile.forms.balanceLabel", { p1: currency })} value={amount} onChangeText={setAmount} placeholder="0.00" keyboardType="numbers-and-punctuation" />
        {errors.amount && <Text className="font-inter text-sm text-red-500">{t(errors.amount)}</Text>}
      </TourTarget>
      <TourTarget id="m-accform-bank" className="gap-2">
        <Text className="font-inter-medium text-sm text-gf-text-muted">{t("mobile.banco.opcional")}</Text>
        <BankPicker country={bankCountryForCurrency(currency)} value={bankId} onChange={setBankId} />
      </TourTarget>
      <View className="gap-2">
        <View className="flex-row items-end gap-2">
          <TourTarget id="m-accform-card" className="flex-1">
            <TextField label={t("mobile.numero.de.tarjeta.o.de")} value={cardNumber} onChangeText={(text) => setCardNumber(text.replace(/\D/g, '').slice(0, 4))} placeholder="1234" keyboardType="number-pad" maxLength={4} />
          </TourTarget>
        </View>
        <Text className="font-inter text-xs text-gf-text-muted">{t("mobile.solo.si.quieres.tenerlo.a")}</Text>
        {errors.cardNumber && <Text className="font-inter text-sm text-red-500">{t(errors.cardNumber)}</Text>}
      </View>
      <FormError message={formError} />
      <TourTarget id="m-accform-save"><GradientButton label={submitLabel} onPress={save} loading={saving} disabled={saving} /></TourTarget>
    </View>
  );
}
