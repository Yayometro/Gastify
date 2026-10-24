import { View } from 'react-native';

import { ChipPicker } from '@/components/chip-picker';
import { DateField } from '@/components/date-field';
import { MonthSwitcher } from '@/components/month-switcher';
import type { PeriodState } from '@/hooks/use-period';
import { presetsWithYears, type RangePreset } from '@gastify/core/transactions/movementFilters';
import { useT } from "@/i18n/client";

// The chips to pick a period, plus what each one needs: the month switcher or the two calendar dates.
export function PeriodControls({ period, years = [] }: { period: PeriodState; years?: number[] }) {
  const t = useT();
  return (
    <View className="gap-3">
      <ChipPicker items={presetsWithYears(years).map((p) => ({ id: p.value, label: p.label }))} value={period.preset} onChange={(id) => period.setPreset(id as RangePreset)} moreAfter={99} />
      {period.preset === 'month' && <MonthSwitcher value={period.month} onChange={period.setMonth} latest={period.now} />}
      {period.preset === 'custom' && (
        <View className="gap-3">
          <DateField label={t("mobile.desde")} value={period.customFrom} onChange={period.setCustomFrom} />
          <DateField label={t("mobile.hasta")} value={period.customTo} onChange={period.setCustomTo} />
        </View>
      )}
    </View>
  );
}
