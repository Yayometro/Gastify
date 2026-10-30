"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import useGetDataFromProvider from "@/hooks/getAllInfo/useGetInfoFromProvider";
import useProjectionTable, { type IncomeSourceItem, type MonthlyBufferItem, type ProjectionAccuracyRow, type ProjectionTableRow } from "@/hooks/useProjectionTable";
import { summarizeAccuracy, type AccuracyMonthInput } from "@gastify/core/transformers/projectionAccuracy";
import { ProjectionPrecisionChip, rangeFormulaTooltip } from "../Projections/ProjectionPrecisionChip";
import { getYearEndBalance } from "@/helpers/transformers/projectionsChange";
import ProjectionsView from "../Projections/ProjectionsView";
import ProjectionMonthDetailModal from "../Projections/ProjectionMonthDetailModal";
import { buildSelectedMonthDetails, EMPTY_MONTH_DETAILS } from "../Projections/projectionMonthDetails";
import type { MonthDateRange } from "@gastify/core/time/timeFunctions";

import { InfoTip } from "@/components/multiUsedComp/InfoTip";
import TutorialTip from "@/components/tour/TutorialTip";
import PeriodFiltersWithCompare from "../periodFiltersWithCompare/PeriodFiltersWithCompare";
import type { PeriodStateProps } from "./HistoricalWalletAnalyzer";
import type { TransactionData } from "@/lib/features/transacctionsSlice";
import type { BudgetData } from "@/lib/features/budgetSlice";
import type { AccountData } from "@/lib/features/accountsSlice";
import type { WalletData } from "@/lib/features/walletSlice";
import { useT, useInfo } from "@/i18n/client";
import type { ComponentTourId } from "@gastify/core/tour/tourSteps";

export interface MonthRange {
  start: Date;
  end: Date;
  color?: string;
  [key: string]: unknown;
}

export interface ProjectionRow {
  monthName: string;
  year?: number;
  type: "actual" | "estimate" | "current" | string;
  income?: number;
  expense?: number;
  projectedIncome?: number;
  projectedExpense?: number;
  net?: number;
  balance?: number | null;
  manualBalance?: number;
  estimatedBalance?: number | null;
  [key: string]: unknown;
}

export interface ProjectionTableResult {
  rows: ProjectionRow[];
  rawRows?: unknown[];
  accuracyRows?: unknown[];
  startingBalance?: number;
  incomeSources?: unknown[];
  budgetsConverted?: BudgetData[];
  incomeSourcesConverted?: IncomeSourceItem[];
  projectionSettings?: unknown;
  setProjectionSettings?: (settings: unknown) => void;
  projectionBaseline?: unknown;
  monthlyBuffers?: MonthlyBufferItem[];
  monthlyBalances?: unknown[];
  monthRanges: Map<string, MonthRange>;
  isLoading: boolean;
  reloadSettings?: () => Promise<void>;
  reloadBaseline?: () => Promise<void>;
  [key: string]: unknown;
}

// One month as the page shows it: the row (its name carries the year), the table of that year, and the month's own name and index there.
interface MonthEntry {
  row: ProjectionRow;
  table: ProjectionTableResult;
  original: string;
  index: number;
}

interface DataFromProvider {
  transacciones?: TransactionData[];
  budgets?: BudgetData[];
  accounts?: AccountData[];
  wallet?: WalletData | null;
  [key: string]: unknown;
}

// Typed bridge for unmigrated PeriodFiltersWithCompare
interface PeriodFiltersWithCompareProps {
  timePeriod?: [Date, Date] | Date[];
  getValueFromSelecter?: (v: string) => void;
  timePeriodsForSelecter?: Array<{ value: string; name: string; [key: string]: unknown }>;
  handleRangeDate?: (start: Date, end: Date) => void;
  tour?: string;
  tutorial?: ComponentTourId;
  [key: string]: unknown;
}
const TypedPeriodFiltersWithCompare = PeriodFiltersWithCompare as unknown as React.ComponentType<PeriodFiltersWithCompareProps>;

// Typed bridge for unmigrated ProjectionsView
interface ProjectionsViewProps {
  rows: ProjectionRow[];
  onRowClick: (row: ProjectionRow) => void;
  accuracyByMonth?: Record<string, AccuracyMonthInput>;
}
const TypedProjectionsView = ProjectionsView as unknown as React.ComponentType<ProjectionsViewProps>;

