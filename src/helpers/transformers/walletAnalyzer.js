import {
  getPrimaryAmount,
  getTransactionsFromTimeRange,
  filterBillsOrIncomes,
  orderItemsInRelativeMonth,
} from "./transactionsChange";
import { buildBudgetHistoricalComparative } from "./budgetHistoricalComparative";
import { months } from "../timeFunctions/timeFunctions";

// All range helpers build explicit start-of-day/end-of-day boundaries
// themselves (not via getLastDayOfMonth, which returns midnight) - a range
// end at midnight would silently exclude same-day transactions with a
// later time component.
export function getMonthRange(referenceDate) {
  const d = new Date(referenceDate);
  const start = new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

export function getPreviousMonthRange(referenceDate) {
  const d = new Date(referenceDate);
  return getMonthRange(new Date(d.getFullYear(), d.getMonth() - 1, 1));
}

// 1. Income / expense / balance / savings-rate for one month.
export function getMonthTotals(transactions, monthStart, monthEnd) {
  const monthTx = getTransactionsFromTimeRange(transactions, monthStart, monthEnd);
  const { incomes, bills } = filterBillsOrIncomes(monthTx);
  const income = incomes.reduce((a, t) => a + getPrimaryAmount(t), 0);
  const expense = bills.reduce((a, t) => a + getPrimaryAmount(t), 0);
  const balance = income - expense;
  return { income, expense, balance, savingsRate: income > 0 ? balance / income : 0, transactionCount: bills.length };
}

// Sums per-category spend for a single range and returns the sorted/
// sliced top-N - the independent (non-comparative) ranking used to show
// a month's own top-12 categories side by side with another month's,
// mirroring how top transactions already work (two independent top-N
// lists, not one merged comparison row).
export function rankCategoriesForRange(transactions, isBill, range, topN = 12) {
  const tx = getTransactionsFromTimeRange(transactions, range.start, range.end);
  const set = isBill ? filterBillsOrIncomes(tx).bills : filterBillsOrIncomes(tx).incomes;
  const map = new Map();
  set.forEach((t) => {
    const name = t.category?.name || "No category";
    if (!map.has(name)) {
      map.set(name, { name, color: t.category?.color || "#ABABAB", icon: t.category?.icon || "MdFilterNone", amount: 0 });
    }
    map.get(name).amount += getPrimaryAmount(t);
  });
  return Array.from(map.values())
    .sort((a, b) => b.amount - a.amount)
    .slice(0, topN);
}

// Raw transaction docs for one category in one range - feeds the
// existing ModalContentTopMonthItem drill-down modal's `children`.
export function getCategoryTransactions(transactions, categoryName, isBill, range) {
  const tx = getTransactionsFromTimeRange(transactions, range.start, range.end);
  const set = isBill ? filterBillsOrIncomes(tx).bills : filterBillsOrIncomes(tx).incomes;
  return set.filter((t) => (t.category?.name || "No category") === categoryName);
}

// Same as getCategoryTransactions, but for one subcategory.
export function getSubcategoryTransactions(transactions, subcategoryName, isBill, range) {
  const tx = getTransactionsFromTimeRange(transactions, range.start, range.end);
  const set = isBill ? filterBillsOrIncomes(tx).bills : filterBillsOrIncomes(tx).incomes;
  return set.filter((t) => t.subCategory?.name === subcategoryName);
}

// 2. Top categories by current-month spend, each compared against the same
// category's previous-month total. `isNew` marks a category with nothing
// in the previous month at all (not just a dip to zero).
export function compareCategoriesAcrossMonths(transactions, isBill, currentRange, previousRange, topN = 12) {
  const sumByCategory = (range) => {
    const tx = getTransactionsFromTimeRange(transactions, range.start, range.end);
    const set = isBill ? filterBillsOrIncomes(tx).bills : filterBillsOrIncomes(tx).incomes;
    const map = new Map();
    set.forEach((t) => {
      const name = t.category?.name || "No category";
      if (!map.has(name)) {
        map.set(name, { name, color: t.category?.color || "#ABABAB", icon: t.category?.icon || "MdFilterNone", value: 0 });
      }
      map.get(name).value += getPrimaryAmount(t);
    });
    return map;
  };

  const currentMap = sumByCategory(currentRange);
  const previousMap = sumByCategory(previousRange);

  return Array.from(currentMap.values())
    .map((c) => {
      const previous = previousMap.get(c.name)?.value || 0;
      return {
        name: c.name,
        color: c.color,
        icon: c.icon,
        current: c.value,
        previous,
        changePct: previous > 0 ? ((c.value - previous) / previous) * 100 : null,
        isNew: previous === 0,
      };
    })
    .sort((a, b) => b.current - a.current)
    .slice(0, topN);
}

// A category's trailing-N-month average (excluding the reference month
// itself) - used to flag "spent way more than usual" independently of the
// single-month-over-single-month comparison above, which can't tell a
// one-off dip in an otherwise-typical previous month from a real trend.
export function computeCategoryHistoryAverage(transactions, categoryName, isBill, referenceDate, monthsBack = 6) {
  const ref = new Date(referenceDate);
  const monthlyTotals = [];
  const monthlyTotalsLabeled = [];
  for (let m = monthsBack; m >= 1; m--) {
    const monthDate = new Date(ref.getFullYear(), ref.getMonth() - m, 1);
    const { start, end } = getMonthRange(monthDate);
    const tx = getTransactionsFromTimeRange(transactions, start, end);
    const set = isBill ? filterBillsOrIncomes(tx).bills : filterBillsOrIncomes(tx).incomes;
    const total = set
      .filter((t) => (t.category?.name || "No category") === categoryName)
      .reduce((a, t) => a + getPrimaryAmount(t), 0);
    monthlyTotals.push(total);
    monthlyTotalsLabeled.push({ label: `${months[monthDate.getMonth()]} ${monthDate.getFullYear()}`, amount: total });
  }
  const monthsOfHistory = monthlyTotals.filter((v) => v > 0).length;
  const average = monthlyTotals.reduce((a, b) => a + b, 0) / (monthlyTotals.length || 1);
  return { average, monthsOfHistory, monthlyTotals: monthlyTotalsLabeled };
}

// 3. Top individual transactions for the current month and, separately,
// the previous month - transactions don't repeat month to month the way
// categories do, so this is two independent top-N lists, not a joined one.
export function compareTransactionsAcrossMonths(transactions, isBill, currentRange, previousRange, topN = 12) {
  const build = (range) => {
    const tx = getTransactionsFromTimeRange(transactions, range.start, range.end);
    const set = isBill ? filterBillsOrIncomes(tx).bills : filterBillsOrIncomes(tx).incomes;
    return set
      .map((t) => ({
        _id: t._id,
        name: t.name || "Transaction",
        categoryName: t.category?.name || "No category",
        subcategoryName: t.subCategory?.name || null,
        amount: getPrimaryAmount(t),
        date: t.date || t.createdAt,
        color: t.category?.color || "#ABABAB",
        icon: t.category?.icon || "MdFilterNone",
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, topN);
  };
  return { current: build(currentRange), previous: build(previousRange) };
}

// 4. Income vs. expense for the trailing N months (oldest -> newest,
// reference month last), for the trend chart. Reuses
// orderItemsInRelativeMonth (already used by the Top-elements compare
// table) instead of re-deriving month-bucketing from scratch.
export function computeTrend(transactions, referenceDate, monthsBack = 6) {
  const ref = new Date(referenceDate);
  const rangeStart = new Date(ref.getFullYear(), ref.getMonth() - (monthsBack - 1), 1);
  const rangeEnd = new Date(ref.getFullYear(), ref.getMonth() + 1, 0, 23, 59, 59, 999);
  const windowTx = getTransactionsFromTimeRange(transactions, rangeStart, rangeEnd);
  const { incomes, bills } = filterBillsOrIncomes(windowTx);
  const incomeByIndex = new Map(orderItemsInRelativeMonth(incomes, rangeStart).map((b) => [b.index, b.value]));
  const expenseBuckets = orderItemsInRelativeMonth(bills, rangeStart);
  const expenseByIndex = new Map(expenseBuckets.map((b) => [b.index, b.value]));
  const expenseCountByIndex = new Map(expenseBuckets.map((b) => [b.index, b.childrens.length]));

  const result = [];
  for (let i = 0; i < monthsBack; i++) {
    const monthDate = new Date(rangeStart.getFullYear(), rangeStart.getMonth() + i, 1);
    result.push({
      label: `${months[monthDate.getMonth()]} ${monthDate.getFullYear()}`,
      income: incomeByIndex.get(i) || 0,
      expense: expenseByIndex.get(i) || 0,
      transactionCount: expenseCountByIndex.get(i) || 0,
    });
  }
  return result;
}

// Average monthly income/expense across the same trend window - reuses
// `trend`'s already-computed whole-month totals instead of re-deriving them.
export function computeMonthlyAverages(trend) {
  const count = trend.length || 1;
  return {
    avgIncome: trend.reduce((a, m) => a + m.income, 0) / count,
    avgExpense: trend.reduce((a, m) => a + m.expense, 0) / count,
    avgTransactionCount: trend.reduce((a, m) => a + m.transactionCount, 0) / count,
    monthsCount: trend.length,
  };
}

// 5. Per-budget streak of consecutive months under limit, ending at the
// reference month. Wraps buildBudgetHistoricalComparative (already
// resolves each month's goal via the budget's history[]) instead of
// re-deriving month-by-month compliance.
export function computeBudgetStreaks(budgets, transactions, referenceDate, lookbackMonths = 12) {
  const ref = new Date(referenceDate);
  const startDate = new Date(ref.getFullYear(), ref.getMonth() - (lookbackMonths - 1), 1);
  const endDate = new Date(ref.getFullYear(), ref.getMonth() + 1, 0, 23, 59, 59, 999);
  const rows = buildBudgetHistoricalComparative({ budgets, transactions, startDate, endDate, today: endDate });

  return rows.map((row) => {
    const series = row.monthlySeries;
    let streakMonths = 0;
    for (let i = series.length - 1; i >= 0; i--) {
      if (!series[i].met) break;
      streakMonths += 1;
    }
    const last = series[series.length - 1] || { actual: 0, goal: 0 };
    const pct = last.goal > 0 ? (last.actual / last.goal) * 100 : 0;
    return {
      category: row.budget.category?.name || row.budget.name || "Budget",
      limit: last.goal,
      spent: last.actual,
      pct,
      streakMonths,
      status: pct > 100 ? "over" : pct > 80 ? "warning" : "ok",
      monthlySeries: series.map((s) => ({ label: s.label, actual: s.actual, goal: s.goal, met: s.met })),
    };
  });
}

// 6. Best-effort recurring-payment detection. There's no recurring/
// subscription field on Transaction - this groups bills by normalized
// name and flags a group as a subscription when it shows up in at least 2
// of the last `lookbackMonths` months with amount variance under 15%.
// `isNew` marks a group with no occurrence before that lookback window,
// within the wider `historyMonths` window.
function normalizeTxName(name) {
  return (name || "").trim().toLowerCase();
}

export function detectSubscriptions(transactions, referenceDate, lookbackMonths = 3, historyMonths = 6) {
  const ref = new Date(referenceDate);
  const historyStart = new Date(ref.getFullYear(), ref.getMonth() - (historyMonths - 1), 1);
  const historyEnd = new Date(ref.getFullYear(), ref.getMonth() + 1, 0, 23, 59, 59, 999);
  const bills = filterBillsOrIncomes(getTransactionsFromTimeRange(transactions, historyStart, historyEnd)).bills;

  const byName = new Map();
  bills.forEach((t) => {
    const key = normalizeTxName(t.name);
    if (!key) return;
    if (!byName.has(key)) byName.set(key, []);
    byName.get(key).push(t);
  });

  const lookbackStart = new Date(ref.getFullYear(), ref.getMonth() - (lookbackMonths - 1), 1);
  const results = [];

  byName.forEach((allTx) => {
    const recentTx = allTx.filter((t) => new Date(t.date || t.createdAt) >= lookbackStart);
    const monthsTouched = new Set(
      recentTx.map((t) => {
        const d = new Date(t.date || t.createdAt);
        return `${d.getFullYear()}-${d.getMonth()}`;
      })
    );
    if (monthsTouched.size < 2) return;

    const amounts = recentTx.map((t) => getPrimaryAmount(t));
    const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const withinVariance = avg > 0 && amounts.every((a) => Math.abs(a - avg) / avg <= 0.15);
    if (!withinVariance) return;

    const isNew = !allTx.some((t) => new Date(t.date || t.createdAt) < lookbackStart);
    const latest = [...recentTx].sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt))[0];
    const occurrences = [...recentTx]
      .sort((a, b) => new Date(a.date || a.createdAt) - new Date(b.date || b.createdAt))
      .map((t) => ({ date: t.date || t.createdAt, amount: getPrimaryAmount(t) }));
    results.push({
      name: latest.name,
      categoryName: latest.category?.name || "No category",
      accountName: latest.account?.name || null,
      amount: avg,
      color: latest.category?.color || "#ABABAB",
      icon: latest.category?.icon || "MdFilterNone",
      isNew,
      occurrences,
    });
  });

  return results.sort((a, b) => b.amount - a.amount);
}

// "Grandes gastos" - a rule-based (no AI) look at the single biggest
// transaction, the category with the highest 12-month total, and the
// subcategory with the highest 12-month total, plus a few deterministic
// checks for whether they're actually related - whether a category's
// total is dominated by one big one-off vs. accumulated from many
// smaller, recurring transactions, and whether tags tie them together.
export function findBiggestSpendPatterns(transactions, referenceDate, monthsBack = 12) {
  const ref = new Date(referenceDate);
  const start = new Date(ref.getFullYear(), ref.getMonth() - (monthsBack - 1), 1, 0, 0, 0, 0);
  const end = new Date(ref.getFullYear(), ref.getMonth() + 1, 0, 23, 59, 59, 999);
  const bills = filterBillsOrIncomes(getTransactionsFromTimeRange(transactions, start, end)).bills;
  if (bills.length === 0) return null;

  const totalSpend = bills.reduce((a, t) => a + getPrimaryAmount(t), 0);

  const biggestTransactionRaw = [...bills].sort((a, b) => getPrimaryAmount(b) - getPrimaryAmount(a))[0];
  const transactionAmount = getPrimaryAmount(biggestTransactionRaw);
  const transactionCategoryName = biggestTransactionRaw.category?.name || "No category";
  const transactionSubcategoryName = biggestTransactionRaw.subCategory?.name || null;

  const byCategory = new Map();
  const byCategoryTagCounts = new Map(); // categoryName -> Map(tagName -> count)
  const bySubcategory = new Map();
  bills.forEach((t) => {
    const catName = t.category?.name || "No category";
    if (!byCategory.has(catName)) {
      byCategory.set(catName, { name: catName, color: t.category?.color || "#ABABAB", icon: t.category?.icon || "MdFilterNone", total: 0 });
    }
    byCategory.get(catName).total += getPrimaryAmount(t);

    if (!byCategoryTagCounts.has(catName)) byCategoryTagCounts.set(catName, new Map());
    (t.tags || []).forEach((tag) => {
      const tagName = tag?.name;
      if (!tagName) return;
      const counts = byCategoryTagCounts.get(catName);
      counts.set(tagName, (counts.get(tagName) || 0) + 1);
    });

    if (t.subCategory?.name) {
      const subName = t.subCategory.name;
      if (!bySubcategory.has(subName)) bySubcategory.set(subName, { name: subName, categoryName: catName, total: 0 });
      bySubcategory.get(subName).total += getPrimaryAmount(t);
    }
  });

  const biggestCategory = [...byCategory.values()].sort((a, b) => b.total - a.total)[0];
  const biggestSubcategory = [...bySubcategory.values()].sort((a, b) => b.total - a.total)[0] || null;

  const categoryTagCounts = byCategoryTagCounts.get(biggestCategory.name);
  const mostCommonCategoryTag = categoryTagCounts && categoryTagCounts.size > 0
    ? [...categoryTagCounts.entries()].sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count }))[0]
    : null;

  const transactionTagNames = (biggestTransactionRaw.tags || []).map((tag) => tag?.name).filter(Boolean);

  // Always measured against the transaction's OWN category total (not
  // necessarily `biggestCategory` - they may differ) - "what fraction of
  // that category's spend is this one transaction" only means something
  // relative to the category it actually belongs to.
  const transactionOwnCategoryTotal = byCategory.get(transactionCategoryName)?.total || 0;

  const analysis = {
    transactionIsInBiggestCategory: transactionCategoryName === biggestCategory.name,
    transactionIsBiggestSubcategory: !!biggestSubcategory && transactionSubcategoryName === biggestSubcategory.name,
    subcategoryBelongsToBiggestCategory: !!biggestSubcategory && biggestSubcategory.categoryName === biggestCategory.name,
    categoryShareOfTotal: totalSpend > 0 ? (biggestCategory.total / totalSpend) * 100 : 0,
    transactionShareOfCategory: transactionOwnCategoryTotal > 0 ? (transactionAmount / transactionOwnCategoryTotal) * 100 : 0,
    transactionSharesTopCategoryTag: !!mostCommonCategoryTag && transactionTagNames.includes(mostCommonCategoryTag.name),
  };

  return {
    biggestTransaction: {
      _id: biggestTransactionRaw._id,
      name: biggestTransactionRaw.name || "Transaction",
      amount: transactionAmount,
      categoryName: transactionCategoryName,
      subcategoryName: transactionSubcategoryName,
      date: biggestTransactionRaw.date || biggestTransactionRaw.createdAt,
      color: biggestTransactionRaw.category?.color || "#ABABAB",
      icon: biggestTransactionRaw.category?.icon || "MdFilterNone",
      tags: transactionTagNames,
    },
    biggestCategory,
    biggestSubcategory,
    mostCommonCategoryTag,
    analysis,
    monthsBack,
    lookbackRange: { start, end },
  };
}

