"use client";

import React from "react";
import { Tooltip } from "antd";
import UniversalCategoIcon from "../UniversalCategoIcon";
import { usdFormatChanger } from "@/helpers/transformers/transactionsChange";

const TYPE_LABEL = {
  actual: "Closed",
  estimate: "Estimate",
  current: "In progress",
};

function formatMoney(value) {
  if (value === null || value === undefined) return "—";
  return usdFormatChanger(value);
}

function HeaderTooltip({ title }) {
  return (
    <Tooltip title={title}>
      <div className="inline-block ml-1 align-middle">
        <UniversalCategoIcon type="fa/FaRegQuestionCircle" siz={12} />
      </div>
    </Tooltip>
  );
}

const getIncomeColorClass = (type) => {
  switch (type) {
    case "actual":
      return "text-green-700 font-normal"; // Closed/past months - historical green, normal weight
    case "current":
      return "text-green-600 font-normal"; // Current active month - present green, normal weight
    case "estimate":
    default:
      return "text-emerald-500 font-normal"; // Future estimated months - lighter green, normal weight
  }
};

const getExpenseColorClass = (type) => {
  switch (type) {
    case "actual":
      return "text-red-700 font-normal"; // Closed/past months - historical red, normal weight
    case "current":
      return "text-red-500 font-normal"; // Current active month - present red, normal weight
    case "estimate":
    default:
      return "text-rose-400 font-normal"; // Future estimated months - lighter coral red, normal weight
  }
};

function ProjectionsView({ rows, onRowClick }) {
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full min-w-[600px] text-center bg-white rounded-2xl overflow-hidden">
        <thead>
          <tr className="bg-purple-600 text-white">
            <th className="py-2 px-3">Month</th>
            <th className="py-2 px-3">Income</th>
            <th className="py-2 px-3">Expense</th>
            <th className="py-2 px-3">
              Net
              <HeaderTooltip title="Income minus expense for that single month." />
            </th>
            <th className="py-2 px-3">
              Balance
              <HeaderTooltip title="Running account total from today forward. Past months show a dash unless you set one manually by clicking that month." />
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
                className={`capitalize cursor-pointer hover:bg-purple-50 border-b border-purple-100 ${
                  row.type === "current" ? "bg-purple-100/60 font-medium" : ""
                }`}
                onClick={() => onRowClick(row)}
              >
                <td className="py-2 px-3">
                  {row.monthName}
                  <span className="block text-[10px] text-gray-400 normal-case">
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
                        <span className="block text-[9px] text-gray-400 normal-case">manually set</span>
                      )}
                    </>
                  ) : row.estimatedBalance != null ? (
                    <Tooltip title="Basado en tus transacciones reales donde existen, y en tu ingreso/gasto aproximado el resto del tiempo - no un valor exacto.">
                      <span className="text-gray-400 font-normal">
                        {formatMoney(row.estimatedBalance)}
                        <span className="block text-[9px] normal-case">aproximado</span>
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
      <p className="text-xs text-gray-400 mt-2 px-1">
        Balance is anchored to your accounts&apos; current totals (as of today) and may not
        reflect every past transaction if account balances aren&apos;t kept up to date.
      </p>
    </div>
  );
}

export default ProjectionsView;
