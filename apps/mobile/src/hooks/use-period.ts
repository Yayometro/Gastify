import { useMemo, useState } from 'react';

import { monthTitleEs } from '@gastify/core/format/spanishDates';
import { rangeFor, rangePresetLabel, type RangePreset } from '@gastify/core/transactions/movementFilters';
import { dateText, parseDateText } from '@gastify/core/transactions/movementForm';

// The period a screen is looking at: the month of a switcher, a quick range (7/30/90 days, this year)
// or two custom dates. Returns the window and a label for it.
export function usePeriod(initial: RangePreset = 'month') {
  const now = useMemo(() => new Date(), []);
  const [preset, setPreset] = useState<RangePreset>(initial);
  const [month, setMonth] = useState(() => new Date(now.getFullYear(), now.getMonth(), 1));
  const [customFrom, setCustomFrom] = useState(() => dateText(new Date(now.getFullYear(), now.getMonth(), 1)));
  const [customTo, setCustomTo] = useState(() => dateText(now));

  const range = useMemo(
    () => rangeFor(preset, now, month, { from: parseDateText(customFrom), to: parseDateText(customTo) }),
    [preset, now, month, customFrom, customTo]
  );
  const label = preset === 'month' ? monthTitleEs(month) : rangePresetLabel(preset);

  return { now, preset, setPreset, month, setMonth, customFrom, setCustomFrom, customTo, setCustomTo, range, label };
}

export type PeriodState = ReturnType<typeof usePeriod>;
