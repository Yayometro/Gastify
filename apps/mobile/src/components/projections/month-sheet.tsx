import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, View, useColorScheme } from 'react-native';

import { DetailSheet } from '@/components/analyzer/detail-sheet';
import { InfoTip } from '@/components/info-tip';
import { MovementRow } from '@/components/movements/movement-row';
import { GradientButton } from '@/components/ui/gradient-button';
import { TextField } from '@/components/ui/text-field';
import { Colors } from '@/constants/theme';
import { esMonthLabel } from '@/lib/month-label';
import { messageOf, sendWrite } from '@/lib/write';
import type { TransactionData } from '@gastify/core/features/transacctionsSlice';
import { formatMoneyMajor } from '@gastify/core/money/currencies';
import { getYearMonthDateRange } from '@gastify/core/time/timeFunctions';
import { getValueActiveInMonth } from '@gastify/core/transformers/budgetHistory';
import { isSpendingBudget } from '@gastify/core/transformers/budgetTypes';
import { getExpectedOccurrencesInMonth, getMonthBucketBreakdown, type YearProjectionRow } from '@gastify/core/transformers/projectionsChange';
import { filterBillsOrIncomes, getTransactionsFromTimeRange } from '@gastify/core/transformers/transactionsChange';

import { useT, useInfo } from "@/i18n/client";

type AnyRecord = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

const revisionTime = (value: unknown) => {
  const time = +new Date(value as string);
  return Number.isNaN(time) ? 0 : time;
};

