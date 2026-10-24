import { useState } from 'react';
import { Alert, Text } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import { ChipPicker } from '@/components/chip-picker';
import { useToast } from '@/components/toast';
import { Card } from '@/components/ui/card';
import { usePrimaryCurrency } from '@/hooks/use-primary-currency';
import { messageOf, sendWrite } from '@/lib/write';
import type { AppDispatch, RootState } from '@/store';
import { updateWallet } from '@gastify/core/features/walletSlice';
import { CURRENCY_META, SUPPORTED_CURRENCIES } from '@gastify/core/money/currencies';
import { APP_INFO } from '@gastify/core/info/appInfo';
import { useT } from "@/i18n/client";

// The main currency, as the web's selector: every total and report is shown in it. It only changes how things are
// presented: each account keeps its own balance in its own currency.
export function CurrencyCard() {
  const t = useT();
  const dispatch = useDispatch<AppDispatch>();
  const toast = useToast();
  const current = usePrimaryCurrency();
  const walletId = useSelector((state: RootState) => (state.walletReducer.data as { _id?: string } | null | undefined)?._id);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const change = (next: string) => {
    if (!walletId || next === current || busy) return;
    Alert.alert(t("mobile.cambiar.la.moneda.principal"), `Tus totales y reportes se mostrarán en ${next}. El saldo de cada cuenta se queda en su propia moneda.`, [
      { text: t("mobile.cancelar"), style: 'cancel' },
      {
        text: t("mobile.cambiar"),
        onPress: async () => {
          setBusy(true);
          setError(null);
          try {
            const wallet = await sendWrite<Record<string, unknown>>('general-data/wallet', { walletId, primaryCurrency: next });
            dispatch(updateWallet(wallet as never));
            toast.show(`Moneda principal: ${next}`);
          } catch (e) {
            setError(messageOf(e));
          } finally {
            setBusy(false);
          }
        },
      },
    ]);
  };

  return (
    <Card
      title={t("mobile.moneda.principal")}
      info={APP_INFO.moneda_principal}>
      <ChipPicker items={SUPPORTED_CURRENCIES.map((code) => ({ id: code, label: `${code} (${CURRENCY_META[code].symbol})` }))} value={current} onChange={change} moreAfter={99} />
      {error && <Text className="font-inter text-sm text-red-500">{error}</Text>}
    </Card>
  );
}
