import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Alert, Animated, Easing, Pressable, Text, View, useColorScheme } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import { AccountCard } from '@/components/account-card';
import { CardColorPicker } from '@/components/account-card-color';
import { AccountForm } from '@/components/forms/account-form';
import { SummaryWidget } from '@/components/home/summary-widget';
import { PeriodControls } from '@/components/period-controls';
import { usePeriod } from '@/hooks/use-period';
import { useRatesToPrimary } from '@/hooks/use-rates-to-primary';
import { MovementRow } from '@/components/movements/movement-row';
import { Screen } from '@/components/screen';
import { useToast } from '@/components/toast';
import { Card } from '@/components/ui/card';
import { usePrimaryCurrency } from '@/hooks/use-primary-currency';
import { reloadAfterWrite } from '@/hooks/use-load-app-data';
import { messageOf, sendWrite } from '@/lib/write';
import type { AppDispatch, RootState } from '@/store';
import { idOf } from '@gastify/core/categories/categoryForm';
import { formatMoneyMajor } from '@gastify/core/money/currencies';
import { isInRange } from '@gastify/core/transactions/movementFilters';
import { accountActivity } from '@gastify/core/accounts/accountActivity';
import { summarizePeriod } from '@gastify/core/history/periodComparison';
import { Colors } from '@/constants/theme';
import { monthTotals, sortNewestFirst } from '@gastify/core/transactions/monthSummary';

import { useT, useInfo } from "@/i18n/client";

