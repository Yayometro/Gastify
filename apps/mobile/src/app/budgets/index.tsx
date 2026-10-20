import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, Text, View, useColorScheme } from 'react-native';
import { useSelector } from 'react-redux';

import { CategoryBadge } from '@/components/category-badge';
import { Screen } from '@/components/screen';
import { Card } from '@/components/ui/card';
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
import { getBudgetBarColor } from '@gastify/core/transformers/budgetHistory';
import { getExplicitBudgetId, isProjectBudget, isSavingBudget, isSpendingBudget } from '@gastify/core/transformers/budgetTypes';
import { getBudgetActualSpend } from '@gastify/core/transformers/projectionsChange';
import { getPrimaryAmount } from '@gastify/core/transformers/transactionsChange';
import { monthBounds } from '@gastify/core/transactions/monthSummary';
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

type Look = { icon?: string | null; color?: string | null };

// Spending and saving budgets look like their first category (the server only stores an icon for
// projects); a project has its own icon.
function lookOf(budget: BudgetData, fallbackColor: string): Look {
  if (isProjectBudget(budget)) return { icon: budget.icon, color: fallbackColor };
  const first = (budget.categories?.[0]?.category ?? budget.category) as Look | string | undefined;
  if (first && typeof first === 'object') return { icon: first.icon, color: first.color ?? fallbackColor };
  return { icon: budget.icon, color: fallbackColor };
}

function BudgetCard({ row, currency, saving }: { row: Row; currency: string; saving: boolean }) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const { budget, spent, goal, ratio } = row;
  const diff = spent - goal;
  const exceeded = !saving && goal > 0 && diff > 0;
  const percent = Math.round(ratio * 100);
  const look = lookOf(budget, colors.accentSoft);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Abrir ${budget.name || 'presupuesto'}`}
      onPress={() => router.push({ pathname: '/budgets/[id]', params: { id: idOf(budget) } })}>
      <Card>
        <View className="flex-row items-center gap-3">
          <CategoryBadge icon={look.icon} color={look.color} size={44} />
          <View className="flex-1">
            <Text className="font-inter-semibold text-base text-gf-text" numberOfLines={1}>
              {budget.name || 'Presupuesto'}
            </Text>
            <Text className="font-inter text-sm text-gf-text-muted">
              {saving ? 'Ahorrado' : 'Gastado'} {formatMoneyMajor(spent, currency)} de {formatMoneyMajor(goal, currency)}
            </Text>
          </View>
          {goal > 0 && <Text className="font-inter-bold text-base text-gf-text">{percent}%</Text>}
        </View>
        {goal > 0 && <ProgressBar ratio={ratio} color={getBudgetBarColor(ratio, saving)} />}
        {goal > 0 && (
          <Text className="font-inter text-sm" style={{ color: exceeded ? colors.expense : colors.textSecondary }}>
            {exceeded
              ? `Excedido por ${formatMoneyMajor(diff, currency)}`
              : saving
                ? diff < 0
                  ? `Faltan ${formatMoneyMajor(-diff, currency)} para la meta`
                  : 'Meta alcanzada'
                : `Quedan ${formatMoneyMajor(Math.max(-diff, 0), currency)}`}
          </Text>
        )}
      </Card>
    </Pressable>
  );
}

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
  const bounds = useMemo(() => monthBounds(now.getFullYear(), now.getMonth()), [now]);
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

  const loading = budgetsState.status === 'loading' && budgetsState.data.length === 0;

  return (
    <Screen title="Presupuestos" subtitle={monthTitleEs(now)} refreshing={refreshing} onRefresh={refresh}>
      {budgetsState.status === 'failed' && (
        <Text className="font-inter text-sm text-red-500">No pudimos cargar tus presupuestos.</Text>
      )}

      <View className="flex-row gap-2">
        <NewButton label="Presupuesto" kind="spending" />
        <NewButton label="Ahorro" kind="saving" />
        <NewButton label="Proyecto" kind="project" />
      </View>

      <Card title="Este mes">
        <View className="flex-row justify-between gap-3">
          <Text className="font-inter text-base text-gf-text-muted">Gastado en presupuestos</Text>
          <Text className="font-inter-semibold text-base text-gf-text">{formatMoneyMajor(coverage.totalSpent, currency)}</Text>
        </View>
        <View className="flex-row justify-between gap-3">
          <Text className="font-inter text-base text-gf-text-muted">Sin presupuesto</Text>
          <Text className="font-inter-semibold text-base text-gf-text">
            {formatMoneyMajor(coverage.unbudgetedSpent, currency)}
            {coverage.unbudgetedPercentage ? ` (${Math.round(coverage.unbudgetedPercentage)}%)` : ''}
          </Text>
        </View>
      </Card>

      {loading ? (
        <Muted>Cargando…</Muted>
      ) : (
        <>
          <Text className="font-inter-semibold text-lg text-gf-text">Gastos</Text>
          {spendingRows.length === 0 ? (
            <Muted>No tienes presupuestos de gasto activos.</Muted>
          ) : (
            spendingRows.map((row) => <BudgetCard key={idOf(row.budget)} row={row} currency={currency} saving={false} />)
          )}

          {savingRows.length > 0 && (
            <>
              <Text className="font-inter-semibold text-lg text-gf-text">Ahorro</Text>
              {savingRows.map((row) => (
                <BudgetCard key={idOf(row.budget)} row={row} currency={currency} saving />
              ))}
            </>
          )}

          {projectRows.length > 0 && (
            <>
              <Text className="font-inter-semibold text-lg text-gf-text">Proyectos</Text>
              {projectRows.map((row) => (
                <BudgetCard key={idOf(row.budget)} row={row} currency={currency} saving={false} />
              ))}
            </>
          )}
        </>
      )}
    </Screen>
  );
}
