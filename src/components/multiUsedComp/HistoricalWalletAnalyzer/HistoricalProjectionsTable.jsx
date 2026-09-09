"use client";

import React, { useMemo } from "react";
import useGetDataFromProvider from "@/hooks/getAllInfo/useGetInfoFromProvider";
import useGetUserSession from "@/hooks/useGetUserSession";
import useProjectionTable from "@/hooks/useProjectionTable";
import ProjectionsView from "../Projections/ProjectionsView";
import PeriodFiltersWithCompare from "../periodFiltersWithCompare/PeriodFiltersWithCompare";

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
function HistoricalProjectionsTable({ periodState }) {
  const { timePeriod, getValueFromSelecter, timePeriodsForSelecter, handleRangeDate } = periodState;
  const { email } = useGetUserSession();
  const { transacciones, budgets, accounts, wallet } = useGetDataFromProvider();
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
  });
  const tableB = useProjectionTable({
    mail: email,
    year: secondYear,
    transactions: transacciones,
    budgets,
    accounts,
    walletPrimaryCurrency,
  });

  const rows = useMemo(() => {
    if (!timePeriod?.[0] || !timePeriod?.[1]) return [];
    const inRange = (range) => range && range.end >= timePeriod[0] && range.start <= timePeriod[1];
    const sliceYear = (table) =>
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
        <PeriodFiltersWithCompare
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
        <ProjectionsView rows={rows} onRowClick={() => {}} />
      )}
    </div>
  );
}

export default HistoricalProjectionsTable;
