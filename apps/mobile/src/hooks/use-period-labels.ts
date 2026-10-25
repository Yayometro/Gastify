import { useMemo } from 'react';

import type { PeriodLabels } from '@gastify/core/history/periodComparison';
import { useLocale, useT } from '@/i18n/client';

// What a period summary says in the person's language: the month names, and the name of the movements with no category.
export function usePeriodLabels(): PeriodLabels {
  const t = useT();
  const locale = useLocale();
  return useMemo(() => ({ locale, noCategory: t('history.noCategory') }), [locale, t]);
}
