"use client";

import React, { useMemo } from "react";
import useGetDataFromProvider from "@/hooks/getAllInfo/useGetInfoFromProvider";
import useGetUserSession from "@/hooks/useGetUserSession";
import useProjectionTable from "@/hooks/useProjectionTable";
import ProjectionsView from "../Projections/ProjectionsView";
import PeriodFiltersWithCompare from "../periodFiltersWithCompare/PeriodFiltersWithCompare";
import type { PeriodStateProps } from "./HistoricalWalletAnalyzer";
import type { TransactionData } from "@/lib/features/transacctionsSlice";
import type { BudgetData } from "@/lib/features/budgetSlice";
import type { AccountData } from "@/lib/features/accountsSlice";
import type { WalletData } from "@/lib/features/walletSlice";

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
  incomeSourcesConverted?: unknown[];
  projectionSettings?: unknown;
  setProjectionSettings?: (settings: unknown) => void;
  projectionBaseline?: unknown;
  monthlyBuffers?: unknown[];
  monthlyBalances?: unknown[];
  monthRanges: Map<string, MonthRange>;
  isLoading: boolean;
  reloadSettings?: () => Promise<void>;
  reloadBaseline?: () => Promise<void>;
  [key: string]: unknown;
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
  [key: string]: unknown;
}
const TypedPeriodFiltersWithCompare = PeriodFiltersWithCompare as unknown as React.ComponentType<PeriodFiltersWithCompareProps>;

// Typed bridge for unmigrated ProjectionsView
interface ProjectionsViewProps {
  rows: ProjectionRow[];
  onRowClick: (row: ProjectionRow) => void;
}
const TypedProjectionsView = ProjectionsView as unknown as React.ComponentType<ProjectionsViewProps>;

export interface HistoricalProjectionsTableProps {
  periodState: PeriodStateProps;
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
// Januaries from different years don't read as the same row. Kept
// read-only (no month-detail modal, no buffer/balance editing) - that
// modal's save handlers are tied to a single specific year, and History
// can legitimately span two, so wiring it up here would need real new
// design work beyond "show the numbers for this range."
function HistoricalProjectionsTable({ periodState }: HistoricalProjectionsTableProps): React.JSX.Element | null {
  const { timePeriod, getValueFromSelecter, timePeriodsForSelecter, handleRangeDate } = periodState;
  const { email } = useGetUserSession();
  const { transacciones, budgets, accounts, wallet } = useGetDataFromProvider() as DataFromProvider;
  const walletPrimaryCurrency = wallet?.primaryCurrency || "MXN";

  const yearA = timePeriod?.[0] ? timePeriod[0].getFullYear() : null;
  const yearB = timePeriod?.[1] ? timePeriod[1].getFullYear() : null;
  const secondYear = yearB && yearB !== yearA ? yearB : null;

  const tableA = useProjectionTable({
    mail: email,
    year: yearA,
    transactions: transacciones,
    budgets,
    accounts,
    walletPrimaryCurrency,
  }) as ProjectionTableResult;
  const tableB = useProjectionTable({
    mail: email,
    year: secondYear,
    transactions: transacciones,
    budgets,
    accounts,
    walletPrimaryCurrency,
  }) as ProjectionTableResult;

  const rows = useMemo(() => {
    if (!timePeriod?.[0] || !timePeriod?.[1]) return [];
    const inRange = (range?: MonthRange) => range && range.end >= timePeriod[0] && range.start <= timePeriod[1];
    const sliceYear = (table: ProjectionTableResult) =>
      table.rows
        .filter((row) => inRange(table.monthRanges.get(row.monthName)))
        .map((row) => ({ ...row, monthName: `${row.monthName} ${row.year}` }));
    return [...sliceYear(tableA), ...(secondYear ? sliceYear(tableB) : [])];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableA.rows, tableA.monthRanges, tableB.rows, tableB.monthRanges, secondYear, timePeriod]);

  if (!yearA) return null;

  const isLoading = tableA.isLoading || (secondYear && tableB.isLoading);

  return (
    <div className="gf-glass-card border border-gf-border rounded-[32px] shadow-sm p-5">
      <p className="text-[15px] font-extrabold text-gf-text text-center">Proyecciones</p>
      <div className="flex justify-center mb-3">
        <TypedPeriodFiltersWithCompare
          timePeriod={timePeriod}
          getValueFromSelecter={getValueFromSelecter}
          timePeriodsForSelecter={timePeriodsForSelecter}
          handleRangeDate={handleRangeDate}
        />
      </div>
      <p className="text-xs text-gf-text-muted mb-3 text-center">Ingreso, gasto y balance proyectado mes a mes, para el rango elegido arriba</p>
      {isLoading ? (
        <p className="text-xs text-gf-text-muted">Cargando proyecciones…</p>
      ) : rows.length === 0 ? (
        <p className="text-xs text-gf-text-muted">Sin datos de proyección para este periodo.</p>
      ) : (
        <TypedProjectionsView rows={rows} onRowClick={() => {}} />
      )}
    </div>
  );
}

export default HistoricalProjectionsTable;
