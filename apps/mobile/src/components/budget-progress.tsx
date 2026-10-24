import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Text, View, useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';
import { formatMoneyMajor } from '@gastify/core/money/currencies';
import { getBudgetMoodEmoji } from '@gastify/core/transformers/budgetHistory';
import { useT } from "@/i18n/client";

// The big face of a budget (the web shows it large): delighted when barely spent, panicked when over (and, for a saving
// goal, the other way round).
export function BudgetMood({ ratio, saving = false, size = 40 }: { ratio: number; saving?: boolean; size?: number }) {
  const t = useT();
  return <Text style={{ fontSize: size, lineHeight: size + 6 }} accessibilityLabel={t("mobile.como.va.este.presupuesto")}>{getBudgetMoodEmoji(ratio, saving)}</Text>;
}

// The web's bar: a rounded track with a gradient fill and, at the tip of the fill, a circle with the percentage
// (its border is the bar's color; the circle stays inside the track at both ends). Under it: what is spent or saved
// in large type on the left and the limit with its period on the right.
export function BudgetProgress({
  ratio,
  color,
  saving = false,
  spent,
  goal,
  currency,
  suffix = '',
}: {
  ratio: number;
  color: string;
  saving?: boolean;
  spent: number;
  goal: number;
  currency: string;
  suffix?: string;
}) {
  const t = useT();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const [width, setWidth] = useState(0);
  const safe = Number.isFinite(ratio) ? ratio : 0;
  const percent = Math.round(safe * 100);
  const fill = Math.min(1, Math.max(0, safe));
  const exceeded = safe > 1;
  const TIP = 40;
  const left = Math.max(0, Math.min(width - TIP, fill * width - TIP / 2));

  return (
    <View className="gap-1.5">
      <View onLayout={(event) => setWidth(event.nativeEvent.layout.width)} style={{ height: TIP, justifyContent: 'center' }} accessibilityLabel={t("mobile.budgets.progressLabel", { p1: percent, p2: saving ? t("mobile.budgets.ofGoal") : t("mobile.budgets.ofLimit") })}>
        <View style={{ height: 20, borderRadius: 10, overflow: 'hidden', backgroundColor: colors.border }}>
          <LinearGradient colors={[`${color}88`, color]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ height: '100%', width: `${fill * 100}%`, borderRadius: 10 }} />
        </View>
        <View
          style={{
            position: 'absolute',
            left,
            top: 0,
            width: TIP,
            height: TIP,
            borderRadius: TIP / 2,
            borderWidth: 3,
            borderColor: color,
            backgroundColor: scheme === 'dark' ? '#1b1033' : '#ffffff',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Text className="font-inter-bold" style={{ fontSize: percent >= 1000 ? 10 : 12, color: exceeded ? (saving ? '#93c5fd' : colors.expense) : colors.text }}>{percent}%</Text>
        </View>
      </View>
      <View className="flex-row items-end justify-between gap-3">
        <Text className="font-inter-bold text-xl text-gf-text" numberOfLines={1} adjustsFontSizeToFit>{formatMoneyMajor(spent, currency)}</Text>
        <Text className="font-inter text-xs text-gf-text-muted">{t("mobile.de.p1.p2", { p1: formatMoneyMajor(goal, currency), p2: suffix })}</Text>
      </View>
    </View>
  );
}
