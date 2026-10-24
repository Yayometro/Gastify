"use client";

import React from "react";
import { Tooltip } from "antd";
import UniversalCategoIcon from "../UniversalCategoIcon";
import { usdFormatChanger } from "@/helpers/transformers/transactionsChange";
import { APP_INFO } from "@gastify/core/info/appInfo";
import { InfoTip } from "../InfoTip";
import { useT } from "@/i18n/client";

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
}

const TYPE_LABEL: Record<string, string> = {
  actual: "Closed",
  estimate: "Estimate",
  current: "In progress",
};

function formatMoney(value?: number | null): string {
  if (value === null || value === undefined) return "—";
  return usdFormatChanger(value);
}

interface HeaderTooltipProps {
  title: React.ReactNode;
}

function HeaderTooltip({ title }: HeaderTooltipProps): React.JSX.Element {
  return (
    <Tooltip title={title}>
      <div className="inline-block ml-1 align-middle">
        <UniversalCategoIcon type="fa/FaRegQuestionCircle" siz={12} />
      </div>
    </Tooltip>
  );
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

function ProjectionsView({ rows, onRowClick }: ProjectionsViewProps): React.JSX.Element {
  const t = useT();
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full min-w-[600px] text-center bg-gf-surface rounded-2xl overflow-hidden">
        <thead>
          <tr className="bg-purple-600 text-white">
            <th className="py-2 px-3"><span className="inline-flex items-center gap-1">{t("projections.table.month")}<InfoTip info={APP_INFO.c_mo_leer_esta_tabla} /></span></th>
            <th className="py-2 px-3">{t("projections.income")}</th>
            <th className="py-2 px-3">{t("projections.expense")}</th>
            <th className="py-2 px-3">
              {t("projections.table.net")}
              <HeaderTooltip title={t("projections.table.netHelp")} />
            </th>
            <th className="py-2 px-3">
              {t("projections.table.balance")}
              <HeaderTooltip title={t("projections.table.balanceHelp")} />
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const income = row.type === "current" ? row.projectedIncome : row.income;
            const expense = row.type === "current" ? row.projectedExpense : row.expense;
            return (
              <tr
                key={row.monthName}
                className={`capitalize cursor-pointer hover:bg-gf-accent-soft-bg border-b border-gf-border ${
                  row.type === "current" ? "bg-gf-accent-soft-bg/60 font-medium" : ""
                }`}
                onClick={() => onRowClick(row)}
              >
                <td className="py-2 px-3">
                  {row.monthName}
                  <span className="block text-[10px] text-gf-text-muted normal-case">
                    {TYPE_LABEL[row.type]}
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
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="text-xs text-gf-text-muted mt-2 px-1">
        {t("projections.table.balanceAnchor")}
      </p>
    </div>
  );
}

export default ProjectionsView;
