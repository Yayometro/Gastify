import { hslToHex } from "../colors/palette";
import { minorToMajor } from "../money/currencies";
import { isInRange } from "../transactions/movementFilters";
import { movementKind } from "../transactions/monthSummary";
import type { MonthBounds } from "../transactions/monthSummary";
import { idOf } from "../categories/categoryForm";

// What came into and went out of each account in a period, in the account's own currency (the web's credit-card
// widget shows the same two numbers). Transfers are left out: they only move money between accounts.
export interface AccountActivity {
  incomes: number;
  spending: number;
  count: number;
}

interface ActivityMovement {
  date?: unknown;
  createdAt?: unknown;
  kind?: string;
  isBill?: boolean;
  amount?: number | string | null;
  account?: unknown;
  displayMoney?: unknown;
}

// The movement's amount in its account's currency: the native money when the server gives it, else the legacy number.
export function nativeAmountOf(movement: ActivityMovement): number {
  const native = (movement.displayMoney as { native?: { amountMinor?: number; currency?: string } | null } | null | undefined)?.native;
  if (native && typeof native.amountMinor === "number" && native.currency) return Math.abs(minorToMajor(native.amountMinor, native.currency));
  return Math.abs(Number(movement.amount) || 0);
}

export function accountActivity(movements: ActivityMovement[], range: MonthBounds): Record<string, AccountActivity> {
  const result: Record<string, AccountActivity> = {};
  for (const movement of movements) {
    if (!isInRange(movement, range)) continue;
    const kind = movementKind(movement as never);
    if (kind === "transfer") continue;
    const id = idOf(movement.account as never);
    if (!id) continue;
    const row = (result[id] ??= { incomes: 0, spending: 0, count: 0 });
    const amount = nativeAmountOf(movement);
    if (kind === "expense") row.spending += amount;
    else row.incomes += amount;
    row.count += 1;
  }
  for (const row of Object.values(result)) {
    row.incomes = Math.round(row.incomes * 100) / 100;
    row.spending = Math.round(row.spending * 100) / 100;
  }
  return result;
}

// A stable pair of colors for an account's card (the web picks two random ones; here the same account always
// looks the same). The second hue sits a little further along the color wheel.
export function accountGradient(seed: string): [string, string] {
  let hash = 0;
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  const hue = hash % 360;
  return [hslToHex(hue, 62, 42), hslToHex((hue + 48) % 360, 70, 52)];
}