// One month of the year's projection, as the web's month window: what the month is (closed, current or future), real
// against expected, the budgeted-against-actual bars, the actual balance (closed months) and the two "unexpected"
// buffers. The movements behind the numbers are one tap away.
export function ProjectionMonthSheet({
  row,
  monthIndex,
  year,
  currency,
  transactions,
  budgets,
  incomeSources,
  settings,
  onSaved,
  onClose,
}: {
  row: YearProjectionRow | null;
  monthIndex: number;
  year: number;
  currency: string;
  transactions: TransactionData[];
  budgets: AnyRecord[];
  incomeSources: AnyRecord[];
  settings: AnyRecord | null;
  onSaved: (settings: AnyRecord) => void;
  onClose: () => void;
}) {
  const { APP_INFO } = useInfo();
  const t = useT();
  const colors = Colors[useColorScheme() === 'dark' ? 'dark' : 'light'];
  const money = (value: number) => formatMoneyMajor(value, currency);
  const buffers = ((settings?.monthlyBuffers as AnyRecord[] | undefined) ?? []).find((entry) => entry.month === monthIndex);
  const manual = ((settings?.monthlyBalances as AnyRecord[] | undefined) ?? []).find((entry) => entry.month === monthIndex)?.balance;
  const [expenseBuffer, setExpenseBuffer] = useState('0');
  const [incomeBuffer, setIncomeBuffer] = useState('0');
  const [balance, setBalance] = useState('');
  const [showMovements, setShowMovements] = useState(false);
  const [busy, setBusy] = useState<'buffers' | 'balance' | null>(null);
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);

  // The fields start from what is saved for the month whenever another month is opened.
  const opened = row?.monthName ?? null;
  useEffect(() => {
    setExpenseBuffer(String(buffers?.unexpectedBuffer ?? 0));
    setIncomeBuffer(String(buffers?.unexpectedIncomeBuffer ?? 0));
    setBalance(typeof manual === 'number' ? String(manual) : '');
    setShowMovements(false);
    setMessage(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened]);

  const range = useMemo(() => (row ? getYearMonthDateRange(new Date(year, 0, 1)).get(row.monthName) : undefined), [row, year]);
  const monthTransactions = useMemo(() => (range ? (getTransactionsFromTimeRange(transactions as never[], range.start, range.end) as TransactionData[]) : []), [range, transactions]);

  const chart = useMemo(() => {
    if (!row || !range) return [];
    const { bills } = filterBillsOrIncomes(monthTransactions as never[]);
    const spending = (budgets ?? []).filter((budget) => isSpendingBudget(budget as never));
    // A closed month is judged against the goal that was active then, not today's.
    const forChart =
      row.type === 'actual'
        ? spending
            .map((budget) => {
              const resolved = getValueActiveInMonth(budget.history as never[], range.start) as AnyRecord | null;
              return resolved ? { ...budget, goalAmount: resolved.goalAmount } : null;
            })
            .filter(Boolean)
        : spending.filter((budget) => !budget.archived);
    return getMonthBucketBreakdown(bills as never[], forChart as never[], buffers?.unexpectedBuffer ?? 0);
  }, [row, range, monthTransactions, budgets, buffers]);

  const expected = useMemo(() => {
    if (!row || !range || row.type === 'actual') return [];
    return (incomeSources ?? [])
      .filter((source) => source.active && !source.archived)
      .map((source) => ({ name: String(source.name ?? ''), amount: Number(source.amount) || 0, occurrences: getExpectedOccurrencesInMonth(source as never, range.start, range.end) }));
  }, [row, range, incomeSources]);

  const save = async (kind: 'buffers' | 'balance') => {
    setMessage(null);
    if (kind === 'balance' && (balance.trim() === '' || !Number.isFinite(Number(balance)))) {
      setMessage({ text: t("mobile.escribe.primero.un.saldo"), error: true });
      return;
    }
    setBusy(kind);
    try {
      const body = kind === 'buffers'
        ? { year, monthBuffer: { month: monthIndex, unexpectedBuffer: Number(expenseBuffer) || 0, unexpectedIncomeBuffer: Number(incomeBuffer) || 0 } }
        : { year, monthBalance: { month: monthIndex, balance: Number(balance) } };
      const next = await sendWrite<AnyRecord>('general-data/projections/update', body);
      if (next) onSaved(next);
      setMessage({ text: kind === 'buffers' ? 'Topes guardados.' : 'Saldo del mes guardado.', error: false });
    } catch (error) {
      setMessage({ text: messageOf(error), error: true });
    } finally {
      setBusy(null);
    }
  };

  const tile = (label: string, value: number, tone: string, detail?: string) => (
    <View className="flex-1 gap-0.5 rounded-2xl p-3" style={{ backgroundColor: colors.accentSoft }}>
      <Text className="font-inter text-sm text-gf-text-muted">{label}</Text>
      <Text className="font-inter-bold text-xl" numberOfLines={1} adjustsFontSizeToFit style={{ color: tone }}>{money(value)}</Text>
      {detail ? <Text className="font-inter text-xs text-gf-text-muted">{detail}</Text> : null}
    </View>
  );

  const maxBar = Math.max(1, ...chart.flatMap((item) => [item.budgeted, item.actual]));
  const revisions = [...((buffers?.revisions as AnyRecord[] | undefined) ?? [])].sort((a, b) => revisionTime(a.updatedAt) - revisionTime(b.updatedAt));

  return (
    <DetailSheet
      visible={row !== null}
      onClose={onClose}
      title={row ? `${esMonthLabel(row.monthName)} ${year}` : ''}
      subtitle={row ? (row.type === 'actual' ? 'Mes cerrado: con tus movimientos reales.' : row.type === 'estimate' ? 'Mes futuro: estimado con tus presupuestos y fuentes de ingreso.' : 'Mes en curso: arranca como estimado y se llena con lo real conforme pasa el mes.') : undefined}
      info={APP_INFO.c_mo_leer_este_mes}>
      {range && (
        <Pressable accessibilityRole="button" accessibilityState={{ expanded: showMovements }} onPress={() => setShowMovements((open) => !open)} className="items-center rounded-full border border-gf-border py-2.5">
          <Text className="font-inter-semibold text-sm" style={{ color: colors.accent }}>{showMovements ? 'Ocultar movimientos' : `Ver movimientos del mes (${monthTransactions.length})`}</Text>
        </Pressable>
      )}
      {showMovements && (
        <View>
          {monthTransactions.length === 0 && <Text className="font-inter text-sm text-gf-text-muted">{t("mobile.sin.movimientos.este.mes")}</Text>}
          {monthTransactions.slice(0, 80).map((tx) => (
            <MovementRow divider key={String(tx._id)} movement={tx} currency={currency} onPress={() => { onClose(); router.push({ pathname: '/movements/[id]', params: { id: String(tx._id), returnTo: '/more/projections' } }); }} />
          ))}
          {monthTransactions.length > 80 && <Text className="pt-2 font-inter text-xs text-gf-text-muted">{t("mobile.se.muestran.los.primeros.80")}</Text>}
        </View>
      )}

      {row?.type === 'current' && (
        <View className="flex-row gap-3">
          {tile('Ingresos', row.projectedIncome ?? 0, colors.income, `real hasta hoy: ${money(row.actualIncome ?? 0)} · esperado: ${money(row.shadowIncome ?? 0)}`)}
          {tile('Gastos', row.projectedExpense ?? 0, colors.expense, `real hasta hoy: ${money(row.actualExpense ?? 0)} · presupuestado: ${money(row.shadowExpense ?? 0)}`)}
        </View>
      )}
      {row?.type === 'estimate' && (
        <View className="flex-row gap-3">
          {tile('Ingreso estimado', row.income ?? 0, colors.income)}
          {tile('Gasto estimado', row.expense ?? 0, colors.expense)}
        </View>
      )}
      {row?.type === 'actual' && (
        <View className="flex-row gap-3">
          {tile('Ingreso real', row.income ?? 0, colors.income, row.historicalIncome !== undefined ? `esperado entonces: ${money(row.historicalIncome)}` : undefined)}
          {tile('Gasto real', row.expense ?? 0, colors.expense, row.historicalExpense !== undefined ? `presupuestado entonces: ${money(row.historicalExpense)}` : undefined)}
        </View>
      )}

      {chart.length > 0 && (
        <View className="gap-2">
          <View className="flex-row items-center justify-between">
            <Text className="font-inter-semibold text-base text-gf-text">{t("mobile.presupuestado.contra.real")}</Text>
            <View className="flex-row gap-3">
              <Text className="font-inter text-xs" style={{ color: '#a78bfa' }}>{t("mobile.presupuestado")}</Text>
              <Text className="font-inter text-xs" style={{ color: '#f87171' }}>{t("mobile.real")}</Text>
            </View>
          </View>
          {chart.map((item) => (
            <View key={item.label} className="gap-1 border-t border-gf-border pt-2">
              <View className="flex-row justify-between gap-3">
                <Text className="flex-1 font-inter-medium text-sm text-gf-text" numberOfLines={1}>{item.label === 'Unexpected/Other' ? 'Otros / inesperado' : item.label}</Text>
                <Text className="font-inter text-xs text-gf-text-muted">{t("mobile.p1.de.p2", { p1: money(item.actual), p2: money(item.budgeted) })}</Text>
              </View>
              <View className="h-2 overflow-hidden rounded-full bg-gf-surface"><View style={{ width: `${(item.budgeted / maxBar) * 100}%`, height: '100%', backgroundColor: '#a78bfa' }} /></View>
              <View className="h-2 overflow-hidden rounded-full bg-gf-surface"><View style={{ width: `${(item.actual / maxBar) * 100}%`, height: '100%', backgroundColor: '#f87171' }} /></View>
            </View>
          ))}
        </View>
      )}

      {expected.length > 0 && (
        <View className="gap-1">
          <Text className="font-inter-semibold text-base text-gf-text">{t("mobile.ingreso.esperado.este.mes")}</Text>
          {expected.map((item, index) => (
            <View key={index} className="flex-row justify-between gap-3 border-t border-gf-border py-2">
              <Text className="flex-1 font-inter text-sm text-gf-text">{item.name}</Text>
              <Text className="font-inter-semibold text-sm text-gf-text">{item.occurrences} × {money(item.amount)} = {money(item.occurrences * item.amount)}</Text>
            </View>
          ))}
        </View>
      )}

      {row?.type === 'actual' && (
        <View className="gap-2 border-t border-gf-border pt-4">
          <View className="flex-row items-center gap-2">
            <Text className="flex-1 font-inter-semibold text-base text-gf-text">{t("mobile.saldo.real.de.este.mes")}</Text>
            <InfoTip info={APP_INFO.saldo_real_del_mes} />
          </View>
          <TextField label={t("mobile.saldo.al.cierre.del.mes")} value={balance} onChangeText={setBalance} keyboardType="decimal-pad" placeholder={t("mobile.por.ejemplo.45000")} />
          <GradientButton label={t("mobile.guardar.saldo")} onPress={() => save('balance')} loading={busy === 'balance'} disabled={busy !== null} />
        </View>
      )}

      <View className="gap-3 border-t border-gf-border pt-4">
        <Text className="font-inter-semibold text-base text-gf-text">{t("mobile.topes.inesperados")}</Text>
        <View className="gap-1">
          <View className="flex-row items-center gap-2">
            <Text className="flex-1 font-inter-medium text-sm text-gf-text-muted">{t("mobile.tope.de.gasto.inesperado")}</Text>
            <InfoTip info={APP_INFO.tope_de_gasto_inesperado} />
          </View>
          <TextField label={t("mobile.monto")} value={expenseBuffer} onChangeText={setExpenseBuffer} keyboardType="decimal-pad" placeholder="0" />
        </View>
        <View className="gap-1">
          <View className="flex-row items-center gap-2">
            <Text className="flex-1 font-inter-medium text-sm text-gf-text-muted">{t("mobile.tope.de.ingreso.inesperado")}</Text>
            <InfoTip info={APP_INFO.tope_de_ingreso_inesperado} />
          </View>
          <TextField label={t("mobile.monto")} value={incomeBuffer} onChangeText={setIncomeBuffer} keyboardType="decimal-pad" placeholder="0" />
        </View>
        <GradientButton label={t("mobile.guardar.topes")} onPress={() => save('buffers')} loading={busy === 'buffers'} disabled={busy !== null} />
        {message && <Text className="font-inter text-sm" style={{ color: message.error ? colors.expense : colors.income }}>{message.text}</Text>}
        {revisions.length > 0 && (
          <View className="gap-1">
            <Text className="font-inter-medium text-sm text-gf-text-muted">{t("mobile.historial.de.esta.proyeccion.p1", { p1: revisions.length })}</Text>
            {revisions.map((revision, index) => (
              <View key={index} className="flex-row justify-between gap-3 rounded-xl px-3 py-1.5" style={{ backgroundColor: colors.accentSoft }}>
                <Text className="font-inter text-xs text-gf-text-muted">{revisionTime(revision.updatedAt) ? new Date(revision.updatedAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</Text>
                <Text className="font-inter text-xs text-gf-text-muted">{t("mobile.gasto.p1.ingreso.p2", { p1: money(revision.unexpectedBuffer || 0), p2: money(revision.unexpectedIncomeBuffer || 0) })}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </DetailSheet>
  );
}
