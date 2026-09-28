"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { buildWalletAnalyzerSnapshot } from "@/helpers/transformers/walletAnalyzer";
import { buildProjectionComparisonForMonth } from "@/helpers/transformers/projectionsChange";
import { useAccountsFxExposure } from "@/helpers/hooks/useAccountsFxExposure";
import fetcher from "@/helpers/fetcher";
import runNotify from "@/helpers/gastifyNotifier";
import { majorToMinor, minorToMajor } from "@/lib/money/currencies";
import type { RootState } from "@/lib/store";
import type { TransactionData } from "@/lib/features/transacctionsSlice";
import type { BudgetData } from "@/lib/features/budgetSlice";
import type { AccountData } from "@/lib/features/accountsSlice";
import type { WalletData } from "@/lib/features/walletSlice";
import WalletAnalyzerView from "./WalletAnalyzerView";

export interface WalletAnalyzerProps {
  timePeriodFromFather?: (Date | string)[] | null;
  mail?: string;
}

export interface IncomeSourceItem {
  _id?: string;
  name?: string;
  amount?: number;
  currency?: string;
  recurrence?: "monthly" | "semimonthly" | "biweekly" | "weekly" | string;
  anchorDate?: Date | string;
  active?: boolean;
  user?: string | unknown;
  wallet?: string | unknown;
  archived?: boolean;
  history?: {
    amount?: number;
    money?: unknown;
    recurrence?: string;
    effectiveFrom?: Date | string;
    effectiveTo?: Date | string;
  }[];
  money?: unknown;
  [key: string]: unknown;
}

export interface MonthlyBufferItem {
  month?: number;
  unexpectedBuffer?: number;
  unexpectedIncomeBuffer?: number;
  expenseMoney?: unknown;
  incomeMoney?: unknown;
  revisions?: {
    unexpectedBuffer?: number;
    unexpectedIncomeBuffer?: number;
    expenseMoney?: unknown;
    incomeMoney?: unknown;
    updatedAt?: Date | string;
    [key: string]: unknown;
  }[];
  [key: string]: unknown;
}

export interface ProjectionSettingsData {
  _id?: string;
  user?: string | unknown;
  wallet?: string | unknown;
  year?: number;
  monthlyBalances?: {
    month?: number;
    balance?: number;
    money?: unknown;
    revisions?: {
      balance?: number;
      money?: unknown;
      updatedAt?: Date | string;
    }[];
    [key: string]: unknown;
  }[];
  monthlyBuffers?: MonthlyBufferItem[];
  [key: string]: unknown;
}