// Per-month version of findBiggestSpendPatterns - instead of one winner
// over the whole window, this is "who won each month", so a click on
// "Grandes gastos" can first show the evidence (12 months side by side)
// before drilling into any single month's actual transactions. Category/
// subcategory `pctOfWindowTotal` is still measured against the *whole*
// 12-month total (not that month's own total), so the 12 rows are
// directly comparable to each other and to findBiggestSpendPatterns'
// own categoryShareOfTotal.
export function computeMonthlyChampions(transactions, referenceDate, monthsBack = 12) {
  const ref = new Date(referenceDate);
  const windowStart = new Date(ref.getFullYear(), ref.getMonth() - (monthsBack - 1), 1, 0, 0, 0, 0);
  const windowEnd = new Date(ref.getFullYear(), ref.getMonth() + 1, 0, 23, 59, 59, 999);
  const windowBills = filterBillsOrIncomes(getTransactionsFromTimeRange(transactions, windowStart, windowEnd)).bills;
  const windowTotal = windowBills.reduce((a, t) => a + getPrimaryAmount(t), 0);

  const monthEntries = [];
  for (let m = monthsBack - 1; m >= 0; m--) {
    const monthDate = new Date(ref.getFullYear(), ref.getMonth() - m, 1);
    const range = getMonthRange(monthDate);
    const label = `${months[monthDate.getMonth()]} ${monthDate.getFullYear()}`;
    const bills = filterBillsOrIncomes(getTransactionsFromTimeRange(transactions, range.start, range.end)).bills;

    if (bills.length === 0) {
      monthEntries.push({ label, range, biggestTransaction: null, biggestCategory: null, biggestSubcategory: null });
      continue;
    }

    const biggestTransactionRaw = [...bills].sort((a, b) => getPrimaryAmount(b) - getPrimaryAmount(a))[0];

    const byCategory = new Map();
    const bySubcategory = new Map();
    bills.forEach((t) => {
      const catName = t.category?.name || "No category";
      if (!byCategory.has(catName)) {
        byCategory.set(catName, { name: catName, color: t.category?.color || "#ABABAB", icon: t.category?.icon || "MdFilterNone", total: 0 });
      }
      byCategory.get(catName).total += getPrimaryAmount(t);
      if (t.subCategory?.name) {
        const subName = t.subCategory.name;
        if (!bySubcategory.has(subName)) {
          bySubcategory.set(subName, {
            name: subName,
            categoryName: catName,
            categoryColor: t.category?.color || "#ABABAB",
            categoryIcon: t.category?.icon || "MdFilterNone",
            total: 0,
          });
        }
        bySubcategory.get(subName).total += getPrimaryAmount(t);
      }
    });
    const biggestCategoryRaw = [...byCategory.values()].sort((a, b) => b.total - a.total)[0];
    const biggestSubcategoryRaw = [...bySubcategory.values()].sort((a, b) => b.total - a.total)[0] || null;

    monthEntries.push({
      label,
      range,
      biggestTransaction: {
        _id: biggestTransactionRaw._id,
        name: biggestTransactionRaw.name || "Transaction",
        amount: getPrimaryAmount(biggestTransactionRaw),
        categoryName: biggestTransactionRaw.category?.name || "No category",
        date: biggestTransactionRaw.date || biggestTransactionRaw.createdAt,
        color: biggestTransactionRaw.category?.color || "#ABABAB",
        icon: biggestTransactionRaw.category?.icon || "MdFilterNone",
      },
      biggestCategory: {
        ...biggestCategoryRaw,
        pctOfWindowTotal: windowTotal > 0 ? (biggestCategoryRaw.total / windowTotal) * 100 : 0,
      },
      biggestSubcategory: biggestSubcategoryRaw
        ? { ...biggestSubcategoryRaw, pctOfWindowTotal: windowTotal > 0 ? (biggestSubcategoryRaw.total / windowTotal) * 100 : 0 }
        : null,
    });
  }

  return { months: monthEntries, windowTotal, monthsBack };
}

