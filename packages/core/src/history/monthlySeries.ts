import { monthBounds, monthTotals, movementsInMonth, type MonthTotals, type MonthBounds } from "../transactions/monthSummary";
import { MONTHS_ES_SHORT } from "../format/spanishDates";
import type { TransactionLike } from "../transformers/transactionsChange";

// The monthly history (oldest first): income, spending and balance of each of the last `count`
// months, the last one being the month of `now`.
export interface MonthPoint extends MonthTotals {
  label: string;
  bounds: MonthBounds;
}

export function monthlySeries<T extends TransactionLike>(movements: T[], now: Date = new Date(), count = 12): MonthPoint[] {
  const points: MonthPoint[] = [];
  for (let back = count - 1; back >= 0; back--) {
    const first = new Date(now.getFullYear(), now.getMonth() - back, 1);
    const bounds = monthBounds(first.getFullYear(), first.getMonth());
    const totals = monthTotals(movementsInMonth(movements, bounds));
    points.push({ ...totals, label: MONTHS_ES_SHORT[first.getMonth()], bounds });
  }
  return points;
}
