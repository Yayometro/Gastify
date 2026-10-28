import { monthName } from '@gastify/core/i18n/dates';

import { currentLocale } from '@/i18n/now';

// The English names the shared calculations write, with the month they stand for (0 = January).
const MONTH_OF: Record<string, number> = {
  january: 0, february: 1, march: 2, april: 3, may: 4, june: 5, july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
  jan: 0, feb: 1, mar: 2, apr: 3, jun: 5, jul: 6, aug: 7, sep: 8, sept: 8, oct: 9, nov: 10, dec: 11,
};

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

// "October 2026" or "Oct" -> the same month in the language on screen: "octubre 2026" / "Oct" in Spanish, the same in English.
export function localMonthLabel(label: string | undefined | null): string {
  const locale = currentLocale();
  return String(label ?? '').replace(/\b(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sept|Sep|Oct|Nov|Dec)\b/gi, (match) => {
    const index = MONTH_OF[match.toLowerCase()];
    if (index === undefined) return match;
    return capitalize(monthName(index, locale, match.length > 4 ? 'long' : 'short'));
  });
}