// 7. How this month's spend-through-today compares to the same
// day-of-month average over the trailing lookback months. `referenceDate`
// is normally day-1-anchored by the caller (it doubles as "which month"),
// so it can't supply "today" itself - `today` is a separate, explicit,
// defaultable param (same convention as buildBudgetHistoricalComparative's
// `today`) so this stays deterministic for tests instead of reaching for
// `new Date()` internally. When the reference month IS the real current
// month, pace runs through today's actual date; for an already-elapsed
// past month it runs through that month's last day (a full-month
// comparison), since "today" has no meaning there.
export function computeSpendingPace(transactions, referenceDate, isBill = true, lookbackMonths = 6, today = new Date()) {
  const ref = new Date(referenceDate);
  const isCurrentMonth = ref.getFullYear() === today.getFullYear() && ref.getMonth() === today.getMonth();
  const lastDayOfRefMonth = new Date(ref.getFullYear(), ref.getMonth() + 1, 0).getDate();
  const dayOfMonth = isCurrentMonth ? today.getDate() : lastDayOfRefMonth;
  const { start: monthStart } = getMonthRange(ref);
  const soFarEnd = new Date(ref.getFullYear(), ref.getMonth(), dayOfMonth, 23, 59, 59, 999);
  const currentSet = isBill
    ? filterBillsOrIncomes(getTransactionsFromTimeRange(transactions, monthStart, soFarEnd)).bills
    : filterBillsOrIncomes(getTransactionsFromTimeRange(transactions, monthStart, soFarEnd)).incomes;
  const spentSoFar = currentSet.reduce((a, t) => a + getPrimaryAmount(t), 0);

  const pastPaces = [];
  const monthlyDetail = [];
  for (let m = lookbackMonths; m >= 1; m--) {
    const pastMonthDate = new Date(ref.getFullYear(), ref.getMonth() - m, 1);
    const lastDayOfPastMonth = new Date(pastMonthDate.getFullYear(), pastMonthDate.getMonth() + 1, 0).getDate();
    const cappedDay = Math.min(dayOfMonth, lastDayOfPastMonth);
    const pastStart = new Date(pastMonthDate.getFullYear(), pastMonthDate.getMonth(), 1, 0, 0, 0, 0);
    const pastEnd = new Date(pastMonthDate.getFullYear(), pastMonthDate.getMonth(), cappedDay, 23, 59, 59, 999);
    const pastSet = isBill
      ? filterBillsOrIncomes(getTransactionsFromTimeRange(transactions, pastStart, pastEnd)).bills
      : filterBillsOrIncomes(getTransactionsFromTimeRange(transactions, pastStart, pastEnd)).incomes;
    const amount = pastSet.reduce((a, t) => a + getPrimaryAmount(t), 0);
    pastPaces.push(amount);
    monthlyDetail.push({ label: `${months[pastMonthDate.getMonth()]} ${pastMonthDate.getFullYear()}`, throughDay: cappedDay, amount });
  }
  const avgPaceForSameDay = pastPaces.length > 0 ? pastPaces.reduce((a, b) => a + b, 0) / pastPaces.length : 0;
  return {
    spentSoFar,
    avgPaceForSameDay,
    deltaPct: avgPaceForSameDay > 0 ? ((spentSoFar - avgPaceForSameDay) / avgPaceForSameDay) * 100 : null,
    dayOfMonth,
    monthlyDetail,
  };
}

