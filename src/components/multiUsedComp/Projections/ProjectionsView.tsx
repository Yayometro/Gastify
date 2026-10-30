"use client";

import React from "react";
import { Tooltip } from "antd";
import { usdFormatChanger } from "@/helpers/transformers/transactionsChange";

import TitleWithHelp from "../TitleWithHelp";
import type { ComponentTourId } from "@gastify/core/tour/tourSteps";
import { useT, useInfo } from "@/i18n/client";
import { monthAccuracy, type AccuracyMonthInput } from "@gastify/core/transformers/projectionAccuracy";
import { ProjectionPrecisionChip, singleValueFormulaTooltip } from "./ProjectionPrecisionChip";

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
  historicalIncome?: number;
  historicalExpense?: number;
  hasTransactions?: boolean;
  shadowIncome?: number;
  actualIncome?: number;
  shadowExpense?: number;
  actualExpense?: number;
  [key: string]: unknown;
}

export interface ProjectionsViewProps {
  rows: ProjectionRow[];
  onRowClick: (row: ProjectionRow) => void;
  // The tutorial the compass button in the table's header starts, when the screen that shows the table has one.
  tutorial?: ComponentTourId;
  // Projected-vs-actual figures per month, keyed by the row's monthName. When given, a
  // "Precisión" column is shown; a month without an entry (not closed, no projection) stays blank.
  accuracyByMonth?: Record<string, AccuracyMonthInput>;
}

const TYPE_LABEL: Record<string, string> = {
  actual: "web.closed",
  estimate: "web.estimate",
  current: "web.in.progress.2",
};

function formatMoney(value?: number | null): string {
  if (value === null || value === undefined) return "—";
  return usdFormatChanger(value);
}

const getIncomeColorClass = (type?: string): string => {
  switch (type) {
    case "actual":
      return "text-green-400 font-normal"; // Closed/past months - historical green, normal weight
    case "current":
      return "text-green-400 font-normal"; // Current active month - present green, normal weight
    case "estimate":
    default:
      return "text-emerald-500 font-normal"; // Future estimated months - lighter green, normal weight
  }
};

const getExpenseColorClass = (type?: string): string => {
  switch (type) {
    case "actual":
      return "text-red-400 font-normal"; // Closed/past months - historical red, normal weight
    case "current":
      return "text-red-500 font-normal"; // Current active month - present red, normal weight
    case "estimate":
    default:
      return "text-rose-400 font-normal"; // Future estimated months - lighter coral red, normal weight
  }
};

function ProjectionsView({ rows, onRowClick, tutorial, accuracyByMonth }: ProjectionsViewProps): React.JSX.Element {
  const { APP_INFO } = useInfo();
  const t = useT();
  return (
    <div className="w-full overflow-x-auto">
      <TitleWithHelp
        as="h2"
        title={t("projections.table.heading")}
        info={APP_INFO.c_mo_leer_esta_tabla}
        tour={tutorial}
        tourLabel={tutorial ? t(`tour.${tutorial}.name`) : undefined}
        titleClassName="text-xl text-purple-300"
        className="mb-2 justify-center"
        dataTour="proj-table-title"
      />
      <table className="w-full min-w-[600px] text-center bg-gf-surface rounded-2xl overflow-hidden">
        <thead>
          <tr className="bg-purple-600 text-white" data-tour="proj-table-head">
            <th className="py-2 px-3">{t("projections.table.month")}</th>
            <th className="py-2 px-3">{t("projections.income")}</th>
            <th className="py-2 px-3">{t("projections.expense")}</th>
            <th className="py-2 px-3">
              <TitleWithHelp
                title={t("projections.table.net")}
                info={{ title: t("projections.table.net"), text: t("projections.table.netHelp") }}
                className="justify-center"
              />
            </th>
            <th className="py-2 px-3" data-tour="proj-col-balance">
              <TitleWithHelp
                title={t("projections.table.balance")}
                info={{ title: t("projections.table.balance"), text: t("projections.table.balanceHelp") }}
                className="justify-center"
              />
            </th>
            {accuracyByMonth && (
              <th className="py-2 px-3" data-tour="his-proj-col-accuracy">
                <TitleWithHelp
                  title={t("projections.precision.monthlyColumn")}
                  info={{ title: t("projections.precision.monthlyColumn"), text: t("projections.precision.help") }}
                  className="justify-center"
                />
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, position) => {
            const income = row.type === "current" ? row.projectedIncome : row.income;
            const expense = row.type === "current" ? row.projectedExpense : row.expense;
            return (
              <tr
                key={row.monthName}
                className={`capitalize cursor-pointer hover:bg-gf-accent-soft-bg border-b border-gf-border ${
                  row.type === "current" ? "bg-gf-accent-soft-bg/60 font-medium" : ""
                }`}
                onClick={() => onRowClick(row)}
                data-tour={row.type === "current" ? "proj-row-current" : position === 0 ? "proj-row" : undefined}
              >
                <td className="py-2 px-3">
                  {row.monthName}
                  <span className="block text-[10px] text-gf-text-muted normal-case">
                    {t(TYPE_LABEL[row.type])}
                  </span>
                </td>
                <td className={`py-2 px-3 ${getIncomeColorClass(row.type)}`}>
                  {formatMoney(income)}
                </td>
                <td className={`py-2 px-3 ${getExpenseColorClass(row.type)}`}>
                  {formatMoney(expense)}
                </td>
                <td
                  className={`py-2 px-3 ${
                    row.net >= 0
                      ? getIncomeColorClass(row.type)
                      : getExpenseColorClass(row.type)
                  }`}
                >
                  {formatMoney(row.net)}
                </td>
                <td className="py-2 px-3">
                  {row.balance != null ? (
                    <>
                      {formatMoney(row.balance)}
                      {row.type === "actual" && row.manualBalance !== undefined && (
                        <span className="block text-[9px] text-gf-text-muted normal-case">{t("projections.table.manuallySet")}</span>
                      )}
                    </>
                  ) : row.estimatedBalance != null ? (
                    <Tooltip title={t("projections.table.basis")}>
                      <span className="text-gf-text-muted font-normal">
                        {formatMoney(row.estimatedBalance)}
                        <span className="block text-[9px] normal-case">{t("projections.table.approx")}</span>
                      </span>
                    </Tooltip>
                  ) : (
                    formatMoney(row.balance)
                  )}
                </td>
                {accuracyByMonth && (
                  <td className="py-2 px-3">
                    {accuracyByMonth[row.monthName] && (() => {
                      const input = accuracyByMonth[row.monthName];
                      const acc = monthAccuracy(input);
                      return (
                        <div className="flex flex-col items-center gap-1 text-xs">
                          <ProjectionPrecisionChip
                            value={acc.income}
                            label={t("projections.accuracy.income")}
                            tooltip={singleValueFormulaTooltip(t, `${t("projections.accuracy.income")} · ${row.monthName}`, input.projectedIncome, input.actualIncome)}
                          />
                          <ProjectionPrecisionChip
                            value={acc.expense}
                            label={t("projections.accuracy.expense")}
                            tooltip={singleValueFormulaTooltip(t, `${t("projections.accuracy.expense")} · ${row.monthName}`, input.projectedExpense, input.actualExpense)}
                          />
                        </div>
                      );
                    })()}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="text-xs text-gf-text-muted mt-2 px-1" data-tour="proj-table-note">
        {t("projections.table.balanceAnchor")}
      </p>
    </div>
  );
}

export default ProjectionsView;