// A closed month with a projection record that falls inside the selected period.
// `key` is the row name the table shows ("enero 2026"), so the two can be matched.
interface HistoricalAccuracyEntry {
  key: string;
  year: number;
  input: AccuracyMonthInput;
}

export interface HistoricalProjectionsTableProps {
  periodState: PeriodStateProps;
  readOnly?: boolean;
  email?: string | null;
  demoRatesToMxn?: Record<string, number>;
}

// Slices buildYearProjectionTable's output - via useProjectionTable, the
// exact same fetch+conversion+running-balance pipeline ProjectionsClient.jsx
// uses - down to just the months inside the currently-selected History
// period (timePeriod, not comparePeriod - this is about one period's own
// projection, not a period-vs-period diff). Reused as-is for a whole-year
// selection, sliced otherwise.
//
// A period spanning two calendar years calls the hook twice (rules of
// hooks forbid a variable call count) and concatenates each year's
// relevant slice - the month label is tagged with its year so two
// Januaries from different years don't read as the same row. A row opens
// the same month modal as the Projections page, read-only: History can span
// two years, and that modal's buffer and balance edits belong to one year, so
// here the modal only shows the numbers.
function HistoricalProjectionsTable({ periodState, readOnly = false, email, demoRatesToMxn }: HistoricalProjectionsTableProps): React.JSX.Element | null {
  const { APP_INFO } = useInfo();
  const t = useT();
  const { timePeriod, getValueFromSelecter, timePeriodsForSelecter, handleRangeDate } = periodState;
  const { transacciones, budgets, accounts, wallet } = useGetDataFromProvider() as DataFromProvider;
  const walletPrimaryCurrency = wallet?.primaryCurrency || "MXN";

  const yearA = timePeriod?.[0] ? timePeriod[0].getFullYear() : null;
  const yearB = timePeriod?.[1] ? timePeriod[1].getFullYear() : null;
  const secondYear = yearB && yearB !== yearA ? yearB : null;

  const tableA = useProjectionTable({
    mail: readOnly ? null : email,
    year: yearA,
    transactions: transacciones,
    budgets,
    accounts,
    walletPrimaryCurrency,
    demoRatesToMxn,
  }) as unknown as ProjectionTableResult;
  // The second year picks up where the first one closes, not from today's balance again.
  const tableB = useProjectionTable({
    mail: readOnly ? null : email,
    year: secondYear,
    transactions: transacciones,
    budgets,
    accounts,
    walletPrimaryCurrency,
    startingBalanceOverride: getYearEndBalance(tableA.rows),
    demoRatesToMxn,
  }) as unknown as ProjectionTableResult;

  const entries = useMemo<MonthEntry[]>(() => {
    if (!timePeriod?.[0] || !timePeriod?.[1]) return [];
    const inRange = (range?: MonthRange) => range && range.end >= timePeriod[0] && range.start <= timePeriod[1];
    const sliceYear = (table: ProjectionTableResult): MonthEntry[] =>
      table.rows.flatMap((row, index) =>
        inRange(table.monthRanges.get(row.monthName))
          ? [{ row: { ...row, monthName: `${row.monthName} ${row.year}` }, table, original: row.monthName, index }]
          : []
      );
    return [...sliceYear(tableA), ...(secondYear ? sliceYear(tableB) : [])];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableA.rows, tableA.monthRanges, tableB.rows, tableB.monthRanges, secondYear, timePeriod]);
  const rows = useMemo(() => entries.map((entry) => entry.row), [entries]);

  // Accuracy of the closed months in the selected period: the same eligible months the
  // Projections accuracy report counts (accuracyRows already keeps only those), limited to the period.
  const accuracyEntries = useMemo<HistoricalAccuracyEntry[]>(() => {
    if (!timePeriod?.[0] || !timePeriod?.[1]) return [];
    const pick = (table: ProjectionTableResult, year: number | null): HistoricalAccuracyEntry[] => {
      if (year === null) return [];
      return ((table.accuracyRows ?? []) as ProjectionAccuracyRow[]).flatMap((row) => {
        const range = table.monthRanges.get(row.monthName);
        if (!range || range.end < timePeriod[0] || range.start > timePeriod[1]) return [];
        return [
          {
            key: `${row.monthName} ${year}`,
            year,
            input: {
              monthName: row.monthName,
              year,
              projectedIncome: row.projectedIncome ?? 0,
              actualIncome: row.actualIncome ?? 0,
              projectedExpense: row.projectedExpense ?? 0,
              actualExpense: row.actualExpense ?? 0,
            },
          },
        ];
      });
    };
    return [...pick(tableA, yearA), ...pick(tableB, secondYear)];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableA.accuracyRows, tableA.monthRanges, tableB.accuracyRows, tableB.monthRanges, yearA, secondYear, timePeriod]);
  const accuracyByMonth = useMemo(
    () => Object.fromEntries(accuracyEntries.map((entry) => [entry.key, entry.input])) as Record<string, AccuracyMonthInput>,
    [accuracyEntries]
  );
  const accuracyPeriod = useMemo(() => summarizeAccuracy(accuracyEntries.map((entry) => entry.input)), [accuracyEntries]);
  // "Last quarter" needs the range to cover at least three calendar months AND three measured
  // months; the quarter is the last three measured months. "Per year" appears when the measured months span two years.
  const coveredMonths = timePeriod?.[0] && timePeriod?.[1]
    ? (timePeriod[1].getFullYear() - timePeriod[0].getFullYear()) * 12 + (timePeriod[1].getMonth() - timePeriod[0].getMonth()) + 1
    : 0;
  const lastQuarter =
    coveredMonths >= 3 && accuracyEntries.length >= 3 ? summarizeAccuracy(accuracyEntries.slice(-3).map((entry) => entry.input)) : null;
  const perYear = useMemo(() => {
    const years = [...new Set(accuracyEntries.map((entry) => entry.year))];
    if (years.length < 2) return [];
    return years.map((year) => ({
      year,
      summary: summarizeAccuracy(accuracyEntries.filter((entry) => entry.year === year).map((entry) => entry.input)),
    }));
  }, [accuracyEntries]);

  // The month the person opened (by the name shown on its row), and what the month modal shows for it.
  const [openedMonth, setOpenedMonth] = useState<string | null>(null);
  const opened = entries.find((entry) => entry.row.monthName === openedMonth) || null;
  const details = useMemo(() => {
    if (!opened) return EMPTY_MONTH_DETAILS;
    return buildSelectedMonthDetails({
      rowType: String(opened.row.type),
      range: opened.table.monthRanges.get(opened.original) as unknown as MonthDateRange | undefined,
      transactions: transacciones || [],
      budgets: opened.table.budgetsConverted || [],
      incomeSources: opened.table.incomeSourcesConverted || [],
      unexpectedBuffer: (opened.table.monthlyBuffers || []).find((m) => m.month === opened.index)?.unexpectedBuffer || 0,
      walletPrimaryCurrency,
      labels: { budget: t("budgets.alert.defaultName"), unexpected: t("projections.unexpectedRow") },
    });
  }, [opened, transacciones, walletPrimaryCurrency, t]);
  const openedBuffer = opened ? (opened.table.monthlyBuffers || []).find((m) => m.month === opened.index) : undefined;
  // The modal titles the month from its own name and year, so it gets the month's name as the table keeps it (without the year).
  const openedMonthRow = useMemo(
    () => (opened ? ({ ...opened.row, monthName: opened.original } as unknown as ProjectionTableRow) : null),
    [opened]
  );

  if (!yearA) return null;

  const isLoading = tableA.isLoading || (secondYear && tableB.isLoading);

  return (
    <div className="gf-glass-card border border-gf-border rounded-[32px] shadow-sm p-5">
      <div className="flex items-center justify-center gap-1.5"><p className="text-[15px] font-extrabold text-gf-text text-center">{t("analyzer.projections")}</p><span aria-hidden="true" className="mx-2 inline-block h-5 w-px shrink-0 align-middle bg-purple-300/40" /><InfoTip info={APP_INFO.mes_a_mes} /><TutorialTip tour="hisProjections" label={t("tour.hisProjections.name")} /></div>
      <div className="flex justify-center mb-3">
        <TypedPeriodFiltersWithCompare
          tour="his-proj"
          timePeriod={timePeriod}
          getValueFromSelecter={getValueFromSelecter}
          timePeriodsForSelecter={timePeriodsForSelecter}
          handleRangeDate={handleRangeDate}
        />
      </div>
      <p className="text-xs text-gf-text-muted mb-3 text-center" data-tour="his-proj-help">{t("analyzer.projections.help")}</p>
      <div className="mb-4 rounded-xl bg-gf-accent-soft-bg p-3 text-center" data-tour="his-proj-accuracy">
        <div className="mb-2 flex items-center justify-center gap-1.5">
          <p className="text-[13px] font-bold text-gf-text">{t("projections.precision.title")}</p>
          <span aria-hidden="true" className="mx-2 inline-block h-4 w-px shrink-0 align-middle bg-purple-300/40" />
          <InfoTip info={APP_INFO.precision_de_proyecciones} />
          <TutorialTip tour="hisProjections" label={t("tour.hisProjections.name")} />
        </div>
        {accuracyEntries.length === 0 ? (
          <p className="text-xs text-gf-text-muted">{t("projections.precision.none")}</p>
        ) : (
          <div className="flex flex-col items-center gap-2 text-xs">
            <div className="flex flex-wrap items-center justify-center gap-2">
              <span className="text-gf-text-muted">{t("projections.precision.period")}</span>
              <ProjectionPrecisionChip
                value={accuracyPeriod.income}
                label={t("projections.accuracy.income")}
                tooltip={rangeFormulaTooltip(t, t("projections.accuracy.income"), accuracyPeriod.income)}
              />
              <ProjectionPrecisionChip
                value={accuracyPeriod.expense}
                label={t("projections.accuracy.expense")}
                tooltip={rangeFormulaTooltip(t, t("projections.accuracy.expense"), accuracyPeriod.expense)}
              />
              <ProjectionPrecisionChip
                value={accuracyPeriod.global}
                label={t("projections.precision.global")}
                tooltip={rangeFormulaTooltip(t, t("projections.precision.global"), accuracyPeriod.global)}
              />
            </div>
            {lastQuarter && (
              <div className="flex flex-wrap items-center justify-center gap-2">
                <span className="text-gf-text-muted">{t("projections.precision.quarter")}</span>
                <ProjectionPrecisionChip
                  value={lastQuarter.global}
                  label={t("projections.precision.global")}
                  tooltip={rangeFormulaTooltip(t, t("projections.precision.quarter"), lastQuarter.global)}
                />
              </div>
            )}
            {perYear.map(({ year, summary }) => (
              <div key={year} className="flex flex-wrap items-center justify-center gap-2">
                <span className="text-gf-text-muted">{t("projections.precision.year", { p1: year })}</span>
                <ProjectionPrecisionChip
                  value={summary.global}
                  label={t("projections.precision.global")}
                  tooltip={rangeFormulaTooltip(t, t("projections.precision.year", { p1: year }), summary.global)}
                />
              </div>
            ))}
            <p className="text-[11px] text-gf-text-muted">{t("projections.precision.months", { p1: accuracyPeriod.months })}</p>
          </div>
        )}
      </div>
      {isLoading ? (
        <p className="text-xs text-gf-text-muted">{t("analyzer.projections.loading")}</p>
      ) : rows.length === 0 ? (
        <p className="text-xs text-gf-text-muted">{t("analyzer.projections.none")}</p>
      ) : (
        <div data-tour="his-proj-table"><TypedProjectionsView rows={rows} onRowClick={(row) => setOpenedMonth(row.monthName)} accuracyByMonth={accuracyByMonth} /></div>
      )}
      {!readOnly && (
        <div className="mt-3 flex justify-center">
          <Link href="/dashboard/projections" className="text-xs font-semibold text-purple-300 hover:text-white transition-colors">
            {t("history.projections.seeAll")}
          </Link>
        </div>
      )}
      {opened && (
        <ProjectionMonthDetailModal
          monthRow={openedMonthRow}
          bucketBreakdown={details.bucketBreakdown}
          incomeOccurrences={details.incomeOccurrences}
          incomeCurrencyBreakdown={details.incomeCurrencyBreakdown}
          expenseCurrencyBreakdown={details.expenseCurrencyBreakdown}
          walletPrimaryCurrency={walletPrimaryCurrency}
          unexpectedBuffer={openedBuffer?.unexpectedBuffer || 0}
          unexpectedIncomeBuffer={openedBuffer?.unexpectedIncomeBuffer || 0}
          bufferRevisions={openedBuffer?.revisions}
          onSaveBuffers={() => undefined}
          onSaveMonthBalance={() => undefined}
          onClose={() => setOpenedMonth(null)}
          mail={email || undefined}
          readOnly
        />
      )}
    </div>
  );
}

export default HistoricalProjectionsTable;
