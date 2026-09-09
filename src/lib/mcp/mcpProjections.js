import IncomeSource from "@/model/IncomeSource";
import ProjectionSettings from "@/model/ProjectionSettings";
import ProjectionBaseline from "@/model/ProjectionBaseline";
import Account from "@/model/Account";
import { convert } from "@/lib/money/server/fxRateService";
import { majorToMinor, minorToMajor } from "@/lib/money/currencies";
import { getYearMonthDateRange } from "@/helpers/timeFunctions/timeFunctions";
import {
  buildYearProjectionTable,
  computeYearRowsWithBalance,
  estimateHistoricalBalances,
} from "@/helpers/transformers/projectionsChange";

// Same major-unit FX conversion useProjectionTable's own effects do via a
// browser fetch to /general-data/fx/quote - there's no browser here, so this
// calls the server-side convert() directly instead. Falls through to the
// raw (unconverted) amount when no rate is available, same as the client
// hook's own catch branch - never fakes a rate.
async function convertMajor(amount, fromCurrency, toCurrency) {
  if (!amount || fromCurrency === toCurrency) return amount || 0;
  const result = await convert({ amountMinor: majorToMinor(amount, fromCurrency), fromCurrency, toCurrency });
  if (!result.available) return amount;
  return minorToMajor(result.amountMinor, toCurrency);
}

async function convertMoneyEntries(entries, moneyField, walletPrimaryCurrency) {
  return Promise.all(
    (entries || []).map(async (entry) => {
      const money = entry[moneyField];
      if (!money) return entry;
      const entryCurrency = money.currency || walletPrimaryCurrency;
      if (entryCurrency === walletPrimaryCurrency) return entry;
      const result = await convert({ amountMinor: money.amountMinor, fromCurrency: entryCurrency, toCurrency: walletPrimaryCurrency });
      if (!result.available) return entry;
      return { ...entry, [moneyField]: { amountMinor: result.amountMinor, currency: walletPrimaryCurrency } };
    })
  );
}

// Server-side sibling of useProjectionTable - same math
// (buildYearProjectionTable + computeYearRowsWithBalance +
// estimateHistoricalBalances, all shared with the app's own Projections
// page and History's projections table so the AI's numbers can never drift
// from what the user sees), but fetches straight from Mongo and converts
// currencies via a direct convert() call instead of round-tripping through
// the app's own internal /fx/quote route the React hook uses (there's no
// browser making that request here). Spans 1 or 2 calendar years exactly
// like HistoricalProjectionsTable does when the range crosses a year
// boundary, then slices the combined rows down to the requested range.
export async function buildProjectionsForRange({ user, wallet, transactions, budgets, range, today = new Date() }) {
  const walletPrimaryCurrency = wallet.primaryCurrency || "MXN";
  const yearStart = range.start.getFullYear();
  const yearEnd = range.end.getFullYear();
  const years = yearStart === yearEnd ? [yearStart] : [yearStart, yearEnd];

  const [rawIncomeSources, settingsDocs, projectionBaseline, accounts] = await Promise.all([
    IncomeSource.find({ user: user._id, wallet: wallet._id, archived: { $ne: true } }).lean(),
    ProjectionSettings.find({ wallet: wallet._id, year: { $in: years } }).lean(),
    ProjectionBaseline.findOne({ wallet: wallet._id }).lean(),
    Account.find({ user: user._id, wallet: wallet._id }).lean(),
  ]);

  const incomeSources = await Promise.all(
    rawIncomeSources.map(async (s) => ({
      ...s,
      amount: await convertMajor(s.amount, s.currency || walletPrimaryCurrency, walletPrimaryCurrency),
    }))
  );

  const projectionBaselineConverted = projectionBaseline
    ? {
        ...projectionBaseline,
        incomeHistory: await convertMoneyEntries(projectionBaseline.incomeHistory, "incomeMoney", walletPrimaryCurrency),
        expenseHistory: await convertMoneyEntries(projectionBaseline.expenseHistory, "expenseMoney", walletPrimaryCurrency),
      }
    : null;

  const nonCreditAccounts = (accounts || []).filter((a) => a.accountType !== "credit");
  let startingBalance = 0;
  for (const acc of nonCreditAccounts) {
    startingBalance += await convertMajor(acc.amount || 0, acc.currency || walletPrimaryCurrency, walletPrimaryCurrency);
  }

  const settingsByYear = new Map(settingsDocs.map((s) => [s.year, s]));

  const slicedRows = [];
  years.forEach((year) => {
    const settings = settingsByYear.get(year);
    const rows = buildYearProjectionTable({
      transactions,
      budgets,
      incomeSources,
      projectionSettings: { monthlyBuffers: settings?.monthlyBuffers || [] },
      projectionBaseline: projectionBaselineConverted,
      year,
      today,
    });
    const rowsWithBalance = computeYearRowsWithBalance(rows, settings?.monthlyBalances || [], startingBalance, year, today);
    const monthRangesForYear = getYearMonthDateRange(new Date(year, 0, 1));
    const monthStarts = [...monthRangesForYear.values()].map((r) => r.start);
    const rowsWithEstimates = estimateHistoricalBalances(rowsWithBalance, monthStarts, projectionBaselineConverted);

    rowsWithEstimates.forEach((row) => {
      const monthRange = monthRangesForYear.get(row.monthName);
      if (monthRange && monthRange.end >= range.start && monthRange.start <= range.end) {
        slicedRows.push({
          month: `${row.monthName} ${row.year}`,
          type: row.type,
          income: row.type === "current" ? row.projectedIncome : row.income,
          expense: row.type === "current" ? row.projectedExpense : row.expense,
          net: row.net,
          balance: row.balance ?? row.estimatedBalance ?? null,
          balanceIsEstimated: row.balance == null && row.estimatedBalance != null,
        });
      }
    });
  });

  return { rows: slicedRows, startingBalance, walletPrimaryCurrency };
}
