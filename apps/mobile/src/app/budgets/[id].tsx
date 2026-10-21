import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Alert, Pressable, Text, View, useColorScheme } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import { BudgetForm } from '@/components/forms/budget-form';
import { BudgetMood, BudgetProgress } from '@/components/budget-progress';
import { lookOf, periodSuffix } from '@/lib/budget-look';
import { CategoryBadge } from '@/components/category-badge';
import { PickerModal } from '@/components/picker-modal';
import { MovementRow } from '@/components/movements/movement-row';
import { Screen } from '@/components/screen';
import { useToast } from '@/components/toast';
import { Card } from '@/components/ui/card';
import { Colors } from '@/constants/theme';
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
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  // The editor is folded away until it is opened (the web's collapsed edit panel).
  const [editOpen, setEditOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);

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
    const distributionMap = new Map<string, { key: string; name: string; icon?: string; color: string; amount: number }>();
    for (const tx of related) {
      const category = tx.category;
      const subcategory = tx.subCategory;
      const key = `${category?._id ?? category?.name ?? 'none'}:${subcategory?._id ?? subcategory?.name ?? 'none'}`;
      const row = distributionMap.get(key) ?? {
        key,
        name: `${category?.name || 'Sin categoría'}${subcategory?.name ? ` · ${subcategory.name}` : ''}`,
        icon: subcategory?.icon || category?.icon,
        color: subcategory?.color || category?.color || colors.accent,
        amount: 0,
      };
      row.amount += Math.max(0, getPrimaryAmount(tx));
      distributionMap.set(key, row);
    }
    const distribution = [...distributionMap.values()].filter((row) => row.amount > 0).sort((a, b) => b.amount - a.amount);
    const distributionTotal = distribution.reduce((sum, row) => sum + row.amount, 0);
    // Saving: what is in each currency across the linked accounts (pesos and dólares, as the web shows).
    const linkedAccounts = accounts.filter((account) => (budget.linkedAccounts || []).map(idOf).includes(idOf(account)));
    const byCurrency = new Map<string, number>();
    for (const account of linkedAccounts) {
      const code = account.currency || currency;
      byCurrency.set(code, (byCurrency.get(code) ?? 0) + (Number(account.amount) || 0));
    }
    return {
      budget,
      goal,
      spent: Math.round(spent * 100) / 100,
      related: sortNewestFirst(related),
      distribution,
      distributionTotal,
      linkedAccounts,
      byCurrency: [...byCurrency.entries()].map(([code, amount]) => ({ code, amount })),
    };
  }, [stored, currency, rates, transactions, accounts, bounds, id, colors.accent]);

  if (!stored || !view) {
    return (
      <Screen title="Presupuesto" backLabel="Presupuestos" onBack={back}>
        <Text className="font-inter text-base text-gf-text-muted">No encontramos este presupuesto. Puede que ya se haya borrado.</Text>
      </Screen>
    );
  }

  const { budget, goal, spent, related, distribution, distributionTotal, linkedAccounts, byCurrency } = view;
  const saving = isSavingBudget(budget);
  const project = isProjectBudget(budget);
  const ratio = goal > 0 ? spent / goal : 0;
  const diff = goal - spent;
  const reached = saving && goal > 0 && spent >= goal;
  // Project movements that can still be linked: bills not tied to any budget yet, or tied to another one.
  const linkable = transactions.filter((tx) => tx.isBill && !tx.isIncome && getExplicitBudgetId(tx) !== id);

  const linkMovement = async (transactionId: string, budgetId: string | null) => {
    try {
      await sendWrite('general-data/transactions/link-budget', { transactionId, budgetId });
      toast.show(budgetId ? 'Movimiento vinculado' : 'Movimiento desvinculado');
      reloadAfterWrite(dispatch);
    } catch (e) {
      toast.show(messageOf(e), 'error');
    }
  };

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
        {goal > 0 && (
          <>
            <View className="flex-row items-center gap-3">
              <BudgetMood ratio={ratio} saving={saving} size={48} />
              <CategoryBadge icon={lookOf(budget, colors.accentSoft).icon} color={lookOf(budget, colors.accentSoft).color} size={44} />
              <Text className="flex-1 font-inter-semibold text-base" style={{ color: diff >= 0 ? colors.text : colors.expense }}>
                {saving ? (diff >= 0 ? `Faltan ${formatMoneyMajor(diff, currency)}` : 'Meta alcanzada') : diff >= 0 ? `Quedan ${formatMoneyMajor(diff, currency)}` : `Excedido por ${formatMoneyMajor(-diff, currency)}`}
              </Text>
            </View>
            <BudgetProgress ratio={ratio} color={getBudgetBarColor(ratio, saving)} saving={saving} spent={spent} goal={goal} currency={currency} suffix={periodSuffix(budget)} />
          </>
        )}
        {goal <= 0 && <Text className="font-inter-bold text-3xl text-gf-text">{formatMoneyMajor(spent, currency)}</Text>}
        {reached && (
          <View className="flex-row items-center gap-2 rounded-2xl px-4 py-3" style={{ backgroundColor: colors.accentSoft }}>
            <Ionicons name="trophy" size={22} color="#f59e0b" />
            <Text className="flex-1 font-inter-semibold text-base text-gf-text">¡Meta alcanzada! Felicidades.</Text>
          </View>
        )}
        {saving && byCurrency.length > 0 && (
          <View className="gap-1 pt-1">
            <Text className="font-inter-medium text-sm text-gf-text-muted">En tus cuentas ligadas</Text>
            {byCurrency.map((row) => (
              <View key={row.code} className="flex-row justify-between">
                <Text className="font-inter text-sm text-gf-text-muted">{row.code}</Text>
                <Text className="font-inter-semibold text-sm text-gf-text">{formatMoneyMajor(row.amount, row.code)}</Text>
              </View>
            ))}
          </View>
        )}
      </Card>

      {!saving && distribution.length > 0 && (
        <Card title="Distribución del gasto por categoría" info={{ title: 'Distribución del gasto', text: 'Cada tramo muestra qué parte de los movimientos que cuentan para este presupuesto corresponde a una categoría o subcategoría. El porcentaje se calcula sobre esos movimientos.' }}>
          <View className="flex-row overflow-hidden rounded-full" style={{ height: 14 }} accessibilityLabel="Distribución del gasto por categoría">
            {distribution.map((row) => <View key={row.key} style={{ flex: row.amount, backgroundColor: row.color }} />)}
          </View>
          {distribution.map((row) => (
            <View key={row.key} className="flex-row items-center gap-3">
              <CategoryBadge icon={row.icon} color={row.color} size={30} />
              <Text className="flex-1 font-inter-medium text-sm text-gf-text" numberOfLines={1}>{row.name}</Text>
              <Text className="font-inter-semibold text-sm text-gf-text">{distributionTotal > 0 ? Math.round((row.amount / distributionTotal) * 100) : 0}%</Text>
              <Text className="font-inter text-xs text-gf-text-muted">{formatMoneyMajor(row.amount, currency)}</Text>
            </View>
          ))}
        </Card>
      )}

      {saving && (
        <Card title="Cuentas ligadas">
          {linkedAccounts.length === 0 && <Text className="font-inter text-sm text-gf-text-muted">Esta meta no tiene cuentas ligadas.</Text>}
          {linkedAccounts.map((account) => (
            <View key={idOf(account)} className="flex-row items-center justify-between gap-3">
              <Text className="flex-1 font-inter-medium text-base text-gf-text" numberOfLines={1}>{account.name || 'Cuenta'}</Text>
              <Text className="font-inter text-sm text-gf-text-muted">{formatMoneyMajor(account.amount ?? 0, account.currency || currency)}</Text>
            </View>
          ))}
        </Card>
      )}

      {!saving && (
        <Card title={project ? 'Movimientos del proyecto' : 'Movimientos que cuentan'}>
          {project && (
            <View className="flex-row gap-2">
              <Pressable accessibilityRole="button" onPress={() => setLinkOpen(true)} className="flex-1 items-center rounded-full border border-gf-border py-2.5">
                <Text className="font-inter-semibold text-sm text-gf-text">Vincular existente</Text>
              </Pressable>
              <Pressable accessibilityRole="button" onPress={() => router.push('/add')} className="flex-1 items-center rounded-full border border-gf-border py-2.5">
                <Text className="font-inter-semibold text-sm text-gf-text">Crear movimiento</Text>
              </Pressable>
            </View>
          )}
          {related.length === 0 && <Text className="font-inter text-sm text-gf-text-muted">Todavía no hay movimientos.</Text>}
          {related.slice(0, 25).map((movement) => (
            <View key={String(movement._id)} className="gap-1">
              <MovementRow movement={movement} currency={currency} onPress={() => router.push({ pathname: '/movements/[id]', params: { id: String(movement._id), returnTo: `/budgets/${id}` } })} />
              {project && (
                <Pressable accessibilityRole="button" onPress={() => linkMovement(String(movement._id), null)} className="self-end px-2 pb-1">
                  <Text className="font-inter-medium text-xs" style={{ color: colors.expense }}>Desvincular</Text>
                </Pressable>
              )}
            </View>
          ))}
          {related.length > 25 && <Text className="font-inter text-sm text-gf-text-muted">Y {related.length - 25} más en Movimientos.</Text>}
        </Card>
      )}

      <Card
        title="Editar"
        action={
          <Pressable accessibilityRole="button" accessibilityState={{ expanded: editOpen }} accessibilityLabel={editOpen ? 'Ocultar edición' : 'Mostrar edición'} onPress={() => setEditOpen((open) => !open)} hitSlop={10}>
            <Ionicons name={editOpen ? 'chevron-up' : 'chevron-down'} size={22} color={colors.text} />
          </Pressable>
        }>
        {editOpen && (
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
        )}
      </Card>

      {project && (
        <PickerModal
          visible={linkOpen}
          title="Vincular un movimiento"
          searchPlaceholder="Buscar movimiento"
          items={linkable.map((tx) => ({ id: String(tx._id), label: tx.name || 'Movimiento', detail: `${formatMoneyMajor(getPrimaryAmount(tx), currency)} · ${new Date((tx.date ?? tx.createdAt) as string).toLocaleDateString('es-MX')}` }))}
          isSelected={() => false}
          onSelect={(transactionId) => {
            setLinkOpen(false);
            linkMovement(transactionId, id);
          }}
          onClose={() => setLinkOpen(false)}
        />
      )}
    </Screen>
  );
}
