import { Text, View } from 'react-native';

import { ChipPicker, type ChipItem } from '@/components/chip-picker';
import { GfSwitch } from '@/components/ui/switch';
import { TourTarget } from '@/components/tour/tour-target';
import { useT } from '@/i18n/client';
import { RECURRENCE_FREQUENCIES, type RecurrenceFrequency } from '@gastify/core/recurring/recurrence';

export type RecurringChoice = { on: boolean; frequency: RecurrenceFrequency; isVariable: boolean };
export const NO_RECURRING: RecurringChoice = { on: false, frequency: 'monthly', isVariable: false };

// "Is it a recurring expense?" in the movement form: how often it repeats and whether its amount changes. A fixed one is
// created by itself each time; a variable one asks for the amount when the date comes (see RecurringPendingSheet).
export function RecurringFields({ value, onChange }: { value: RecurringChoice; onChange: (next: RecurringChoice) => void }) {
  const t = useT();
  const items: ChipItem[] = RECURRENCE_FREQUENCIES.map((frequency) => ({ id: frequency, label: t(`recurring.frequency.${frequency}`) }));
  return (
    <TourTarget id="m-movform-recurring" className="gap-3">
      <View className="flex-row items-center justify-between gap-3">
        <Text className="flex-1 font-inter-medium text-base text-gf-text">{t('movements.new.recurring')}</Text>
        <GfSwitch value={value.on} accessibilityLabel={t('movements.new.recurring')} onValueChange={(on) => onChange({ ...value, on })} />
      </View>
      {value.on && (
        <View className="gap-3 rounded-2xl border border-gf-border p-3">
          <Text className="font-inter-medium text-sm text-gf-text-muted">{t('movements.new.recurringEvery')}</Text>
          <ChipPicker items={items} value={value.frequency} onChange={(id) => onChange({ ...value, frequency: id as RecurrenceFrequency })} moreAfter={99} />
          <View className="flex-row items-center justify-between gap-3">
            <Text className="flex-1 font-inter-medium text-sm text-gf-text">{t('movements.new.recurringVariable')}</Text>
            <GfSwitch value={value.isVariable} accessibilityLabel={t('movements.new.recurringVariable')} onValueChange={(isVariable) => onChange({ ...value, isVariable })} />
          </View>
          <Text className="font-inter text-xs text-gf-text-muted">
            {t(value.isVariable ? 'movements.new.recurringHintVariable' : 'movements.new.recurringHintFixed', { p1: t(`recurring.frequency.phrase.${value.frequency}`) })}
          </Text>
        </View>
      )}
    </TourTarget>
  );
}
