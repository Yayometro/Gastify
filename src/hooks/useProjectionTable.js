"use client";

import { useEffect, useMemo, useState } from "react";
import fetcher from "@/helpers/fetcher";
import runNotify from "@/helpers/gastifyNotifier";
import { getYearMonthDateRange } from "@/helpers/timeFunctions/timeFunctions";
import {
  buildYearProjectionTable,
  buildProjectionAccuracyReport,
  estimateHistoricalBalances,
} from "@/helpers/transformers/projectionsChange";
import { majorToMinor, minorToMajor } from "@/lib/money/currencies";

// Extracted from ProjectionsClient.jsx - the projections page's own year
// table needs fetching + currency-converting incomeSources/projectionBaseline,
// then computing a running balance across the year, and that whole pipeline
// is exactly what /dashboard/history's own projections table (for whatever
// calendar year(s) the selected period touches, not necessarily "the" year
// ProjectionsClient's own year-selector happens to be on) also needs.
// Extracted rather than duplicated so both consumers share one place this
// logic can be fixed/extended.
//
// Pass `year: null` to skip fetching/computing entirely (every returned
// array is empty, isLoading stays false) - History calls this hook a fixed
// two times (rules of hooks: the call itself can't be conditional) and
// passes null for the second slot when the selected period only touches
// one calendar year.
export default function useProjectionTable({ mail, year, transactions, budgets, accounts, walletPrimaryCurrency }) {
  const [incomeSources, setIncomeSources] = useState([]);
  const [projectionSettings, setProjectionSettings] = useState(null);
  const [settingsLoading, setSettingsLoading] = useState(Boolean(year));
  const [projectionBaseline, setProjectionBaseline] = useState(null);

  const loadSettings = async () => {
    if (!mail || !year) return;
    setSettingsLoading(true);
    try {
      const toFetch = fetcher();
      const [incomeRes, projRes] = await Promise.all([
        toFetch.post("general-data/income-sources/get", mail),
        toFetch.post("general-data/projections/get", { mail, year }),
      ]);
      if (incomeRes.ok) setIncomeSources(incomeRes.data || []);
      if (projRes.ok) setProjectionSettings(projRes.data);
    } catch (e) {
      runNotify("error", String(e));
    } finally {
      setSettingsLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mail, year]);

  // Wallet-wide, not year-scoped - fetched once per mail, never re-fetched
  // when the caller flips between years.
  const loadBaseline = async () => {
    if (!mail) return;
    try {
      const toFetch = fetcher();
      const res = await toFetch.post("general-data/projection-baseline/get", { mail });
      if (res.ok) setProjectionBaseline(res.data);
    } catch (e) {
      runNotify("error", String(e));
    }
  };

  useEffect(() => {
    loadBaseline();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mail]);

  const monthlyBalances = useMemo(() => projectionSettings?.monthlyBalances || [], [projectionSettings]);
  const monthlyBuffers = useMemo(() => projectionSettings?.monthlyBuffers || [], [projectionSettings]);

  // Income sources are entered in their own currency (e.g. a USD paycheck),
  // but the projection math needs every source in the Wallet's primary
  // currency to sum them meaningfully. Same-currency sources pass through
  // untouched; foreign ones are converted via a live quote, never faked.
  const [incomeSourcesConverted, setIncomeSourcesConverted] = useState([]);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const toFetch = fetcher();
      const converted = await Promise.all(
        (incomeSources || []).map(async (s) => {
          const sourceCurrency = s.currency || walletPrimaryCurrency;
          if (sourceCurrency === walletPrimaryCurrency) return s;
          try {
            const res = await toFetch.post("general-data/fx/quote", {
              amountMinor: majorToMinor(s.amount || 0, sourceCurrency),
              fromCurrency: sourceCurrency,
              toCurrency: walletPrimaryCurrency,
            });
            if (res.ok) return { ...s, amount: minorToMajor(res.data.amountMinor, walletPrimaryCurrency) };
          } catch (e) {
            // No rate available - fall through to the raw (unconverted) source.
          }
          return s;
        })
      );
      if (!cancelled) setIncomeSourcesConverted(converted);
    })();
    return () => {
      cancelled = true;
    };
  }, [incomeSources, walletPrimaryCurrency]);

  // ProjectionBaseline entries can each carry their own currency - converted
  // the same way, entry by entry, at resolution time. The RAW (unconverted)
  // projectionBaseline is still returned separately for a panel that
  // displays entries in the currency the user actually entered them in.
  const [projectionBaselineConverted, setProjectionBaselineConverted] = useState(null);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!projectionBaseline) {
        if (!cancelled) setProjectionBaselineConverted(projectionBaseline);
        return;
      }
      const toFetch = fetcher();
      const convertEntries = (entries, moneyField) =>
        Promise.all(
          (entries || []).map(async (entry) => {
            const money = entry[moneyField];
            const entryCurrency = money?.currency || walletPrimaryCurrency;
            if (!money || entryCurrency === walletPrimaryCurrency) return entry;
            try {
              const res = await toFetch.post("general-data/fx/quote", {
                amountMinor: money.amountMinor,
                fromCurrency: entryCurrency,
                toCurrency: walletPrimaryCurrency,
              });
              if (res.ok) return { ...entry, [moneyField]: { amountMinor: res.data.amountMinor, currency: walletPrimaryCurrency } };
            } catch (e) {
              // No rate available - fall through to the raw (unconverted) entry.
            }
            return entry;
          })
        );
      const [incomeHistory, expenseHistory] = await Promise.all([
        convertEntries(projectionBaseline.incomeHistory, "incomeMoney"),
        convertEntries(projectionBaseline.expenseHistory, "expenseMoney"),
      ]);
      if (!cancelled) setProjectionBaselineConverted({ ...projectionBaseline, incomeHistory, expenseHistory });
    })();
    return () => {
      cancelled = true;
    };
  }, [projectionBaseline, walletPrimaryCurrency]);

  const rows = useMemo(() => {
    if (!year || !transactions || !budgets) return [];
    return buildYearProjectionTable({
      transactions,
      budgets,
      incomeSources: incomeSourcesConverted,
      projectionSettings: { monthlyBuffers },
      projectionBaseline: projectionBaselineConverted,
      year,
      today: new Date(),
    });
  }, [year, transactions, budgets, incomeSourcesConverted, monthlyBuffers, projectionBaselineConverted]);

  const accuracyRows = useMemo(() => {
    if (!year || !transactions || !budgets) return [];
    return buildProjectionAccuracyReport({
      transactions,
      budgets,
      incomeSources: incomeSourcesConverted,
      projectionSettings: { monthlyBuffers },
      projectionBaseline: projectionBaselineConverted,
      year,
      today: new Date(),
    });
  }, [year, transactions, budgets, incomeSourcesConverted, monthlyBuffers, projectionBaselineConverted]);

  // Converts every non-credit Account's own native balance into the Wallet's
  // primary currency using the latest reference rate - a live, right-now
  // valuation, not a historical one.
  const [startingBalance, setStartingBalance] = useState(0);
  useEffect(() => {
    if (!year) return;
    const nonCreditAccounts = (accounts || []).filter((acc) => acc.accountType !== "credit");
    let cancelled = false;
    (async () => {
      const toFetch = fetcher();
      let total = 0;
      for (const acc of nonCreditAccounts) {
        const accountCurrency = acc.currency || walletPrimaryCurrency;
        if (accountCurrency === walletPrimaryCurrency) {
          total += acc.amount || 0;
          continue;
        }
        try {
          const res = await toFetch.post("general-data/fx/quote", {
            amountMinor: majorToMinor(acc.amount || 0, accountCurrency),
            fromCurrency: accountCurrency,
            toCurrency: walletPrimaryCurrency,
          });
          if (res.ok) total += minorToMajor(res.data.amountMinor, walletPrimaryCurrency);
        } catch (e) {
          // No cached/live rate available - skip rather than guess.
        }
      }
      if (!cancelled) setStartingBalance(total);
    })();
    return () => {
      cancelled = true;
    };
  }, [year, accounts, walletPrimaryCurrency]);

  const today = new Date();
  const rowsWithBalance = useMemo(() => {
    if (!year) return [];
    let runningBalance = startingBalance;
    let reachedCurrent = false;
    return rows.map((row, index) => {
      const net = row.type === "current" ? row.projectedIncome - row.projectedExpense : row.income - row.expense;
      const isCurrentOrLater = year > today.getFullYear() || row.type !== "actual";
      const manualEntry = monthlyBalances.find((m) => m.month === index);
      if (!isCurrentOrLater) {
        return { ...row, net, balance: manualEntry ? manualEntry.balance : null, manualBalance: manualEntry?.balance };
      }
      if (row.type === "current") {
        reachedCurrent = true;
        const remainingNet = (row.projectedIncome - row.actualIncome) - (row.projectedExpense - row.actualExpense);
        runningBalance += remainingNet;
        return { ...row, net, balance: runningBalance };
      }
      if (reachedCurrent || row.type === "estimate") {
        runningBalance += net;
        return { ...row, net, balance: runningBalance };
      }
      return { ...row, net, balance: manualEntry ? manualEntry.balance : null, manualBalance: manualEntry?.balance };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, startingBalance, year, monthlyBalances]);

  const monthRanges = useMemo(() => (year ? getYearMonthDateRange(new Date(year, 0, 1)) : new Map()), [year]);

  const rowsWithEstimates = useMemo(() => {
    if (!year) return [];
    const monthStarts = [...monthRanges.values()].map((r) => r.start);
    return estimateHistoricalBalances(rowsWithBalance, monthStarts, projectionBaselineConverted);
  }, [year, rowsWithBalance, monthRanges, projectionBaselineConverted]);

  return {
    rows: rowsWithEstimates,
    rawRows: rows,
    accuracyRows,
    startingBalance,
    incomeSources,
    incomeSourcesConverted,
    projectionSettings,
    setProjectionSettings,
    projectionBaseline,
    monthlyBuffers,
    monthlyBalances,
    monthRanges,
    isLoading: settingsLoading,
    reloadSettings: loadSettings,
    reloadBaseline: loadBaseline,
  };
}
