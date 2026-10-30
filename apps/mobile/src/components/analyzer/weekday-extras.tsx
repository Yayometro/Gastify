import { useMemo } from 'react';
import { Text, View, useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';
import { useLocale, useT } from '@/i18n/client';
import { formatMoneyMajor } from '@gastify/core/money/currencies';
import type { WalletAnalyzerWeeklySpending } from '@gastify/core/transformers/walletAnalyzer';
import { buildSpendCalendar, formatWeekRange, type CalendarLevel, type SpendingDay } from '@gastify/core/transformers/spendingWeeksCalendar';

// The same two blocks the web's weekday detail shows: one bar per week (Monday to Sunday, clipped to the period) and the
// spend calendar (a cell per day, filled in quarters against the period's busiest day). Both read the core's numbers.

const LEVEL_COLORS: Record<CalendarLevel, string> = { 0: 'transparent', 1: '#3b82f6', 2: '#86efac', 3: '#f97316', 4: '#dc2626' };
const FILL: Record<CalendarLevel, number> = { 0: 0, 1: 0.25, 2: 0.5, 3: 0.75, 4: 1 };
const LEVELS: CalendarLevel[] = [0, 1, 2, 3, 4];

export function WeeklyBarsList({ weekly, currency }: { weekly: WalletAnalyzerWeeklySpending; currency: string }) {
  const t = useT();
  const colors = Colors[useColorScheme() === 'dark' ? 'dark' : 'light'];
  const weeks = weekly?.weeks ?? [];
  if (weeks.length === 0) return <Text className="font-inter text-xs text-gf-text-muted">{t('analyzer.weekly.empty')}</Text>;
  const money = (value: number) => formatMoneyMajor(value, currency);
  const maxTotal = Math.max(1, ...weeks.map((week) => week.total));
  const topIndex = weeks.reduce((best, week, index) => (week.total > weeks[best].total ? index : best), 0);
  return (
    <View className="gap-3">
      {weeks.map((week, index) => {
        const isTop = index === topIndex && week.total > 0;
        return (
          <View key={week.weekNumber} className="gap-1">
            <View className="flex-row items-center justify-between gap-3">
              <Text className="flex-1 font-inter text-xs text-gf-text-muted">{week.label}</Text>
              <Text className="font-inter-semibold text-sm text-gf-text">{money(week.total)}</Text>
            </View>
            <View className="h-2 overflow-hidden rounded-full bg-gf-surface">
              <View style={{ width: `${(week.total / maxTotal) * 100}%`, height: '100%', backgroundColor: isTop ? colors.accent : colors.accentSoft, borderRadius: 999 }} />
            </View>
            <Text className="font-inter text-[11px] text-gf-text-muted">
              {t('analyzer.weekly.perDay', { p1: money(week.avgPerDay) })} · {t('analyzer.weekly.share', { p1: `${Math.round(week.shareOfTotal * 100)}%` })} · {t('analyzer.weekly.daysWithSpend', { p1: week.daysWithSpend, p2: week.daysInPeriod })}
              {isTop ? ` · ${t('analyzer.weekday.topWeek')}` : ''}
            </Text>
          </View>
        );
      })}
      {weekly.truncated && <Text className="font-inter text-[11px] text-gf-text-muted">{t('analyzer.weekly.truncated', { p1: weeks.length })}</Text>}
    </View>
  );
}

function Cell({ level, size }: { level: CalendarLevel; size: number }) {
  const colors = Colors[useColorScheme() === 'dark' ? 'dark' : 'light'];
  return (
    <View style={{ height: size, borderRadius: 5, borderWidth: 1, borderColor: colors.border, overflow: 'hidden', backgroundColor: colors.accentSoft, justifyContent: 'flex-end' }}>
      {level > 0 && <View style={{ height: `${FILL[level] * 100}%`, backgroundColor: LEVEL_COLORS[level] }} />}
    </View>
  );
}

export function SpendCalendarGrid({ days, currency, lastDays = 92 }: { days: SpendingDay[]; currency: string; lastDays?: number }) {
  const t = useT();
  const locale = useLocale();
  const calendar = useMemo(() => buildSpendCalendar(days, { lastDays }), [days, lastDays]);
  const heads = [0, 1, 2, 3, 4, 5, 6].map((index) => t(`analyzer.weekday.${index}`).slice(0, 3));
  const windowNote = calendar.windowDays < days.length ? t('analyzer.calendar.window', { p1: calendar.windowDays }) : null;
  if (days.length === 0) return <Text className="font-inter text-xs text-gf-text-muted">{t('analyzer.weekly.empty')}</Text>;
  return (
    <View className="gap-2">
      <View className="flex-row gap-1.5">
        {heads.map((name, index) => (
          <Text key={index} className="flex-1 text-center font-inter-semibold text-[10px] text-gf-text-muted">{name}</Text>
        ))}
      </View>
      {calendar.rows.map((row, rowIndex) => (
        <View key={rowIndex} className="flex-row gap-1.5">
          {row.map((cell, cellIndex) => (
            <View key={cellIndex} style={{ flex: 1 }} accessible={Boolean(cell)} accessibilityLabel={cell ? (cell.total > 0 ? t('analyzer.calendar.cell', { p1: formatWeekRange(cell.date, cell.date, locale), p2: formatMoneyMajor(cell.total, currency) }) : t('analyzer.calendar.cellEmpty', { p1: formatWeekRange(cell.date, cell.date, locale) })) : undefined}>
              {cell ? <Cell level={cell.level} size={30} /> : null}
            </View>
          ))}
        </View>
      ))}
      <View className="flex-row flex-wrap items-center gap-x-3 gap-y-1.5 pt-1">
        {LEVELS.map((level) => (
          <View key={level} className="flex-row items-center gap-1.5">
            <View style={{ width: 14 }}><Cell level={level} size={14} /></View>
            <Text className="font-inter text-[10px] text-gf-text-muted">{t(`analyzer.calendar.level.${level}`)}</Text>
          </View>
        ))}
      </View>
      {windowNote && <Text className="font-inter text-[11px] text-gf-text-muted">{windowNote}</Text>}
    </View>
  );
}
