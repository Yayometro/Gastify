import { router, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { Alert, Text, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import { BudgetForm } from '@/components/forms/budget-form';
import { MovementRow } from '@/components/movements/movement-row';
import { Screen } from '@/components/screen';
import { useToast } from '@/components/toast';
import { Card } from '@/components/ui/card';
import { ProgressBar } from '@/components/ui/progress-bar';
import { reloadAfterWrite } from '@/hooks/use-load-app-data';
import { usePrimaryCurrency } from '@/hooks/use-primary-currency';
import { useRatesToPrimary } from '@/hooks/use-rates-to-primary';
import { messageOf, sendWrite } from '@/lib/write';
import type { AppDispatch, RootState } from '@/store';
import { totalInPrimary } from '@gastify/core/accounts/accountTotals';
import { budgetToValues } from '@gastify/core/budgets/budgetForm';
import { idOf } from '@gastify/core/categories/categoryForm';
import { monthTitleEs } from '@gastify/core/format/spanishDates';
import { formatMoneyMajor } from '@gastify/core/money/currencies';
import { monthBounds, sortNewestFirst } from '@gastify/core/transactions/monthSummary';
import { getBudgetBarColor } from '@gastify/core/transformers/budgetHistory';
import { getExplicitBudgetId, isProjectBudget, isSavingBudget } from '@gastify/core/transformers/budgetTypes';
import { convertBudgetsToPrimary } from '@gastify/core/transformers/budgetCurrency';
import { getBudgetActualSpend, matchBillToBudget } from '@gastify/core/transformers/projectionsChange';
import { getPrimaryAmount } from '@gastify/core/transformers/transactionsChange';

// One budget: where it stands this month (or in total, for a project), the movements that count toward
// it, and the same form that creates it to change it or delete it.
export default function BudgetDetailScreen() {
  const { id: rawId } = useLocalSearchParams<{ id: string }>();
  const id = String(rawId ?? '');
  const dispatch = useDispatch<AppDispatch>();
  const toast = useToast();
  const currency = usePrimaryCurrency();
  const stored = useSelector((state: RootState) => state.budgetReducer.data.find((item) => idOf(item) === id));
  const transactions = useSelector((state: RootState) => state.transacctionsReducer.data);
  const accounts = useSelector((state: RootState) => state.accountsReducer.data);
  const rates = useRatesToPrimary([stored?.currency, ...accounts.map((account) => account.currency)], currency);
  const now = useMemo(() => new Date(), []);
  const bounds = useMemo(() => monthBounds(now.getFullYear(), now.getMonth()), [now]);
  const back = () => (router.canGoBack() ? router.back() : router.replace('/budgets'));

  const view = useMemo(() => {
    if (!stored) return null;
    const [budget] = convertBudgetsToPrimary([stored], currency, rates);
    const goal = Number(budget.goalAmount) || 0;
    let spent = 0;
    let related: typeof transactions = [];
    if (isProjectBudget(budget)) {
      related = transactions.filter((tx) => tx.isBill && !tx.isIncome && getExplicitBudgetId(tx) === id);
      spent = related.reduce((total, tx) => total + getPrimaryAmount(tx), 0);
    } else if (isSavingBudget(budget)) {
      const linked = (budget.linkedAccounts || []).map(idOf);
      spent = linked.length
        ? totalInPrimary(accounts.filter((account) => linked.includes(idOf(account))), currency, rates).total
        : Math.max(Number(budget.savingAmount) || 0, getBudgetActualSpend(budget, transactions, bounds.start, bounds.end));
    } else {
      spent = getBudgetActualSpend(budget, transactions, bounds.start, bounds.end);
      related = transactions.filter((tx) => {
        const when = new Date((tx.date ?? tx.createdAt) as string).getTime();
        return tx.isBill && when >= bounds.start.getTime() && when <= bounds.end.getTime() && matchBillToBudget(tx as never, budget as never);
      });
    }
    return { budget, goal, spent: Math.round(spent * 100) / 100, related: sortNewestFirst(related) };
  }, [stored, currency, rates, transactions, accounts, bounds, id]);

  if (!stored || !view) {
    return (
      <Screen title="Presupuesto" backLabel="Presupuestos" onBack={back}>
        <Text className="font-inter text-base text-gf-text-muted">No encontramos este presupuesto. Puede que ya se haya borrado.</Text>
      </Screen>
    );
  }

  const { budget, goal, spent, related } = view;
  const saving = isSavingBudget(budget);
  const project = isProjectBudget(budget);
  const ratio = goal > 0 ? spent / goal : 0;
  const diff = goal - spent;

  const remove = () => {
    Alert.alert('Borrar este presupuesto', 'Los movimientos ligados se conservan, sin presupuesto. No se puede deshacer.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Borrar',
        style: 'destructive',
        onPress: async () => {
          try {
            await sendWrite('general-data/budget/remove', { id });
            toast.show('Presupuesto borrado');
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
    <Screen title={stored.name || 'Presupuesto'} subtitle={project ? 'Proyecto' : saving ? 'Meta de ahorro' : monthTitleEs(now)} backLabel="Presupuestos" onBack={back}>
      <Card title={project ? 'Gastado en total' : saving ? 'Ahorrado' : 'Gastado este mes'}>
        <Text className="font-inter-bold text-3xl text-gf-text">{formatMoneyMajor(spent, currency)}</Text>
        {goal > 0 && (
          <>
            <ProgressBar ratio={ratio} color={getBudgetBarColor(ratio, saving)} />
            <View className="flex-row justify-between">
              <Text className="font-inter text-sm text-gf-text-muted">Meta {formatMoneyMajor(goal, currency)}</Text>
              <Text className="font-inter-semibold text-sm text-gf-text">{Math.round(ratio * 100)}%</Text>
            </View>
            <Text className="font-inter text-sm text-gf-text-muted">
              {diff >= 0 ? (saving ? `Faltan ${formatMoneyMajor(diff, currency)} para la meta` : `Quedan ${formatMoneyMajor(diff, currency)}`) : saving ? 'Meta alcanzada' : `Excedido por ${formatMoneyMajor(-diff, currency)}`}
            </Text>
          </>
        )}
      </Card>

      {!saving && (
        <Card title={project ? 'Movimientos del proyecto' : 'Movimientos que cuentan'}>
          {related.length === 0 && <Text className="font-inter text-sm text-gf-text-muted">Todavía no hay movimientos.</Text>}
          {related.slice(0, 25).map((movement) => (
            <MovementRow key={String(movement._id)} movement={movement} currency={currency} onPress={() => router.push({ pathname: '/movements/[id]', params: { id: String(movement._id) } })} />
          ))}
          {related.length > 25 && <Text className="font-inter text-sm text-gf-text-muted">Y {related.length - 25} más en Movimientos.</Text>}
        </Card>
      )}

      <Card title="Editar">
        <BudgetForm
          key={id}
          id={id}
          initial={budgetToValues(stored)}
          submitLabel="Guardar cambios"
          onSubmit={async (body) => {
            await sendWrite('general-data/budget/update', body);
            toast.show('Presupuesto guardado');
            reloadAfterWrite(dispatch);
            back();
          }}
          onDelete={remove}
        />
      </Card>
    </Screen>
  );
}