const WEEKDAY_NAMES = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const WEEKDAY_PLURAL = { Lunes: "lunes", Martes: "martes", Miércoles: "miércoles", Jueves: "jueves", Viernes: "viernes", Sábado: "sábados", Domingo: "domingos" };

// JS Date#getDay(): 0=Sunday..6=Saturday. Remapped to a Monday-first index
// (0=Monday..6=Sunday) so a calendar week reads left-to-right naturally.
function mondayFirstIndex(jsDay) {
  return (jsDay + 6) % 7;
}

// Which weekdays this month's spending skews toward - scoped to the
// current reference month only (not a multi-month average), so it reads
// as "this month's pattern" rather than a long-run claim. Compares
// `avgPerOccurrence` (total / how many of that weekday actually fell in
// this month), not raw totals, since a month has 4 or 5 of each weekday
// unevenly - raw totals would unfairly favor whichever weekday occurs
// one extra time.
export function computeSpendingByWeekday(transactions, referenceDate) {
  const ref = new Date(referenceDate);
  const { start, end } = getMonthRange(ref);
  const bills = filterBillsOrIncomes(getTransactionsFromTimeRange(transactions, start, end)).bills;

  const totals = new Array(7).fill(0);
  const counts = new Array(7).fill(0);
  bills.forEach((t) => {
    const idx = mondayFirstIndex(new Date(t.date || t.createdAt).getDay());
    totals[idx] += getPrimaryAmount(t);
    counts[idx] += 1;
  });

  const occurrences = new Array(7).fill(0);
  const lastDay = new Date(ref.getFullYear(), ref.getMonth() + 1, 0).getDate();
  for (let day = 1; day <= lastDay; day++) {
    occurrences[mondayFirstIndex(new Date(ref.getFullYear(), ref.getMonth(), day).getDay())] += 1;
  }

  const days = WEEKDAY_NAMES.map((dayName, i) => ({
    dayIndex: i,
    dayName,
    total: totals[i],
    count: counts[i],
    occurrences: occurrences[i],
    avgPerOccurrence: occurrences[i] > 0 ? totals[i] / occurrences[i] : 0,
  }));

  const hasAnySpend = totals.some((t) => t > 0);
  const weekdayDays = days.slice(0, 5);
  const weekendDays = days.slice(5);
  const weekdayAvg = weekdayDays.reduce((a, d) => a + d.avgPerOccurrence, 0) / weekdayDays.length;
  const weekendAvg = weekendDays.reduce((a, d) => a + d.avgPerOccurrence, 0) / weekendDays.length;
  const overallMean = days.reduce((a, d) => a + d.avgPerOccurrence, 0) / days.length;

  // A single day dominating every other day individually is a sharper,
  // more useful claim than a broad weekday/weekend split - checked first
  // so it isn't drowned out by that split trivially being "true" whenever
  // the other category happens to be $0 (e.g. all spend falls on one
  // Wednesday: weekday avg > weekend avg is technically true, but "los
  // miércoles" is the actual story).
  const sortedByAvg = [...days].sort((a, b) => b.avgPerOccurrence - a.avgPerOccurrence);
  const standout = sortedByAvg[0];
  const runnerUp = sortedByAvg[1];

  let insight;
  if (!hasAnySpend) {
    insight = "Sin gastos este mes para detectar un patrón.";
  } else if (standout.avgPerOccurrence > 0 && (runnerUp.avgPerOccurrence === 0 || standout.avgPerOccurrence > runnerUp.avgPerOccurrence * 1.5)) {
    insight = `Los ${WEEKDAY_PLURAL[standout.dayName]} destacan como tu día de mayor gasto este mes.`;
  } else if (weekendAvg > weekdayAvg * 1.2) {
    insight = "Sueles gastar más los fines de semana este mes.";
  } else if (weekdayAvg > weekendAvg * 1.2) {
    insight = "Sueles gastar más entre semana este mes.";
  } else if (overallMean > 0 && standout.avgPerOccurrence > overallMean * 1.3) {
    insight = `Los ${WEEKDAY_PLURAL[standout.dayName]} destacan como tu día de mayor gasto este mes.`;
  } else {
    insight = "Sin un patrón claro por día de la semana este mes.";
  }

  // Day-by-day and week-by-week breakdowns, for the detail modal - "why
  // did the app conclude this" needs the actual daily numbers, not just
  // the 7-bucket weekday averages above.
  const dailyTotalsByDay = new Map();
  for (let day = 1; day <= lastDay; day++) dailyTotalsByDay.set(day, { total: 0, count: 0 });
  bills.forEach((t) => {
    const d = new Date(t.date || t.createdAt);
    const entry = dailyTotalsByDay.get(d.getDate());
    if (entry) {
      entry.total += getPrimaryAmount(t);
      entry.count += 1;
    }
  });
  const dailyBreakdown = [];
  for (let day = 1; day <= lastDay; day++) {
    const jsDay = new Date(ref.getFullYear(), ref.getMonth(), day).getDay();
    const { total, count } = dailyTotalsByDay.get(day);
    dailyBreakdown.push({ dayOfMonth: day, dayName: WEEKDAY_NAMES[mondayFirstIndex(jsDay)], total, count });
  }

  // Simple day-range weeks (1-7, 8-14, ...) rather than calendar weeks,
  // so every month cleanly splits into ~4 weeks plus a short tail instead
  // of partial weeks bleeding into neighboring months.
  const weeks = [];
  for (let weekStart = 1; weekStart <= lastDay; weekStart += 7) {
    const weekEnd = Math.min(weekStart + 6, lastDay);
    const weekDays = dailyBreakdown.filter((d) => d.dayOfMonth >= weekStart && d.dayOfMonth <= weekEnd);
    weeks.push({
      label: `Días ${weekStart}-${weekEnd}`,
      startDay: weekStart,
      endDay: weekEnd,
      total: weekDays.reduce((a, d) => a + d.total, 0),
      count: weekDays.reduce((a, d) => a + d.count, 0),
    });
  }

  return { days, insight, weekdayAvg, weekendAvg, overallMean, weeks, dailyBreakdown };
}

