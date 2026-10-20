import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, ScrollView, Text, View, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AmbientBackground, DARK_BASE } from '@/components/ambient-background';
import { CategoryBadge } from '@/components/category-badge';
import { GradientButton } from '@/components/ui/gradient-button';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Colors } from '@/constants/theme';
import { formatMoneyMajor } from '@gastify/core/money/currencies';

export type BudgetLine = { key: string; name: string; icon?: string; color?: string; spent: number; goal: number };
export type GroupLine = { key: string; name: string; icon?: string; color?: string; amount: number; count: number };

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
  onAddBudget: () => void;
}) {
  const scheme = useColorScheme();
  const dark = scheme === 'dark';
  const colors = Colors[dark ? 'dark' : 'light'];
  const share = Math.max(0, Math.min(1, percentage / 100));

  return (
    <Modal visible={kind !== null} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Pressable accessibilityRole="button" accessibilityLabel="Cerrar" onPress={onClose} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' }} />
        <View style={{ maxHeight: '86%', borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: 'hidden', backgroundColor: dark ? DARK_BASE : colors.background }}>
          <AmbientBackground />
          <SafeAreaView edges={['bottom']}>
            <View className="flex-row items-center justify-between px-6 pb-2 pt-5">
              <Text className="font-inter-bold text-2xl text-gf-text">{kind === 'unbudgeted' ? 'Sin presupuesto' : 'Gasto total'}</Text>
              <Pressable accessibilityRole="button" accessibilityLabel="Cerrar" onPress={onClose} hitSlop={10}>
                <Ionicons name="close" size={26} color={colors.text} />
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 28, gap: 14 }}>
              {kind === 'total' && (
                <>
                  <Text className="font-inter-bold text-3xl text-gf-text">{formatMoneyMajor(total, currency)}</Text>
                  <Text className="font-inter text-sm text-gf-text-muted">Todo lo que gastaste en el periodo: dentro de presupuestos y sin presupuesto.</Text>
                  {budgets.length === 0 && <Text className="font-inter text-sm text-gf-text-muted">No hay presupuestos de gasto en este periodo.</Text>}
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
              {kind === 'unbudgeted' && (
                <>
                  <View className="flex-row items-end justify-between">
                    <Text className="font-inter-bold text-3xl text-gf-text">{formatMoneyMajor(unbudgeted, currency)}</Text>
                    <Text className="font-inter-semibold text-lg text-gf-text-muted">{Math.round(percentage)}%</Text>
                  </View>
                  <ProgressBar ratio={share} color={colors.accent} />
                  <Text className="font-inter text-sm text-gf-text-muted">Participación en el gasto total.</Text>
                  <Text className="font-inter text-sm text-gf-text-muted">Estos movimientos no están cubiertos por ningún presupuesto de gasto activo.</Text>
                  <Pressable accessibilityRole="button" onPress={onAddBudget} className="items-center rounded-full border border-gf-border py-3">
                    <Text className="font-inter-semibold text-base" style={{ color: colors.accent }}>Agregar presupuesto</Text>
                  </Pressable>
                  <Text className="font-inter-semibold text-base text-gf-text">Otras categorías sin presupuesto</Text>
                  {groups.length === 0 && <Text className="font-inter text-sm text-gf-text-muted">No hay movimientos sin presupuesto.</Text>}
                  {groups.map((group) => (
                    <View key={group.key} className="flex-row items-center gap-3">
                      <CategoryBadge icon={group.icon} color={group.color} size={34} />
                      <View className="flex-1">
                        <Text className="font-inter-medium text-base text-gf-text" numberOfLines={1}>{group.name}</Text>
                        <Text className="font-inter text-xs text-gf-text-muted">{group.count} {group.count === 1 ? 'movimiento' : 'movimientos'}</Text>
                      </View>
                      <Text className="font-inter-semibold text-sm text-gf-text">{formatMoneyMajor(group.amount, currency)}</Text>
                    </View>
                  ))}
                  <GradientButton label="Listo" onPress={onClose} />
                </>
              )}
            </ScrollView>
          </SafeAreaView>
        </View>
      </View>
    </Modal>
  );
}