// One account: its card (bank, name, currency, number), and the pencil on the card that opens the edition right under
// it: the color and pattern, then the name, type and balance. The card already shows the bank and the number, so there
// is no separate section for them.
export default function EditAccountScreen() {
  const { APP_INFO } = useInfo();
  const t = useT();
  const { id: rawId, returnTo: rawReturn } = useLocalSearchParams<{ id: string; returnTo?: string }>();
  const id = String(rawId ?? '');
  // Opened from Inicio, the card goes back to Inicio itself (the tab that opened it), not to the screen before in this stack.
  const dispatch = useDispatch<AppDispatch>();
  const toast = useToast();
  const account = useSelector((state: RootState) => state.accountsReducer.data.find((item) => idOf(item) === id));
  const returnTo = typeof rawReturn === 'string' && rawReturn ? rawReturn : null;
  const back = () => (returnTo ? router.navigate(returnTo as never) : router.canGoBack() ? router.back() : router.replace('/more/accounts'));
  const primary = usePrimaryCurrency();
  const transactions = useSelector((state: RootState) => state.transacctionsReducer.data);
  const mine = useMemo(() => sortNewestFirst(transactions.filter((movement) => idOf(movement.account) === id)), [transactions, id]);
  // The period of this account's dashboard (the web filters it like the rest): by default, this month.
  const period = usePeriod('month');
  const inPeriod = useMemo(() => mine.filter((movement) => isInRange(movement, period.range)), [mine, period.range]);
  const totals = useMemo(() => monthTotals(inPeriod), [inPeriod]);
  const summary = useMemo(() => summarizePeriod(mine, period.range), [mine, period.range]);
  const rates = useRatesToPrimary([account?.currency], primary);
  const activity = useMemo(() => accountActivity(mine, period.range), [mine, period.range]);
  const [editOpen, setEditOpen] = useState(false);
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  if (!account) {
    return (
      <Screen title={t("mobile.cuenta")} backLabel="Cuentas" onBack={back}>
        <Text className="font-inter text-base text-gf-text-muted">{t("mobile.no.encontramos.esta.cuenta")}</Text>
      </Screen>
    );
  }

  const remove = () => {
    Alert.alert(t("mobile.borrar.esta.cuenta"), t("mobile.se.borra.la.cuenta.sus"), [
      { text: t("mobile.cancelar"), style: 'cancel' },
      {
        text: t("mobile.borrar"),
        style: 'destructive',
        onPress: async () => {
          try {
            await sendWrite('general-data/accounts/remove-account', id);
            toast.show('Cuenta borrada');
            reloadAfterWrite(dispatch);
            back();
          } catch (e) {
            toast.show(messageOf(e), 'error');
          }
        },
      },
    ]);
  };

  return (
    <Screen
      title={account.name || 'Cuenta'}
      subtitle={`Moneda: ${account.currency || 'MXN'}`}
      backLabel={returnTo ? 'Inicio' : 'Cuentas'}
      onBack={back}
      headerAction={
        <Pressable accessibilityRole="button" accessibilityLabel={t("mobile.editar.cuenta")} onPress={() => setEditOpen((open) => !open)} className="flex-row items-center gap-1.5 rounded-full px-3 py-2" style={{ backgroundColor: colors.accentSoft }}>
          <Ionicons name={editOpen ? 'close' : 'pencil'} size={16} color={colors.accent} />
          <Text className="font-inter-semibold text-sm" style={{ color: colors.accent }}>{editOpen ? 'Cerrar' : 'Editar'}</Text>
        </Pressable>
      }>
      <AccountCard account={account} primary={primary} activity={activity[id]} rate={rates[account.currency ?? '']} />

      {editOpen ? (
        <RevealUnder>
          <View className="gap-4">
            <CardColorPicker account={account} />
            <Card title={t("mobile.editar.cuenta")}>
              <AccountForm
                key={id}
                currencyLocked
                initial={{ name: account.name ?? '', accountType: account.accountType ?? 'debit', currency: account.currency || 'MXN', amount: account.amount !== undefined && account.amount !== null ? String(account.amount) : '0', bankId: account.bankId ?? null, cardNumber: account.cardNumber ?? '' }}
                submitLabel="Guardar cambios"
                onSubmit={async (values) => {
                  await sendWrite('general-data/accounts/update-account', { accountId: id, ...values });
                  toast.show('Cuenta guardada');
                  reloadAfterWrite(dispatch);
                  setEditOpen(false);
                }}
              />
            </Card>
          </View>
        </RevealUnder>
      ) : null}

      <PeriodControls period={period} />

      <SummaryWidget summary={summary} movements={inPeriod} allMovements={mine} currency={primary} />

      <Card title={`Movimientos de ${period.label}`} info={APP_INFO.movimientos_de_la_cuenta}>
        <View className="flex-row justify-between">
          <Text className="font-inter text-base text-gf-text-muted">{t("mobile.entro")}</Text>
          <Text className="font-inter-semibold text-base" style={{ color: colors.income }}>+{formatMoneyMajor(totals.incomes, primary)}</Text>
        </View>
        <View className="flex-row justify-between">
          <Text className="font-inter text-base text-gf-text-muted">{t("mobile.salio")}</Text>
          <Text className="font-inter-semibold text-base" style={{ color: colors.expense }}>-{formatMoneyMajor(totals.spending, primary)}</Text>
        </View>
        {inPeriod.slice(0, 5).map((movement) => (
          <MovementRow key={String(movement._id)} movement={movement} currency={primary} onPress={() => router.push({ pathname: '/movements/[id]', params: { id: String(movement._id), returnTo: `/more/accounts/${id}` } })} />
        ))}
        {inPeriod.length === 0 && <Text className="font-inter text-sm text-gf-text-muted">{t("mobile.sin.movimientos.en.este.periodo")}</Text>}
        {mine.length > 0 && (
          <Pressable accessibilityRole="link" onPress={() => router.push({ pathname: '/movements', params: { accountId: id, returnTo: `/more/accounts/${id}` } })}>
            <Text className="font-inter-semibold text-sm text-gf-text">{t("mobile.ver.todos.los.movimientos.de")}</Text>
          </Pressable>
        )}
      </Card>

      <Pressable accessibilityRole="button" onPress={remove} className="items-center py-2">
        <Text className="font-inter-semibold text-base text-red-500">{t("mobile.borrar.cuenta")}</Text>
      </Pressable>
    </Screen>
  );
}

// The edition opens as if it came out of the card: it fades in and slides down from it, then settles in place.
function RevealUnder({ children }: { children: ReactNode }) {
  const progress = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(progress, { toValue: 1, duration: 320, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [progress]);
  return (
    <Animated.View
      style={{
        opacity: progress,
        transform: [
          { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [-28, 0] }) },
          { scale: progress.interpolate({ inputRange: [0, 1], outputRange: [0.97, 1] }) },
        ],
      }}>
      {children}
    </Animated.View>
  );
}