// 8. Rule-based highlight cards - deliberately NOT an LLM call: every
// number here is already computed exactly, so a template just has to word
// it, not derive it. Ranked warnings-first, capped so the strip stays
// scannable.
const INSIGHT_PRIORITY = { warning: 0, positive: 1, info: 2 };

// Insights carry `type`/`data` (raw facts) instead of a pre-baked string -
// currency formatting needs `walletPrimaryCurrency`, which this
// currency-agnostic transformer layer intentionally doesn't know about.
// The View renders both the card's one-line detail AND the "why" modal's
// expanded breakdown from this same `data`, keyed by `type`.
export function generateInsights(facts) {
  const insights = [];

  const worstBudget = facts.budgetRows.find((b) => b.status === "over");
  if (worstBudget) {
    insights.push({
      icon: "⚠️",
      tone: "warning",
      title: `${worstBudget.category} superó su presupuesto`,
      type: "budget",
      data: worstBudget,
    });
  }

  if (facts.categoryAnomaly) {
    const { changePct } = facts.categoryAnomaly;
    insights.push({
      icon: changePct >= 0 ? "🔥" : "🧊",
      tone: changePct >= 0 ? "warning" : "positive",
      title: `${facts.categoryAnomaly.name} ${changePct >= 0 ? "+" : ""}${Math.round(changePct)}% vs. tu promedio`,
      type: "category_anomaly",
      data: facts.categoryAnomaly,
    });
  }

  const newCategory = facts.topCategoriesBills.find((c) => c.isNew && c.current > 0);
  if (newCategory) {
    insights.push({
      icon: "🆕",
      tone: "info",
      title: `Nueva categoría: ${newCategory.name}`,
      type: "new_category",
      data: newCategory,
    });
  }

  const newSubscription = facts.subscriptions.find((s) => s.isNew);
  if (newSubscription) {
    insights.push({
      icon: "🆕",
      tone: "info",
      title: `Nueva suscripción: ${newSubscription.name}`,
      type: "subscription",
      data: newSubscription,
    });
  }

  const bestStreak = [...facts.budgetRows].sort((a, b) => b.streakMonths - a.streakMonths)[0];
  if (bestStreak && bestStreak.streakMonths >= 2) {
    insights.push({
      icon: "📈",
      tone: "positive",
      title: `Racha de ${bestStreak.streakMonths} meses en ${bestStreak.category}`,
      type: "budget",
      data: bestStreak,
    });
  }

  if (facts.savingsHistory.length >= 3) {
    const current = facts.savingsHistory[0];
    const rest = facts.savingsHistory.slice(1);
    const max = Math.max(...rest);
    const min = Math.min(...rest);
    if (current >= max && current > 0) {
      insights.push({
        icon: "💰",
        tone: "positive",
        title: `Mejor tasa de ahorro en ${facts.savingsHistory.length} meses`,
        type: "savings_rate",
        data: { currentRate: current, savingsHistoryLabeled: facts.savingsHistoryLabeled },
      });
    } else if (current <= min) {
      insights.push({
        icon: "📉",
        tone: "warning",
        title: `Tasa de ahorro más baja en ${facts.savingsHistory.length} meses`,
        type: "savings_rate",
        data: { currentRate: current, savingsHistoryLabeled: facts.savingsHistoryLabeled },
      });
    }
  }

  return insights.sort((a, b) => INSIGHT_PRIORITY[a.tone] - INSIGHT_PRIORITY[b.tone]).slice(0, 5);
}

