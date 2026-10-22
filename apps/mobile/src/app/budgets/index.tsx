import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, Text, View, useColorScheme } from 'react-native';
import { useSelector } from 'react-redux';

import { Screen } from '@/components/screen';
import { Card } from '@/components/ui/card';
import { SkeletonRows } from '@/components/ui/skeleton';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Colors } from '@/constants/theme';
import { useRefreshAppData } from '@/hooks/use-load-app-data';
import { usePrimaryCurrency } from '@/hooks/use-primary-currency';
import { useRatesToPrimary } from '@/hooks/use-rates-to-primary';
import type { RootState } from '@/store';
import { totalInPrimary } from '@gastify/core/accounts/accountTotals';
import { monthTitleEs } from '@gastify/core/format/spanishDates';
import { formatMoneyMajor } from '@gastify/core/money/currencies';
import { getBudgetCoverage } from '@gastify/core/transformers/budgetCoverage';
import { convertBudgetsToPrimary, type ConvertedBudget } from '@gastify/core/transformers/budgetCurrency';
import { getExplicitBudgetId, isProjectBudget, isSavingBudget, isSpendingBudget } from '@gastify/core/transformers/budgetTypes';
import { getBudgetActualSpend } from '@gastify/core/transformers/projectionsChange';
import { getPrimaryAmount } from '@gastify/core/transformers/transactionsChange';
import { monthBounds } from '@gastify/core/transactions/monthSummary';
import { dateText, parseDateText } from '@gastify/core/transactions/movementForm';
import { rangeLabelEs } from '@gastify/core/format/spanishDates';
import { BudgetSummarySheet, type BudgetLine, type GroupLine } from '@/components/budget-summary-sheet';
import { BudgetCard } from '@/components/budgets/budget-card';
import { OptionSheet } from '@/components/option-sheet';
import { glassFill } from '@/components/ui/glass-fill';
import { lookOf } from '@/lib/budget-look';
import { BUDGET_ORDERS, sortBudgetRows, type BudgetOrder } from '@/lib/budget-sort';
import { DateField } from '@/components/date-field';
import { MonthSwitcher } from '@/components/month-switcher';
import type { BudgetData } from '@gastify/core/features/budgetSlice';
import type { TransactionData } from '@gastify/core/features/transacctionsSlice';

function Muted({ children }: { children: string }) {
  return <Text className="font-inter text-sm text-gf-text-muted">{children}</Text>;
}

// The budget's id as the API stores it, whether it arrives as a string or as a populated object.
const idOf = (value: unknown): string => String((value as { _id?: unknown })?._id ?? value ?? '');

type Row = {
  budget: ConvertedBudget<BudgetData>;
  spent: number;
  goal: number;
  ratio: number;
};

function NewButton({ label, kind }: { label: string; kind: 'spending' | 'saving' | 'project' }) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push({ pathname: '/budgets/new', params: { kind } })}
      className="flex-1 items-center rounded-2xl border border-gf-border bg-gf-surface px-2 py-3">
      <Text className="font-inter-semibold text-sm" style={{ color: colors.accent }}>
        + {label}
      </Text>
    </Pressable>
  );
}

