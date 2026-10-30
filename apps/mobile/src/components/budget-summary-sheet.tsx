import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Fragment, useState } from 'react';
import { ScrollView, Text, View, useColorScheme } from 'react-native';
import { TourPressable, TourTarget } from '@/components/tour/tour-target';
import { TutorialTip } from '@/components/tour/tutorial-tip';
import { HelpSep } from '@/components/ui/help-sep';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CategoryBadge } from '@/components/category-badge';
import { MovementRow } from '@/components/movements/movement-row';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { GradientButton } from '@/components/ui/gradient-button';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Colors } from '@/constants/theme';
import { formatMoneyMajor } from '@gastify/core/money/currencies';
import type { TransactionData } from '@gastify/core/features/transacctionsSlice';
import { useT } from "@/i18n/client";
import { tNow } from '@/i18n/now';

export type BudgetLine = { key: string; name: string; icon?: string; color?: string; spent: number; goal: number };
export type GroupLine = { key: string; categoryId?: string; name: string; icon?: string; color?: string; amount: number; count: number };

// The two detail sheets of the budgets summary, as on the web: "Total spending" (what was spent, budget by
// budget) and "Unbudgeted" (the spending no active budget covers, and the categories it comes from).
export function BudgetSummarySheet({
  kind,
  onClose,
  currency,
  total,
  unbudgeted,
  percentage,
  budgets,
  groups,
  uncoveredMovements,
  onAddBudget,
}: {
  kind: 'total' | 'unbudgeted' | null;
  onClose: () => void;
  currency: string;
  total: number;
  unbudgeted: number;
  percentage: number;
  budgets: BudgetLine[];
  groups: GroupLine[];
  uncoveredMovements: TransactionData[];
  onAddBudget: (categoryId?: string) => void;
}) {
  const t = useT();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const share = Math.max(0, Math.min(1, percentage / 100));
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const close = () => { setSelectedGroup(null); onClose(); };
  const group = groups.find((item) => item.key === selectedGroup);
  const groupMovements = selectedGroup === null ? [] : uncoveredMovements.filter((tx) => {
    const category = tx.category;
    return String(category?._id ?? category?.name ?? 'none') === selectedGroup;
  });

  return (
    <BottomSheet visible={kind !== null} onClose={close} maxHeight="86%">
          <SafeAreaView edges={['bottom']} style={{ flexShrink: 1 }}>
            <View className="flex-row items-center justify-between px-6 pb-2 pt-5">
              {group && <TourPressable id="m-bud-sheet-back" accessibilityRole="button" accessibilityLabel={t("mobile.volver.a.categorias.sin.presupuesto")} onPress={() => setSelectedGroup(null)} hitSlop={10}><Ionicons name="arrow-back" size={24} color={colors.text} /></TourPressable>}
              <Text className="flex-1 font-inter-bold text-2xl text-gf-text">{group ? group.name : kind === 'unbudgeted' ? t("budgets.unbudgeted") : t("mobile.gasto.total")}</Text>
              {kind === 'unbudgeted' ? (
                <View className="flex-row items-center gap-1">
                  <HelpSep />
                  <TutorialTip tour="m-bud-unbudgeted" label={t("budgets.unbudgeted")} />
                </View>
              ) : null}
              <TourPressable id="m-bud-sheet-close" accessibilityRole="button" accessibilityLabel={t("mobile.cerrar")} onPress={close} hitSlop={10}>
                <Ionicons name="close" size={26} color={colors.text} />
              </TourPressable>
            </View>
            <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 28, gap: 14 }}>
              {kind === 'total' && (
                <>
                  <Text className="font-inter-bold text-3xl text-gf-text">{formatMoneyMajor(total, currency)}</Text>
                  <Text className="font-inter text-sm text-gf-text-muted">{t("mobile.todo.lo.que.gastaste.en")}</Text>
                  {budgets.length === 0 && <Text className="font-inter text-sm text-gf-text-muted">{t("mobile.no.hay.presupuestos.de.gasto")}</Text>}
                  {budgets.map((line) => {
                    const ratio = line.goal > 0 ? line.spent / line.goal : 0;
                    return (
                      <View key={line.key} className="gap-2">
                        <View className="flex-row items-center gap-3">
                          <CategoryBadge icon={line.icon} color={line.color} size={34} />
                          <Text className="flex-1 font-inter-medium text-base text-gf-text" numberOfLines={1}>{line.name}</Text>
                          <Text className="font-inter-semibold text-sm text-gf-text">{formatMoneyMajor(line.spent, currency)}</Text>
                        </View>
                        {line.goal > 0 && <ProgressBar ratio={ratio} color={ratio > 1 ? colors.expense : colors.accent} />}
                      </View>
                    );
                  })}
                </>
              )}
              {kind === 'unbudgeted' && group && (
                <>
                  <TourTarget id="m-bud-sheet-group-total" style={{ gap: 14 }}>
                    <Text className="font-inter-bold text-3xl text-gf-text">{formatMoneyMajor(group.amount, currency)}</Text>
                    <Text className="font-inter text-sm text-gf-text-muted">{t("mobile.p1.p2.en.esta.categoria", { p1: groupMovements.length, p2: tNow("mobile.movimientos.sin.presupuesto", { count: groupMovements.length }) })}</Text>
                  </TourTarget>
                  {group.categoryId && <TourPressable id="m-bud-sheet-add" accessibilityRole="button" onPress={() => { close(); onAddBudget(group.categoryId); }} className="items-center rounded-full border border-gf-border py-3"><Text className="font-inter-semibold text-base" style={{ color: colors.accent }}>{t("mobile.agregar.presupuesto.para.p1", { p1: group.name })}</Text></TourPressable>}
                  {groupMovements.map((movement, index) => {
                    const row = <MovementRow divider movement={movement} currency={currency} onPress={() => { close(); router.push({ pathname: '/movements/[id]', params: { id: String(movement._id), returnTo: '/budgets' } }); }} />;
                    // The first transaction is the one the tutorial points at; the others keep their place in the list.
                    return index === 0 ? <TourTarget key={String(movement._id)} id="m-bud-sheet-movement">{row}</TourTarget> : <Fragment key={String(movement._id)}>{row}</Fragment>;
                  })}
                </>
              )}
              {kind === 'unbudgeted' && !group && (
                <>
                  <TourTarget id="m-bud-sheet-total" className="flex-row items-end justify-between">
                    <Text className="font-inter-bold text-3xl text-gf-text">{formatMoneyMajor(unbudgeted, currency)}</Text>
                    <Text className="font-inter-semibold text-lg text-gf-text-muted">{Math.round(percentage)}%</Text>
                  </TourTarget>
                  <ProgressBar ratio={share} color={colors.accent} />
                  <Text className="font-inter text-sm text-gf-text-muted">{t("mobile.participacion.en.el.gasto.total")}</Text>
                  <Text className="font-inter text-sm text-gf-text-muted">{t("mobile.estos.movimientos.no.estan.cubiertos")}</Text>
                  <TourPressable id="m-bud-sheet-general-add" accessibilityRole="button" onPress={() => onAddBudget()} className="items-center rounded-full border border-gf-border py-3">
                    <Text className="font-inter-semibold text-base" style={{ color: colors.accent }}>{t("mobile.agregar.presupuesto")}</Text>
                  </TourPressable>
                  <Text className="font-inter-semibold text-base text-gf-text">{t("mobile.otras.categorias.sin.presupuesto")}</Text>
                  {groups.length === 0 && <Text className="font-inter text-sm text-gf-text-muted">{t("mobile.no.hay.movimientos.sin.presupuesto")}</Text>}
                  {groups.map((group, index) => (
                    <TourPressable id={index === 0 ? "m-bud-sheet-group" : undefined} key={group.key} accessibilityRole="button" accessibilityLabel={t("mobile.budgets.noBudgetMovesOf", { p1: group.name })} onPress={() => setSelectedGroup(group.key)} className="flex-row items-center gap-3">
                      <CategoryBadge icon={group.icon} color={group.color} size={34} />
                      <View className="flex-1">
                        <Text className="font-inter-medium text-base text-gf-text" numberOfLines={1}>{group.name}</Text>
                        <Text className="font-inter text-xs text-gf-text-muted">{tNow("mobile.movimientos.conteo", { count: group.count, p1: group.count })}</Text>
                      </View>
                      <Text className="font-inter-semibold text-sm text-gf-text">{formatMoneyMajor(group.amount, currency)}</Text>
                      <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
                    </TourPressable>
                  ))}
                  <TourTarget id="m-bud-sheet-done">
                    <GradientButton label={t("mobile.listo")} onPress={close} />
                  </TourTarget>
                </>
              )}
            </ScrollView>
          </SafeAreaView>
    </BottomSheet>
  );
}