// Orchestrator - composes every sync computation above into one snapshot.
// FX exposure isn't included here: it needs network calls (fx/quote), so
// it's computed separately by a hook the component calls alongside this.
export function buildWalletAnalyzerSnapshot({ transactions, budgets, referenceDate, today = new Date(), topN = 12 }) {
  const ref = new Date(referenceDate);
  const currentRange = getMonthRange(ref);
  const previousRange = getPreviousMonthRange(ref);

  const currentTotals = getMonthTotals(transactions, currentRange.start, currentRange.end);
  const previousTotals = getMonthTotals(transactions, previousRange.start, previousRange.end);

  const topCategoriesBills = compareCategoriesAcrossMonths(transactions, true, currentRange, previousRange, topN);
  const topCategoriesIncomes = compareCategoriesAcrossMonths(transactions, false, currentRange, previousRange, topN);
  const topCategoriesBillsPrevious = rankCategoriesForRange(transactions, true, previousRange, topN);
  const topTransactionsBills = compareTransactionsAcrossMonths(transactions, true, currentRange, previousRange, topN);

  const trend = computeTrend(transactions, ref, 6);
  const monthlyAverages = computeMonthlyAverages(trend);
  const budgetRows = computeBudgetStreaks(budgets, transactions, ref, 12);
  const subscriptions = detectSubscriptions(transactions, ref, 3, 6);
  const pace = computeSpendingPace(transactions, ref, true, 6, today);
  const biggestSpendPatterns = findBiggestSpendPatterns(transactions, ref, 12);
  const monthlyChampions = computeMonthlyChampions(transactions, ref, 12);
  const weekdaySpending = computeSpendingByWeekday(transactions, ref);

  const savingsHistory = [];
  const savingsHistoryLabeled = [];
  for (let m = 0; m < 6; m++) {
    const monthDate = new Date(ref.getFullYear(), ref.getMonth() - m, 1);
    const { start, end } = getMonthRange(monthDate);
    const rate = getMonthTotals(transactions, start, end).savingsRate;
    savingsHistory.push(rate);
    savingsHistoryLabeled.unshift({ label: `${months[monthDate.getMonth()]} ${monthDate.getFullYear()}`, rate });
  }

  // Among the top few categories, whichever deviates most (in either
  // direction) from its own trailing average is the one worth calling out
  // - not necessarily whichever spends the most in absolute terms.
  let categoryAnomaly = null;
  topCategoriesBills.slice(0, 5).forEach((c) => {
    const { average, monthsOfHistory, monthlyTotals } = computeCategoryHistoryAverage(transactions, c.name, true, ref, 6);
    if (average <= 0 || monthsOfHistory < 3) return;
    const changePct = ((c.current - average) / average) * 100;
    if (!categoryAnomaly || Math.abs(changePct) > Math.abs(categoryAnomaly.changePct)) {
      if (Math.abs(changePct) >= 25) {
        categoryAnomaly = { name: c.name, current: c.current, average, changePct, monthlyTotals };
      }
    }
  });

  const facts = {
    currentTotals,
    previousTotals,
    topCategoriesBills,
    topCategoriesIncomes,
    topCategoriesBillsPrevious,
    topTransactionsBills,
    trend,
    monthlyAverages,
    budgetRows,
    subscriptions,
    pace,
    biggestSpendPatterns,
    monthlyChampions,
    weekdaySpending,
    savingsHistory,
    savingsHistoryLabeled,
    categoryAnomaly,
  };

  return { ...facts, insights: generateInsights(facts), currentRange, previousRange };
}