// The budgets of the current month, split the way the web splits them: spending (with a bar against
// the goal), saving (linked accounts or the saved amount) and projects (everything spent on them).
// Tap one to see its movements and to edit it; the buttons create each kind.
export default function BudgetsScreen() {
  const budgetsState = useSelector((state: RootState) => state.budgetReducer);
  const transactions = useSelector((state: RootState) => state.transacctionsReducer);
  const accountsState = useSelector((state: RootState) => state.accountsReducer);
  const currency = usePrimaryCurrency();
  const { refresh, refreshing } = useRefreshAppData();

  const now = useMemo(() => new Date(), []);
  // The period the budgets are read in: a month (arrows, or tap the month to pick one) or a custom range.
  const [month, setMonth] = useState(() => new Date(now.getFullYear(), now.getMonth(), 1));
  const [custom, setCustom] = useState(false);
  const [fromText, setFromText] = useState(() => dateText(new Date(now.getFullYear(), now.getMonth(), 1)));
  const [toText, setToText] = useState(() => dateText(now));
  const [sheet, setSheet] = useState<'total' | 'unbudgeted' | null>(null);
  const bounds = useMemo(() => {
    if (!custom) return monthBounds(month.getFullYear(), month.getMonth());
    const from = parseDateText(fromText) ?? new Date(now.getFullYear(), now.getMonth(), 1);
    const to = parseDateText(toText) ?? now;
    const [a, b] = from <= to ? [from, to] : [to, from];
    return { start: new Date(a.getFullYear(), a.getMonth(), a.getDate(), 0, 0, 0, 0), end: new Date(b.getFullYear(), b.getMonth(), b.getDate(), 23, 59, 59, 999) };
  }, [custom, month, fromText, toText, now]);
  const periodLabel = custom ? rangeLabelEs(bounds.start, bounds.end) : monthTitleEs(month);
  const accounts = accountsState.data;
  const rates = useRatesToPrimary(
    [...budgetsState.data.map((budget) => budget.currency), ...accounts.map((account) => account.currency)],
    currency
  );

  const plan = useMemo(() => {
    const active = convertBudgetsToPrimary(
      budgetsState.data.filter((budget) => !budget.archived),
      currency,
      rates
    );
    return {
      spending: active.filter(isSpendingBudget),
      saving: active.filter(isSavingBudget),
      projects: active.filter(isProjectBudget),
    };
  }, [budgetsState.data, currency, rates]);

  const movements = transactions.data as TransactionData[];

  const coverage = useMemo(
    () =>
      getBudgetCoverage({
        transactions: movements,
        budgets: [...plan.spending, ...plan.projects],
        startDate: bounds.start,
        endDate: bounds.end,
      }),
    [movements, plan, bounds]
  );

  const spendingRows = useMemo<Row[]>(
    () =>
      plan.spending.map((budget) => {
        const spent = getBudgetActualSpend(budget, movements, bounds.start, bounds.end);
        const goal = Number(budget.goalAmount) || 0;
        return { budget, spent, goal, ratio: goal > 0 ? spent / goal : 0 };
      }),
    [plan, movements, bounds]
  );

  const savingRows = useMemo<Row[]>(
    () =>
      plan.saving.map((budget) => {
        const linkedIds = (budget.linkedAccounts || []).map(idOf).filter(Boolean);
        // Like the web: the linked accounts' balances when there are any, else the larger of the
        // saved amount and what was actually spent under the budget.
        const saved =
          linkedIds.length > 0
            ? totalInPrimary(
                accounts.filter((account) => linkedIds.includes(idOf(account))),
                currency,
                rates
              ).total
            : Math.max(Number(budget.savingAmount) || 0, getBudgetActualSpend(budget, movements, bounds.start, bounds.end));
        const goal = Number(budget.goalAmount) || 0;
        return { budget, spent: saved, goal, ratio: goal > 0 ? saved / goal : 0 };
      }),
    [plan, accounts, currency, rates, movements, bounds]
  );

  // A project's total is everything spent on it, whatever the month.
  const projectRows = useMemo(
    () =>
      plan.projects.map((budget) => {
        const id = idOf(budget);
        const spent = movements
          .filter((movement) => movement.isBill && !movement.isIncome && getExplicitBudgetId(movement) === id)
          .reduce((total, movement) => total + getPrimaryAmount(movement), 0);
        const goal = Number(budget.goalAmount) || 0;
        return { budget, spent: Math.round(spent * 100) / 100, goal, ratio: goal > 0 ? spent / goal : 0 };
      }),
    [plan, movements]
  );

  // The uncovered spending grouped by category, biggest first (the web's "Other categories without a budget").
  const uncoveredGroups = useMemo<GroupLine[]>(() => {
    const map = new Map<string, GroupLine>();
    for (const tx of coverage.uncovered) {
      const category = (tx as unknown as { category?: { _id?: unknown; name?: string; icon?: string; color?: string } | null }).category;
      const key = category?._id ? String(category._id) : category?.name || 'none';
      const row = map.get(key) ?? { key, categoryId: category?._id ? String(category._id) : undefined, name: category?.name || 'Sin categoría', icon: category?.icon, color: category?.color, amount: 0, count: 0 };
      row.amount += getPrimaryAmount(tx);
      row.count += 1;
      map.set(key, row);
    }
    return [...map.values()].map((row) => ({ ...row, amount: Math.round(row.amount * 100) / 100 })).sort((a, b) => b.amount - a.amount);
  }, [coverage]);

  const budgetLines = useMemo<BudgetLine[]>(
    () => spendingRows.map((row) => {
      const look = lookOf(row.budget, '#9333ea');
      return { key: idOf(row.budget), name: row.budget.name || 'Presupuesto', icon: look.icon ?? undefined, color: look.color ?? undefined, spent: row.spent, goal: row.goal };
    }),
    [spendingRows]
  );

  const [order, setOrder] = useState<BudgetOrder>('ratio');
  const [orderOpen, setOrderOpen] = useState(false);
  const sortedSpending = useMemo(() => sortBudgetRows(spendingRows, order), [spendingRows, order]);
  const sortedSaving = useMemo(() => sortBudgetRows(savingRows, order), [savingRows, order]);
  const sortedProjects = useMemo(() => sortBudgetRows(projectRows, order), [projectRows, order]);
  const loading = budgetsState.status === 'loading' && budgetsState.data.length === 0;
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  return (
    <Screen title="Presupuestos" subtitle={periodLabel} refreshing={refreshing} onRefresh={refresh}>
      {budgetsState.status === 'failed' && (
        <Text className="font-inter text-sm text-red-500">No pudimos cargar tus presupuestos.</Text>
      )}

      <View className="flex-row gap-2">
        <NewButton label="Presupuesto" kind="spending" />
        <NewButton label="Ahorro" kind="saving" />
        <NewButton label="Proyecto" kind="project" />
      </View>

      {/* The period: arrows move by month, tapping the month picks any month; "Personalizado" takes a range. */}
      <View className="gap-3">
        {!custom && <MonthSwitcher value={month} onChange={setMonth} latest={now} />}
        <View className="flex-row gap-2">
          <PeriodChip label="Mes" selected={!custom} onPress={() => setCustom(false)} />
          <PeriodChip label="Personalizado" selected={custom} onPress={() => setCustom(true)} />
        </View>
        {custom && (
          <View className="gap-3">
            <DateField label="Fecha inicial" value={fromText} onChange={setFromText} />
            <DateField label="Fecha final" value={toText} onChange={setToText} />
          </View>
        )}
      </View>

      {/* Two tiles, as the web's summary: the total spending and the part no budget covers. Each opens its detail. */}
      <View className="flex-row gap-3">
        <Pressable accessibilityRole="button" onPress={() => setSheet('total')} className="flex-1">
          <Card title="Gasto total" style={{ minHeight: 160, flex: 1 }} info={{ title: 'Gasto total', text: 'Suma de todos tus gastos del periodo elegido, estén o no cubiertos por un presupuesto, en tu moneda principal. Sirve para saber cuánto sale en total antes de ver cuánto está controlado. Toca la tarjeta para ver el desglose por presupuesto.' }}>
            <Text className="font-inter-bold text-xl text-gf-text">{formatMoneyMajor(coverage.totalSpent, currency)}</Text>
            <Text className="font-inter text-xs text-gf-text-muted">Toca para ver el detalle</Text>
          </Card>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => setSheet('unbudgeted')} className="flex-1">
          <Card title="Sin presupuesto" style={{ minHeight: 160, flex: 1 }} info={{ title: 'Sin presupuesto', text: 'Gasto total del periodo menos lo que cae dentro de algún presupuesto activo (por categoría o subcategoría). El porcentaje es esa parte ÷ el gasto total. Sirve para detectar dinero que se va sin control. Toca la tarjeta para ver de qué categorías viene y crear un presupuesto.' }}>
            <Text className="font-inter-bold text-xl text-gf-text">{formatMoneyMajor(coverage.unbudgetedSpent, currency)}</Text>
            <ProgressBar ratio={Math.min(1, coverage.unbudgetedPercentage / 100)} color={colors.accent} />
            <Text className="font-inter text-xs text-gf-text-muted">{Math.round(coverage.unbudgetedPercentage)}% del gasto</Text>
          </Card>
        </Pressable>
      </View>

      <BudgetSummarySheet
        kind={sheet}
        onClose={() => setSheet(null)}
        currency={currency}
        total={coverage.totalSpent}
        unbudgeted={coverage.unbudgetedSpent}
        percentage={coverage.unbudgetedPercentage}
        budgets={budgetLines}
        groups={uncoveredGroups}
        uncoveredMovements={coverage.uncovered}
        onAddBudget={(categoryId) => {
          setSheet(null);
          router.push({ pathname: '/budgets/new', params: categoryId ? { kind: 'spending', categoryId } : { kind: 'spending' } });
        }}
      />

      <Pressable accessibilityRole="button" onPress={() => setOrderOpen(true)} className="flex-row items-center justify-between rounded-full px-5 py-3" style={glassFill(scheme === 'dark', colors.backgroundElement)}>
        <Text className="font-inter-medium text-sm text-gf-text-muted">Ordenar por</Text>
        <Text className="font-inter-semibold text-sm text-gf-text">{BUDGET_ORDERS.find((item) => item.id === order)?.label} ▾</Text>
      </Pressable>
      <OptionSheet visible={orderOpen} title="Ordenar presupuestos" options={BUDGET_ORDERS} isSelected={(id) => id === order} onSelect={(id) => setOrder(id as BudgetOrder)} onClose={() => setOrderOpen(false)} />

      {loading ? (
        <SkeletonRows count={4} />
      ) : (
        <>
          <Text className="font-inter-semibold text-lg text-gf-text">Gastos</Text>
          {spendingRows.length === 0 ? (
            <Muted>No tienes presupuestos de gasto activos.</Muted>
          ) : (
            sortedSpending.map((row) => <BudgetCard key={idOf(row.budget)} row={row} currency={currency} saving={false} />)
          )}

          {savingRows.length > 0 && (
            <>
              <Text className="font-inter-semibold text-lg text-gf-text">Ahorro</Text>
              {sortedSaving.map((row) => (
                <BudgetCard key={idOf(row.budget)} row={row} currency={currency} saving />
              ))}
            </>
          )}

          {projectRows.length > 0 && (
            <>
              <Text className="font-inter-semibold text-lg text-gf-text">Proyectos</Text>
              {sortedProjects.map((row) => (
                <BudgetCard key={idOf(row.budget)} row={row} currency={currency} saving={false} />
              ))}
            </>
          )}
        </>
      )}
    </Screen>
  );
}

function PeriodChip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      className="rounded-full border border-gf-border px-4 py-2"
      style={{ backgroundColor: selected ? colors.accentSoft : undefined, borderColor: selected ? colors.accent : colors.border }}>
      <Text className="font-inter-medium text-sm text-gf-text">{label}</Text>
    </Pressable>
  );
}
