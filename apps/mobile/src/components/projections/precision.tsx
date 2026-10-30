import { Text, View } from 'react-native';

import { useT } from '@/i18n/client';
import { accuracyTone, monthAccuracy, summarizeAccuracy, type AccuracyMonthInput, type AccuracyTone } from '@gastify/core/transformers/projectionAccuracy';

// How close the projection was to what really happened, as a percentage (the web's chips). The number is always written
// out; the color is only a hint (green 90+, amber 70-89, red below 70).
const TONE: Record<AccuracyTone, { color: string; background: string }> = {
  good: { color: '#4ade80', background: 'rgba(74,222,128,0.12)' },
  warning: { color: '#fbbf24', background: 'rgba(251,191,36,0.12)' },
  poor: { color: '#f87171', background: 'rgba(248,113,113,0.12)' },
};

export function formatPercent(value: number | null | undefined): string {
  return value === null || value === undefined || !Number.isFinite(value) ? '—' : `${Math.round(value)}%`;
}

export function PrecisionChip({ value, label }: { value: number | null | undefined; label?: string }) {
  if (value === null || value === undefined || !Number.isFinite(value)) return <Text className="font-inter text-xs text-gf-text-muted">{label ? `${label} —` : '—'}</Text>;
  const tone = TONE[accuracyTone(value)];
  return (
    <View className="flex-row items-center gap-1 rounded-lg px-2 py-0.5" style={{ backgroundColor: tone.background, borderWidth: 1, borderColor: tone.color }}>
      {label ? <Text className="font-inter text-[11px] text-gf-text-muted">{label}</Text> : null}
      <Text className="font-inter-semibold text-xs" style={{ color: tone.color }}>{formatPercent(value)}</Text>
    </View>
  );
}

// Income, expense and global precision of one closed month.
export function MonthPrecision({ month, withSentence = false }: { month: AccuracyMonthInput; withSentence?: boolean }) {
  const t = useT();
  const accuracy = monthAccuracy(month);
  return (
    <View className="gap-1.5">
      <View className="flex-row flex-wrap items-center gap-2">
        <PrecisionChip label={t('analyzer.income')} value={accuracy.income} />
        <PrecisionChip label={t('analyzer.bill')} value={accuracy.expense} />
        <PrecisionChip label={t('projections.precision.global')} value={accuracy.global} />
      </View>
      {withSentence && <Text className="font-inter text-xs text-gf-text-muted">{t('projections.precision.monthSentence')}</Text>}
    </View>
  );
}

// "Rango visible": the precision over every measured month listed.
export function RangePrecision({ months }: { months: AccuracyMonthInput[] }) {
  const t = useT();
  const summary = summarizeAccuracy(months);
  return (
    <View className="gap-1.5 rounded-xl border border-gf-border px-3 py-2.5">
      <Text className="font-inter-semibold text-sm text-gf-text">{t('projections.precision.rangeRow')} · {t('projections.precision.months', { p1: summary.months })}</Text>
      {summary.months === 0 ? (
        <Text className="font-inter text-xs text-gf-text-muted">{t('projections.precision.none')}</Text>
      ) : (
        <View className="flex-row flex-wrap items-center gap-2">
          <PrecisionChip label={t('analyzer.income')} value={summary.income} />
          <PrecisionChip label={t('analyzer.bill')} value={summary.expense} />
          <PrecisionChip label={t('projections.precision.global')} value={summary.global} />
        </View>
      )}
      <Text className="font-inter text-xs text-gf-text-muted">{t('projections.precision.help')}</Text>
    </View>
  );
}
