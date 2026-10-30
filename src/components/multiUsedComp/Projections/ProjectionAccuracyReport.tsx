"use client";

import React from "react";
import { usdFormatChanger } from "@/helpers/transformers/transactionsChange";
import type { ProjectionAccuracyRow } from "@/hooks/useProjectionTable";
import { monthAccuracy, summarizeAccuracy, type AccuracyMonthInput } from "@gastify/core/transformers/projectionAccuracy";

import TitleWithHelp from "../TitleWithHelp";
import ProjectionVarianceCell from "./ProjectionVarianceCell";
import { ProjectionPrecisionChip, rangeFormulaTooltip, singleValueFormulaTooltip } from "./ProjectionPrecisionChip";
import { useT, useInfo } from "@/i18n/client";

export interface ProjectionAccuracyReportProps {
  rows?: ProjectionAccuracyRow[] | null;
  onRowClick: (monthName: string) => void;
}

function toAccuracyInput(row: ProjectionAccuracyRow): AccuracyMonthInput {
  return {
    monthName: row.monthName,
    projectedIncome: row.projectedIncome ?? 0,
    actualIncome: row.actualIncome ?? 0,
    projectedExpense: row.projectedExpense ?? 0,
    actualExpense: row.actualExpense ?? 0,
  };
}

// Precisión de proyecciones: proyectado (lo que se esperaba, fijado a como
// estaba el buffer al cierre de ese mes) vs. real, solo para meses cerrados
// que tienen al menos un registro de proyección. A diferencia de
// ProjectionsView (la tabla principal de 12 meses), esta es su propia
// sección porque solo aplica a un subconjunto de meses y necesita dos
// dimensiones numéricas por mes (proyectado y real) que no caben como una
// sola columna más en la tabla existente.
// The percentage columns use the same numbers as the variance cells (the
// projected and actual values of each row); the footer pools the visible rows.
function ProjectionAccuracyReport({ rows, onRowClick }: ProjectionAccuracyReportProps): React.JSX.Element | null {
  const { APP_INFO } = useInfo();
  const t = useT();
  if (!rows || rows.length === 0) return null;

  const range = summarizeAccuracy(rows.map(toAccuracyInput));

  return (
    <div className="w-full mt-6" data-tour="proj-accuracy">
      <TitleWithHelp
        as="h2"
        title={t("projections.accuracy.title")}
        info={APP_INFO.c_mo_leer_esta_tabla_2}
        tour="projAccuracy"
        tourLabel={t("tour.projAccuracy.name")}
        titleClassName="text-purple-300 text-lg"
        className="mb-2"
      />
      <div className="w-full overflow-x-auto" data-tour="proj-accuracy-table">
        <table className="w-full min-w-[680px] text-center bg-gf-surface rounded-2xl overflow-hidden">
          <thead>
            <tr className="bg-purple-600 text-white">
              <th className="py-2 px-3">{t("projections.accuracy.month")}</th>
              <th className="py-2 px-3">{t("projections.accuracy.projectedIncome")}</th>
              <th className="py-2 px-3">{t("projections.accuracy.realIncome")}</th>
              <th className="py-2 px-3">{t("projections.accuracy.projectedExpense")}</th>
              <th className="py-2 px-3">{t("projections.accuracy.realExpense")}</th>
              <th className="py-2 px-3">{t("projections.accuracy.gap")}</th>
              <th className="py-2 px-3" data-tour="proj-accuracy-pct">
                <TitleWithHelp
                  title={t("projections.precision.monthlyColumn")}
                  info={APP_INFO.precision_de_proyecciones}
                  className="justify-center"
                />
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const acc = monthAccuracy(toAccuracyInput(row));
              return (
                <tr
                  key={row.monthName}
                  className="capitalize cursor-pointer hover:bg-gf-accent-soft-bg border-b border-gf-border"
                  onClick={() => onRowClick(row.monthName)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e: React.KeyboardEvent<HTMLTableRowElement>) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onRowClick(row.monthName);
                    }
                  }}
                >
                  <td className="py-2 px-3">{row.monthName}</td>
                  <td className="py-2 px-3 text-gf-text-muted">{usdFormatChanger(row.projectedIncome ?? 0)}</td>
                  <td className="py-2 px-3 text-green-400">{usdFormatChanger(row.actualIncome ?? 0)}</td>
                  <td className="py-2 px-3 text-gf-text-muted">{usdFormatChanger(row.projectedExpense ?? 0)}</td>
                  <td className="py-2 px-3 text-red-400">{usdFormatChanger(row.actualExpense ?? 0)}</td>
                  <td className="py-2 px-3" data-tour="proj-accuracy-gap">
                    <div className="flex flex-col leading-tight text-xs items-start mx-auto w-fit">
                      <ProjectionVarianceCell
                        label={t("projections.accuracy.income")}
                        actual={row.actualIncome}
                        projected={row.projectedIncome}
                        value={row.varianceIncome}
                        betterWhenPositive
                      />
                      <ProjectionVarianceCell
                        label={t("projections.accuracy.expense")}
                        actual={row.actualExpense}
                        projected={row.projectedExpense}
                        value={row.varianceExpense}
                        betterWhenPositive={false}
                      />
                    </div>
                  </td>
                  <td className="py-2 px-3">
                    <div className="flex flex-col items-center gap-1 text-xs">
                      <ProjectionPrecisionChip
                        value={acc.income}
                        label={t("projections.accuracy.income")}
                        tooltip={singleValueFormulaTooltip(t, `${t("projections.accuracy.income")} · ${row.monthName}`, row.projectedIncome ?? 0, row.actualIncome ?? 0)}
                      />
                      <ProjectionPrecisionChip
                        value={acc.expense}
                        label={t("projections.accuracy.expense")}
                        tooltip={singleValueFormulaTooltip(t, `${t("projections.accuracy.expense")} · ${row.monthName}`, row.projectedExpense ?? 0, row.actualExpense ?? 0)}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-gf-accent-soft-bg text-xs font-semibold">
              <td className="py-2 px-3 text-left" colSpan={6}>
                <TitleWithHelp
                  title={t("projections.precision.rangeRow")}
                  info={{ title: t("projections.precision.rangeRow"), text: `${t("projections.precision.periodHelp")} ${t("projections.precision.help")}` }}
                  titleClassName="text-xs font-semibold"
                />
                <span className="ml-2 font-normal text-gf-text-muted">{t("projections.precision.months", { p1: range.months })}</span>
              </td>
              <td className="py-2 px-3" data-tour="proj-accuracy-range">
                <div className="flex flex-wrap justify-center gap-1">
                  <ProjectionPrecisionChip
                    value={range.income}
                    label={t("projections.accuracy.income")}
                    tooltip={rangeFormulaTooltip(t, t("projections.accuracy.income"), range.income)}
                  />
                  <ProjectionPrecisionChip
                    value={range.expense}
                    label={t("projections.accuracy.expense")}
                    tooltip={rangeFormulaTooltip(t, t("projections.accuracy.expense"), range.expense)}
                  />
                  <ProjectionPrecisionChip
                    value={range.global}
                    label={t("projections.precision.global")}
                    tooltip={rangeFormulaTooltip(t, t("projections.precision.global"), range.global)}
                  />
                </div>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
      <p className="text-xs text-gf-text-muted mt-2 px-1">
        {t("projections.accuracy.help")}
      </p>
      <p className="text-xs text-gf-text-muted mt-1 px-1">
        {t("projections.precision.help")}
      </p>
    </div>
  );
}

export default ProjectionAccuracyReport;
