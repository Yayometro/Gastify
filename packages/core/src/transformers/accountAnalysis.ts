import { idOf } from "../categories/categoryForm";
import { nativeAmountOf } from "../accounts/accountActivity";
import { movementKind, type MonthBounds } from "../transactions/monthSummary";
import { movementTime } from "../transactions/historyWindow";
import type { RatesToPrimary } from "./budgetCurrency";
import { getPrimaryAmount } from "./transactionsChange";

// How the accounts compare with each other: where the money is, which account spends and which one earns, what each one
// did in the period and how every balance moved month by month. Pure: the screens only draw what this returns.
// Balances are in the primary currency (an account in another currency is converted with today's rate); what an account
// spent or earned uses each movement's own primary amount, like the rest of the analyzer. Transfers are neither spending
// nor income: they only move money from one account to another.

export interface AnalysisAccount {
  _id?: unknown;
  name?: string;
  amount?: number | string | null;
  currency?: string | null;
  accountType?: string;
  bankId?: string | null;
}

export interface AnalysisMovement {
  date?: unknown;
  createdAt?: unknown;
  kind?: string;
  isBill?: boolean;
  amount?: number | string | null;
  account?: unknown;
  category?: unknown;
  transferDirection?: string | null;
  displayMoney?: unknown;
  [key: string]: unknown;
}

export interface AccountPeriodRow {
  id: string;
  name: string;
  currency: string;
  accountType: string;
  bankId: string | null;
  // Balance in the primary currency (null when the currency has no rate yet).
  balance: number | null;
  income: number;
  expense: number;
  net: number;
  count: number;
  // Shares of the whole (0..1): of the money held, of the period's spending and of the period's income.
  balanceShare: number;
  expenseShare: number;
  incomeShare: number;
  topCategory: { name: string; amount: number } | null;
}

export interface BalancePoint {
  // First day of the month, "YYYY-MM-01".
  month: string;
  byAccount: Record<string, number>;
  total: number;
}

export interface AccountAnalysis {
  accounts: AccountPeriodRow[];
  richest: AccountPeriodRow | null;
  topSpender: AccountPeriodRow | null;
  topEarner: AccountPeriodRow | null;
  // The richest account holds more than this share of the money (and there is more than one account).
  concentrated: boolean;
  balanceSeries: BalancePoint[];
  totalBalance: number;
  debtTotal: number;
  dormant: { id: string; name: string; daysSince: number | null }[];
  missingCurrencies: string[];
}

export const CONCENTRATION_SHARE = 0.7;
export const DORMANT_DAYS = 60;

const DAY = 86_400_000;
const round2 = (value: number): number => Math.round(value * 100) / 100;

function categoryName(category: unknown): string {
  const name = (category as { name?: unknown } | null | undefined)?.name;
  return typeof name === "string" ? name : "";
}

