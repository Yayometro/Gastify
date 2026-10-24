import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View, useColorScheme } from 'react-native';
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
              {group && <Pressable accessibilityRole="button" accessibilityLabel={t("mobile.volver.a.categorias.sin.presupuesto")} onPress={() => setSelectedGroup(null)} hitSlop={10}><Ionicons name="arrow-back" size={24} color={colors.text} /></Pressable>}
              <Text className="flex-1 font-inter-bold text-2xl text-gf-text">{group ? group.name : kind === 'unbudgeted' ? 'Sin presupuesto' : 'Gasto total'}</Text>
              <Pressable accessibilityRole="button" accessibilityLabel={t("mobile.cerrar")} onPress={close} hitSlop={10}>
                <Ionicons name="close" size={26} color={colors.text} />
              </Pressable>
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
                  <Text className="font-inter-bold text-3xl text-gf-text">{formatMoneyMajor(group.amount, currency)}</Text>
                  <Text className="font-inter text-sm text-gf-text-muted">{t("mobile.p1.p2.en.esta.categoria", { p1: groupMovements.length, p2: groupMovements.length === 1 ? 'movimiento sin presupuesto' : 'movimientos sin presupuesto' })}</Text>
                  {group.categoryId && <Pressable accessibilityRole="button" onPress={() => { close(); onAddBudget(group.categoryId); }} className="items-center rounded-full border border-gf-border py-3"><Text className="font-inter-semibold text-base" style={{ color: colors.accent }}>{t("mobile.agregar.presupuesto.para.p1", { p1: group.name })}</Text></Pressable>}
                  {groupMovements.map((movement) => <MovementRow divider key={String(movement._id)} movement={movement} currency={currency} onPress={() => { close(); router.push({ pathname: '/movements/[id]', params: { id: String(movement._id), returnTo: '/budgets' } }); }} />)}
                </>
              )}
              {kind === 'unbudgeted' && !group && (
                <>
                  <View className="flex-row items-end justify-between">
                    <Text className="font-inter-bold text-3xl text-gf-text">{formatMoneyMajor(unbudgeted, currency)}</Text>
                    <Text className="font-inter-semibold text-lg text-gf-text-muted">{Math.round(percentage)}%</Text>
                  </View>
                  <ProgressBar ratio={share} color={colors.accent} />
                  <Text className="font-inter text-sm text-gf-text-muted">{t("mobile.participacion.en.el.gasto.total")}</Text>
                  <Text className="font-inter text-sm text-gf-text-muted">{t("mobile.estos.movimientos.no.estan.cubiertos")}</Text>
                  <Pressable accessibilityRole="button" onPress={() => onAddBudget()} className="items-center rounded-full border border-gf-border py-3">
                    <Text className="font-inter-semibold text-base" style={{ color: colors.accent }}>{t("mobile.agregar.presupuesto")}</Text>
                  </Pressable>
                  <Text className="font-inter-semibold text-base text-gf-text">{t("mobile.otras.categorias.sin.presupuesto")}</Text>
                  {groups.length === 0 && <Text className="font-inter text-sm text-gf-text-muted">{t("mobile.no.hay.movimientos.sin.presupuesto")}</Text>}
                  {groups.map((group) => (
                    <Pressable key={group.key} accessibilityRole="button" accessibilityLabel={`Ver movimientos sin presupuesto de ${group.name}`} onPress={() => setSelectedGroup(group.key)} className="flex-row items-center gap-3">
                      <CategoryBadge icon={group.icon} color={group.color} size={34} />
                      <View className="flex-1">
                        <Text className="font-inter-medium text-base text-gf-text" numberOfLines={1}>{group.name}</Text>
                        <Text className="font-inter text-xs text-gf-text-muted">{group.count} {group.count === 1 ? 'movimiento' : 'movimientos'}</Text>
                      </View>
                      <Text className="font-inter-semibold text-sm text-gf-text">{formatMoneyMajor(group.amount, currency)}</Text>
                      <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
                    </Pressable>
                  ))}
                  <GradientButton label={t("mobile.listo")} onPress={close} />
                </>
              )}
            </ScrollView>
          </SafeAreaView>
    </BottomSheet>
  );
}
