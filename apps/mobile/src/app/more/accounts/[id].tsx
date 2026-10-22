import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Alert, Pressable, Text, View, useColorScheme } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import { AccountCard } from '@/components/account-card';
import { CardColorPicker } from '@/components/account-card-color';
import { BankBadge } from '@/components/bank-badge';
import { bankById, formatCardNumber } from '@gastify/core/banks/banks';
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

// Edits one account: name, kind and balance. The currency stays as it was created.
export default function EditAccountScreen() {
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
  const [showNumber, setShowNumber] = useState(false);
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  if (!account) {
    return (
      <Screen title="Cuenta" backLabel="Cuentas" onBack={back}>
        <Text className="font-inter text-base text-gf-text-muted">No encontramos esta cuenta.</Text>
      </Screen>
    );
  }

  const remove = () => {
    Alert.alert('Borrar esta cuenta', 'Se borra la cuenta. Sus movimientos siguen en tu historial. No se puede deshacer.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Borrar',
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
    <Screen title={account.name || 'Cuenta'} subtitle={`Moneda: ${account.currency || 'MXN'}`} backLabel={returnTo ? 'Inicio' : 'Cuentas'} onBack={back}>
      <AccountCard account={account} primary={primary} activity={activity[id]} rate={rates[account.currency ?? '']} />

      <CardColorPicker account={account} />

      {bankById(account.bankId) || account.cardNumber ? (
        <Card title="Banco y número" info={{ title: 'Banco y número', text: 'El banco al que pertenece la cuenta y, si lo quisiste, su número de tarjeta o de cuenta, oculto de forma predeterminada (toca el ojito para verlo). Nunca se guarda el CVV ni el NIP.' }}>
          {bankById(account.bankId) ? (
            <View className="flex-row items-center gap-3">
              <BankBadge bankId={account.bankId} size={56} />
              <View className="flex-1">
                <Text className="font-inter-semibold text-lg text-gf-text">{bankById(account.bankId)?.name}</Text>
                <Text className="font-inter text-sm text-gf-text-muted">{account.currency || 'MXN'}</Text>
              </View>
            </View>
          ) : null}
          {account.cardNumber ? (
            <Pressable accessibilityRole="button" accessibilityLabel={showNumber ? 'Ocultar el número' : 'Mostrar el número'} onPress={() => setShowNumber((value) => !value)} className="flex-row items-center justify-between rounded-2xl border border-gf-border px-4 py-3">
              <Text className="font-inter-semibold text-lg text-gf-text" style={{ letterSpacing: 1.5 }}>{formatCardNumber(account.cardNumber, showNumber)}</Text>
              <Ionicons name={showNumber ? 'eye-off-outline' : 'eye-outline'} size={22} color={colors.accent} />
            </Pressable>
          ) : null}
        </Card>
      ) : null}

      <PeriodControls period={period} />


      <SummaryWidget summary={summary} movements={inPeriod} allMovements={mine} currency={primary} />

      <Card title={`Movimientos de ${period.label}`} info={{ title: 'Movimientos de la cuenta', text: 'Lo que entró y salió de esta cuenta en el periodo elegido, y sus movimientos más recientes. Las transferencias entre tus cuentas no cuentan como ingreso ni gasto.' }}>
        <View className="flex-row justify-between">
          <Text className="font-inter text-base text-gf-text-muted">Entró</Text>
          <Text className="font-inter-semibold text-base" style={{ color: colors.income }}>+{formatMoneyMajor(totals.incomes, primary)}</Text>
        </View>
        <View className="flex-row justify-between">
          <Text className="font-inter text-base text-gf-text-muted">Salió</Text>
          <Text className="font-inter-semibold text-base" style={{ color: colors.expense }}>-{formatMoneyMajor(totals.spending, primary)}</Text>
        </View>
        {inPeriod.slice(0, 5).map((movement) => (
          <MovementRow key={String(movement._id)} movement={movement} currency={primary} onPress={() => router.push({ pathname: '/movements/[id]', params: { id: String(movement._id), returnTo: `/more/accounts/${id}` } })} />
        ))}
        {inPeriod.length === 0 && <Text className="font-inter text-sm text-gf-text-muted">Sin movimientos en este periodo.</Text>}
        {mine.length > 0 && (
          <Pressable accessibilityRole="link" onPress={() => router.push({ pathname: '/movements', params: { accountId: id, returnTo: `/more/accounts/${id}` } })}>
            <Text className="font-inter-semibold text-sm text-gf-text">Ver todos los movimientos de esta cuenta ›</Text>
          </Pressable>
        )}
      </Card>

      <Card
        title="Editar cuenta"
        action={
          <Pressable accessibilityRole="button" accessibilityState={{ expanded: editOpen }} accessibilityLabel={editOpen ? 'Ocultar edición' : 'Mostrar edición'} onPress={() => setEditOpen((open) => !open)} hitSlop={10}>
            <Ionicons name={editOpen ? 'chevron-up' : 'chevron-down'} size={22} color={colors.text} />
          </Pressable>
        }>
        {editOpen && (
      <AccountForm
        key={id}
        currencyLocked
        initial={{ name: account.name ?? '', accountType: account.accountType ?? 'debit', currency: account.currency || 'MXN', amount: account.amount !== undefined && account.amount !== null ? String(account.amount) : '0', bankId: account.bankId ?? null, cardNumber: account.cardNumber ?? '' }}
        submitLabel="Guardar cambios"
        onSubmit={async (values) => {
          await sendWrite('general-data/accounts/update-account', { accountId: id, ...values });
          toast.show('Cuenta guardada');
          reloadAfterWrite(dispatch);
          back();
        }}
      />
        )}
      </Card>
      <Pressable accessibilityRole="button" onPress={remove} className="items-center py-2">
        <Text className="font-inter-semibold text-base text-red-500">Borrar cuenta</Text>
      </Pressable>
    </Screen>
  );
}