// +amount when the movement puts money in the account, -amount when it takes it out (in the account's own currency).
function signedNative(movement: AnalysisMovement): number {
  const amount = nativeAmountOf(movement);
  const kind = movementKind(movement as never);
  if (kind === "transfer") return movement.transferDirection === "in" ? amount : movement.transferDirection === "out" ? -amount : movement.isBill ? -amount : amount;
  return kind === "expense" ? -amount : amount;
}

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-01`;
}

export interface BuildAccountAnalysisInput {
  accounts: AnalysisAccount[];
  movements: AnalysisMovement[];
  range: MonthBounds;
  primary: string;
  rates: RatesToPrimary | null | undefined;
  // How many months the balance history covers, ending in the month of the range's end (or today, if earlier).
  months?: number;
  today?: Date;
}

export function buildAccountAnalysis({ accounts, movements, range, primary, rates, months = 6, today = new Date() }: BuildAccountAnalysisInput): AccountAnalysis {
  const rateOf = (currency: string): number | null => (currency === primary ? 1 : rates?.[currency] && (rates[currency] as number) > 0 ? (rates[currency] as number) : null);
  const missing = new Set<string>();
  const startMs = range.start.getTime();
  const endMs = range.end.getTime();

  const rows = new Map<string, AccountPeriodRow>();
  const byCategory = new Map<string, Map<string, number>>();
  for (const account of accounts) {
    const id = idOf(account);
    if (!id) continue;
    const currency = account.currency || primary;
    const rate = rateOf(currency);
    if (rate === null) missing.add(currency);
    rows.set(id, {
      id,
      name: account.name || "",
      currency,
      accountType: account.accountType || "debit",
      bankId: account.bankId ?? null,
      balance: rate === null ? null : round2((Number(account.amount) || 0) * rate),
      income: 0,
      expense: 0,
      net: 0,
      count: 0,
      balanceShare: 0,
      expenseShare: 0,
      incomeShare: 0,
      topCategory: null,
    });
  }

  const lastMovementAt = new Map<string, number>();
  for (const movement of movements) {
    const id = idOf(movement.account);
    const row = rows.get(id);
    if (!row) continue;
    const time = movementTime(movement);
    if (time === null) continue;
    if (time > (lastMovementAt.get(id) ?? -Infinity)) lastMovementAt.set(id, time);
    if (time < startMs || time > endMs) continue;
    const kind = movementKind(movement as never);
    if (kind === "transfer") continue;
    const amount = Math.abs(getPrimaryAmount(movement));
    row.count += 1;
    if (kind === "expense") {
      row.expense += amount;
      const name = categoryName(movement.category);
      if (name) {
        const perCategory = byCategory.get(id) ?? new Map<string, number>();
        perCategory.set(name, (perCategory.get(name) ?? 0) + amount);
        byCategory.set(id, perCategory);
      }
    } else row.income += amount;
  }

  const list = [...rows.values()];
  const totalExpense = list.reduce((sum, row) => sum + row.expense, 0);
  const totalIncome = list.reduce((sum, row) => sum + row.income, 0);
  const held = list.reduce((sum, row) => sum + Math.max(0, row.balance ?? 0), 0);
  for (const row of list) {
    row.income = round2(row.income);
    row.expense = round2(row.expense);
    row.net = round2(row.income - row.expense);
    row.balanceShare = held > 0 ? Math.max(0, row.balance ?? 0) / held : 0;
    row.expenseShare = totalExpense > 0 ? row.expense / totalExpense : 0;
    row.incomeShare = totalIncome > 0 ? row.income / totalIncome : 0;
    const perCategory = byCategory.get(row.id);
    if (perCategory) {
      const [name, amount] = [...perCategory.entries()].sort((a, b) => b[1] - a[1])[0];
      row.topCategory = { name, amount: round2(amount) };
    }
  }

  // The highest one wins; on a tie, the first account in the list.
  const best = (pick: (row: AccountPeriodRow) => number): AccountPeriodRow | null => {
    let found: AccountPeriodRow | null = null;
    for (const row of list) if (pick(row) > 0 && (!found || pick(row) > pick(found))) found = row;
    return found;
  };
  const richest = best((row) => row.balance ?? 0);
  const topSpender = best((row) => row.expense);
  const topEarner = best((row) => row.income);

  // Balance history: today's balance minus everything that happened after the moment, month by month, ending today (or at
  // the range's end when that is earlier). The last point is exactly today's balance when nothing is dated in the future.
  const horizon = new Date(Math.min(endMs, today.getTime()));
  const points: BalancePoint[] = [];
  const signed = new Map<string, { time: number; delta: number }[]>();
  for (const movement of movements) {
    const id = idOf(movement.account);
    if (!rows.has(id)) continue;
    const time = movementTime(movement);
    if (time === null) continue;
    const bucket = signed.get(id) ?? [];
    bucket.push({ time, delta: signedNative(movement) });
    signed.set(id, bucket);
  }
  for (let back = months - 1; back >= 0; back--) {
    const monthStart = new Date(horizon.getFullYear(), horizon.getMonth() - back, 1);
    const monthEnd = back === 0 ? horizon.getTime() : new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0, 23, 59, 59, 999).getTime();
    const byAccount: Record<string, number> = {};
    let total = 0;
    for (const account of accounts) {
      const id = idOf(account);
      const row = rows.get(id);
      if (!row || row.balance === null) continue;
      const rate = rateOf(row.currency) as number;
      const after = (signed.get(id) ?? []).reduce((sum, item) => (item.time > monthEnd ? sum + item.delta : sum), 0);
      const value = round2(((Number(account.amount) || 0) - after) * rate);
      byAccount[id] = value;
      total += value;
    }
    points.push({ month: monthKey(monthStart), byAccount, total: round2(total) });
  }

  const debtTotal = round2(list.filter((row) => (row.balance ?? 0) < 0).reduce((sum, row) => sum - (row.balance ?? 0), 0));
  const dormant = list
    .map((row) => {
      const last = lastMovementAt.get(row.id);
      return { id: row.id, name: row.name, daysSince: last === undefined ? null : Math.floor((today.getTime() - last) / DAY) };
    })
    .filter((item) => item.daysSince === null || item.daysSince >= DORMANT_DAYS);

  return {
    accounts: list,
    richest,
    topSpender,
    topEarner,
    concentrated: list.length > 1 && richest !== null && richest.balanceShare > CONCENTRATION_SHARE,
    balanceSeries: points,
    totalBalance: round2(list.reduce((sum, row) => sum + (row.balance ?? 0), 0)),
    debtTotal,
    dormant,
    missingCurrencies: [...missing],
  };
}
