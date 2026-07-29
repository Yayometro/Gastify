"use client";

import React from "react";

const TYPE_LABEL = {
  actual: "Closed",
  estimate: "Estimate",
  current: "In progress",
};

function formatMoney(value) {
  if (value === null || value === undefined) return "—";
  return `$${Number(value).toFixed(2)}`;
}

function ProjectionsView({ rows, onRowClick }) {
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full min-w-[600px] text-center bg-white rounded-2xl overflow-hidden">
        <thead>
          <tr className="bg-purple-600 text-white">
            <th className="py-2 px-3">Month</th>
            <th className="py-2 px-3">Income</th>
            <th className="py-2 px-3">Expense</th>
            <th className="py-2 px-3">Net</th>
            <th className="py-2 px-3">Balance</th>
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
                <td className="py-2 px-3 text-green-600">{formatMoney(income)}</td>
                <td className="py-2 px-3 text-red-500">{formatMoney(expense)}</td>
                <td className={`py-2 px-3 ${row.net >= 0 ? "text-green-700" : "text-red-700"}`}>
                  {formatMoney(row.net)}
                </td>
                <td className="py-2 px-3">{formatMoney(row.balance)}</td>
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
