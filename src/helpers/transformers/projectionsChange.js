import { getYearMonthDateRange } from "../timeFunctions/timeFunctions";
import { getTransactionsFromTimeRange, filterBillsOrIncomes } from "./transactionsChange";
import { getValueActiveInMonth } from "./budgetHistory";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function sum(arr) {
  return arr.reduce((acc, n) => acc + (n || 0), 0);
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

function countIntervalOccurrences(anchorDate, intervalDays, monthStart, monthEnd) {
  const anchor = new Date(anchorDate);
  const diffDays = Math.floor((monthStart - anchor) / MS_PER_DAY);
  let k = Math.max(0, Math.floor(diffDays / intervalDays));
  let current = new Date(anchor.getTime() + k * intervalDays * MS_PER_DAY);
  while (current < monthStart) {
    k += 1;
    current = new Date(anchor.getTime() + k * intervalDays * MS_PER_DAY);
  }
  let count = 0;
  while (current <= monthEnd) {
    count += 1;
    k += 1;
    current = new Date(anchor.getTime() + k * intervalDays * MS_PER_DAY);
  }
  return count;
}

// How many payments of this income source are expected to land inside [monthStart, monthEnd].
// `semimonthly` (fixed paydays, e.g. 15th + last day) is always exactly 2/month.
// `biweekly` (every 14 days from anchorDate) can occasionally land 3 in a month due to calendar drift.
export function getExpectedOccurrencesInMonth(incomeSource, monthStart, monthEnd) {
  switch (incomeSource.recurrence) {
    case "monthly":
      return 1;
    case "semimonthly":
      return 2;
    case "biweekly":
      return incomeSource.anchorDate
        ? countIntervalOccurrences(incomeSource.anchorDate, 14, monthStart, monthEnd)
        : 2;
    case "weekly":
      return incomeSource.anchorDate
        ? countIntervalOccurrences(incomeSource.anchorDate, 7, monthStart, monthEnd)
        : 4;
    default:
      return 1;
  }
}

export function matchBillToBudget(bill, budget) {
  if (budget.subCategory) {
    const subCategoryId = budget.subCategory?._id || budget.subCategory;
    return String(bill.subCategory?._id) === String(subCategoryId);
  }
  if (budget.category) {
    const categoryId = budget.category?._id || budget.category;
    return String(bill.category?._id) === String(categoryId);
  }
  return false;
}

// Per Budget bucket: MAX(budgeted goal, real spend this month). Bills matching no
// Budget fall into the "unexpected" bucket, compared the same way against the buffer.
function sumPerBucketMax(bills, budgets, bufferAmount) {
  const matchedBillIds = new Set();
  let total = 0;
  budgets.forEach((budget) => {
    const matched = bills.filter((bill) => matchBillToBudget(bill, budget));
    matched.forEach((bill) => matchedBillIds.add(String(bill._id)));
    const actual = sum(matched.map((bill) => bill.amount));
    total += Math.max(budget.goalAmount || 0, actual);
  });
  const unmatched = bills.filter((bill) => !matchedBillIds.has(String(bill._id)));
  const unmatchedActual = sum(unmatched.map((bill) => bill.amount));
  total += Math.max(bufferAmount || 0, unmatchedActual);
  return total;
}

// Per-bucket breakdown (one row per Budget + one "Unexpected" row) for the detail-modal chart.
export function getMonthBucketBreakdown(bills, budgets, bufferAmount) {
  const matchedBillIds = new Set();
  const rows = budgets.map((budget) => {
    const matched = bills.filter((bill) => matchBillToBudget(bill, budget));
    matched.forEach((bill) => matchedBillIds.add(String(bill._id)));
    return {
      label: budget.name || budget.subCategory?.name || budget.category?.name || "Budget",
      budgeted: budget.goalAmount || 0,
      actual: sum(matched.map((bill) => bill.amount)),
    };
  });
  const unmatched = bills.filter((bill) => !matchedBillIds.has(String(bill._id)));
  rows.push({
    label: "Unexpected/Other",
    budgeted: bufferAmount || 0,
    actual: sum(unmatched.map((bill) => bill.amount)),
  });
  return rows;
}

// Builds the 12-month projection table for a given year:
// - past months: pure actual (real transactions), plus the historical Budget/IncomeSource
//   values that were active back then (for the detail-modal chart, not the headline number).
// - future months: pure estimate, using the CURRENTLY active Budgets/IncomeSources.
// - the current month: MAX(estimate, real-so-far) per bucket, see sumPerBucketMax.
export function buildYearProjectionTable({ transactions, budgets, incomeSources, projectionSettings, year, today }) {
  const monthRanges = getYearMonthDateRange(new Date(year, 0, 1));
  const nonSavingBudgets = (budgets || []).filter((b) => !b.isSaving);
  const unexpectedBuffer = projectionSettings?.unexpectedBuffer || 0;
  const todayMonthStart = startOfMonth(today);
  const todayMonthEnd = endOfMonth(today);

  return [...monthRanges.entries()].map(([monthName, { start, end }]) => {
    const monthTx = getTransactionsFromTimeRange(transactions, start, end);
    const { incomes, bills } = filterBillsOrIncomes(monthTx);
    const actualIncome = sum(incomes.map((tx) => tx.amount));
    const actualExpense = sum(bills.map((tx) => tx.amount));

    if (end < todayMonthStart) {
      // past month: headline is pure actual; also resolve what was budgeted/expected
      // back then (not the current value) for the modal's estimate-vs-real chart.
      const historicalExpense =
        sum(
          nonSavingBudgets.map((b) => getValueActiveInMonth(b.history, start)?.goalAmount || 0)
        ) + unexpectedBuffer;
      const historicalIncome = sum(
        (incomeSources || []).map((source) => {
          const resolved = getValueActiveInMonth(source.history, start);
          if (!resolved) return 0;
          return (resolved.amount || 0) * getExpectedOccurrencesInMonth(
            { ...source, recurrence: resolved.recurrence },
            start,
            end
          );
        })
      );
      return {
        monthName, year, type: "actual",
        income: actualIncome, expense: actualExpense,
        historicalIncome, historicalExpense,
      };
    }

    const activeBudgets = nonSavingBudgets.filter((b) => !b.archived);
    const activeIncomeSources = (incomeSources || []).filter((s) => s.active && !s.archived);
    const shadowExpense = sum(activeBudgets.map((b) => b.goalAmount)) + unexpectedBuffer;
    const shadowIncome = sum(
      activeIncomeSources.map((s) => (s.amount || 0) * getExpectedOccurrencesInMonth(s, start, end))
    );

    if (start > todayMonthEnd) {
      // future month: pure estimate
      return { monthName, year, type: "estimate", income: shadowIncome, expense: shadowExpense };
    }

    // current month: blend
    const projectedExpense = sumPerBucketMax(bills, activeBudgets, unexpectedBuffer);
    return {
      monthName, year, type: "current",
      shadowIncome, actualIncome, projectedIncome: Math.max(shadowIncome, actualIncome),
      shadowExpense, actualExpense, projectedExpense,
    };
  });
}