export interface BaselineHistoryEntry {
  effectiveFrom?: Date | string;
  effectiveTo?: Date | string;
  incomeMoney?: {
    amountMinor: number;
    currency: string;
    [key: string]: unknown;
  };
  expenseMoney?: {
    amountMinor: number;
    currency: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface ProjectionBaselineData {
  _id?: string;
  user?: string | unknown;
  wallet?: string | unknown;
  incomeHistory?: BaselineHistoryEntry[];
  expenseHistory?: BaselineHistoryEntry[];
  [key: string]: unknown;
}

export interface WalletAnalyzerTrendItem {
  label?: string;
  shortLabel?: string;
  [key: string]: unknown;
}

const SPANISH_MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];
const SPANISH_MONTHS_SHORT = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const EMPTY_ARRAY: never[] = [];

function formatMonthLabel(date: Date): string {
  return `${SPANISH_MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

// Self-contained like ResumeTabsTrans/TopElementsContainer/CategoryTreemap's
// container - reads everything it needs straight from Redux instead of
// taking data props from Dashboard.jsx - but it DOES accept the same
// `timePeriodFromFather` every other section already syncs to (the
// dashboard's own top-level date filter), so picking a period up there
// sets Wallet Analyzer's starting month too. It only ever sets the
// *initial* month, though: the same "has the user taken the wheel"
// pattern TopElementsContainer already uses (`userHasSelectedMonth`)
// means navigating the ‹ › stepper or month picker here doesn't get
// stomped by the parent filter, and a later parent-filter change is
// ignored once the user has picked their own month.
function WalletAnalyzer({ timePeriodFromFather, mail }: WalletAnalyzerProps): React.JSX.Element | null {
  const transactions: TransactionData[] = useSelector((state: RootState) => state.transacctionsReducer?.data) || EMPTY_ARRAY;
  const budgets: BudgetData[] = useSelector((state: RootState) => state.budgetReducer?.data) || EMPTY_ARRAY;
  const accounts: AccountData[] = useSelector((state: RootState) => state.accountsReducer?.data) || EMPTY_ARRAY;
  const walletPrimaryCurrency: string = useSelector((state: RootState) => (state.walletReducer?.data as WalletData)?.primaryCurrency) || "MXN";

  const today = useMemo(() => new Date(), []);
  const initialMonth = timePeriodFromFather?.[0]
    ? new Date(new Date(timePeriodFromFather[0]).getFullYear(), new Date(timePeriodFromFather[0]).getMonth(), 1)
    : new Date(today.getFullYear(), today.getMonth(), 1);
  const [referenceMonth, setReferenceMonth] = useState<Date>(initialMonth);
  const [topN, setTopN] = useState<number>(12);
  const userHasSelectedMonth = useRef<boolean>(false);

  useEffect(() => {
    if (!userHasSelectedMonth.current && timePeriodFromFather?.[0]) {
      const fatherDate = new Date(timePeriodFromFather[0]);
      setReferenceMonth(new Date(fatherDate.getFullYear(), fatherDate.getMonth(), 1));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timePeriodFromFather]);

  const snapshot = useMemo(
    () => buildWalletAnalyzerSnapshot({ transactions, budgets, referenceDate: referenceMonth, topN }),
    [transactions, budgets, referenceMonth, topN]
  );

  const fxExposure = useAccountsFxExposure(accounts, walletPrimaryCurrency, referenceMonth);

  const previousMonth = new Date(referenceMonth.getFullYear(), referenceMonth.getMonth() - 1, 1);
  const canGoNext = referenceMonth < new Date(today.getFullYear(), today.getMonth(), 1);

  const trendWithLabels = useMemo(
    () =>
      snapshot.trend.map((m: WalletAnalyzerTrendItem, i: number) => {
        const monthDate = new Date(referenceMonth.getFullYear(), referenceMonth.getMonth() - (snapshot.trend.length - 1 - i), 1);
        return { ...m, label: formatMonthLabel(monthDate), shortLabel: SPANISH_MONTHS_SHORT[monthDate.getMonth()] };
      }),
    [snapshot.trend, referenceMonth]
  );

  // Everything below feeds the "Proyectado vs. Real" card - same data
  // Projections' own accuracy report reads, ported here so the same
  // comparison is available for whichever month the stepper is showing.

  const [incomeSources, setIncomeSources] = useState<IncomeSourceItem[]>(EMPTY_ARRAY);
  useEffect(() => {
    if (!mail) return;
    let cancelled = false;
    (async () => {
      try {
        const toFetch = fetcher();
        const res = await toFetch.post("general-data/income-sources/get", mail);
        if (!cancelled && res.ok) setIncomeSources(res.data || []);
      } catch (e) {
        runNotify("error", String(e));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mail]);

  const [projectionSettings, setProjectionSettings] = useState<ProjectionSettingsData | null>(null);
  const year = referenceMonth.getFullYear();
  useEffect(() => {
    if (!mail) return;
    let cancelled = false;
    (async () => {
      try {
        const toFetch = fetcher();
        const res = await toFetch.post("general-data/projections/get", { mail, year });
        if (!cancelled && res.ok) setProjectionSettings(res.data);
      } catch (e) {
        runNotify("error", String(e));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mail, year]);

  const [projectionBaseline, setProjectionBaseline] = useState<ProjectionBaselineData | null>(null);
  useEffect(() => {
    if (!mail) return;
    let cancelled = false;
    (async () => {
      try {
        const toFetch = fetcher();
        const res = await toFetch.post("general-data/projection-baseline/get", { mail });
        if (!cancelled && res.ok) setProjectionBaseline(res.data);
      } catch (e) {
        runNotify("error", String(e));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mail]);

  // Income sources are entered in their own currency (e.g. a USD paycheck),
  // but the projection math needs every source in the Wallet's primary
  // currency to sum them meaningfully. Same-currency sources pass through
  // untouched; foreign ones are converted via a live quote, never faked.
  const [incomeSourcesConverted, setIncomeSourcesConverted] = useState<IncomeSourceItem[]>(EMPTY_ARRAY);
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
          } catch {
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

  // Same idea, for ProjectionBaseline's income/expense entries - each can
  // carry its own currency (e.g. Octaura paid in USD).
  const [projectionBaselineConverted, setProjectionBaselineConverted] = useState<ProjectionBaselineData | null>(null);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!projectionBaseline) {
        if (!cancelled) setProjectionBaselineConverted(projectionBaseline);
        return;
      }
      const toFetch = fetcher();
      const convertEntries = (entries: BaselineHistoryEntry[] | undefined, moneyField: "incomeMoney" | "expenseMoney") =>
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
            } catch {
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

  const projectionComparison = useMemo(
    () =>
      buildProjectionComparisonForMonth({
        transactions,
        budgets,
        incomeSources: incomeSourcesConverted,
        projectionSettings: { monthlyBuffers: projectionSettings?.monthlyBuffers || [] },
        projectionBaseline: projectionBaselineConverted,
        referenceDate: referenceMonth,
        today: new Date(),
      }),
    [transactions, budgets, incomeSourcesConverted, projectionSettings, projectionBaselineConverted, referenceMonth]
  );

  if (transactions.length === 0) return null;

  return (
    <WalletAnalyzerView
      referenceMonth={referenceMonth}
      referenceMonthLabel={formatMonthLabel(referenceMonth)}
      previousMonthLabel={formatMonthLabel(previousMonth)}
      onPrevMonth={() => {
        userHasSelectedMonth.current = true;
        setReferenceMonth((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
      }}
      onNextMonth={() => {
        if (!canGoNext) return;
        userHasSelectedMonth.current = true;
        setReferenceMonth((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
      }}
      onSelectMonth={(d: Date) => {
        userHasSelectedMonth.current = true;
        setReferenceMonth(new Date(d.getFullYear(), d.getMonth(), 1));
      }}
      maxSelectableMonth={new Date(today.getFullYear(), today.getMonth(), 1)}
      canGoNext={canGoNext}
      topN={topN}
      onChangeTopN={setTopN}
      walletPrimaryCurrency={walletPrimaryCurrency}
      snapshot={{ ...snapshot, trend: trendWithLabels }}
      fxExposure={fxExposure}
      transactions={transactions}
      projectionComparison={projectionComparison}
    />
  );
}

export default WalletAnalyzer;
