"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { Spin, Tooltip } from "antd";
import BasicModal from "@/components/modals/basicModal/BasicModal";
import CategoIcon from "../CategoIcon";
import UniversalCategoIcon from "../UniversalCategoIcon";
import Movements from "../Movements";
import runNotify from "@/helpers/gastifyNotifier";
import { usdFormatChanger } from "@/helpers/transformers/transactionsChange";
import { getYearMonthDateRange } from "@/helpers/timeFunctions/timeFunctions";
import CurrencyBreakdownChips from "../CurrencyBreakdownChips";

const Column = dynamic(() => import("@ant-design/plots").then((m) => m.Column), {
  ssr: false,
});

function QuestionTooltip({ title }) {
  return (
    <Tooltip title={title}>
      <div className="inline-block ml-1 align-middle text-purple-400">
        <UniversalCategoIcon type="fa/FaRegQuestionCircle" siz={12} />
      </div>
    </Tooltip>
  );
}

function ProjectionMonthDetailModal({
  monthRow,
  bucketBreakdown,
  incomeOccurrences,
  incomeCurrencyBreakdown,
  expenseCurrencyBreakdown,
  walletPrimaryCurrency,
  unexpectedBuffer,
  unexpectedIncomeBuffer,
  onSaveBuffers,
  onSaveMonthBalance,
  onClose,
  mail,
}) {
  const [bufferValue, setBufferValue] = useState(unexpectedBuffer ?? 0);
  const [incomeBufferValue, setIncomeBufferValue] = useState(unexpectedIncomeBuffer ?? 0);
  const [balanceValue, setBalanceValue] = useState(monthRow?.manualBalance ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingBalance, setIsSavingBalance] = useState(false);
  const [showTransactions, setShowTransactions] = useState(false);

  if (!monthRow) return null;

  // Same [start, end] shape Movements already accepts via timePeriodFromFather
  // elsewhere in the app (e.g. Dashboard.jsx) - reusing the real Movements UI
  // here instead of building a second transaction list from scratch.
  const monthDateRange = getYearMonthDateRange(new Date(monthRow.year, 0, 1)).get(monthRow.monthName);

  const chartData = (bucketBreakdown || []).flatMap((row) => [
    { label: row.label, type: "Budgeted", value: row.budgeted },
    { label: row.label, type: "Actual", value: row.actual },
  ]);

  const config = {
    data: chartData,
    xField: "label",
    yField: "value",
    colorField: "type",
    group: true,
    autoFit: true,
    height: 260,
  };

  const handleSaveBuffers = async () => {
    try {
      setIsSaving(true);
      await onSaveBuffers({
        unexpectedBuffer: Number(bufferValue),
        unexpectedIncomeBuffer: Number(incomeBufferValue),
      });
      runNotify("ok", "Unexpected buffers updated");
    } catch (e) {
      runNotify("error", String(e));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveBalance = async () => {
    try {
      setIsSavingBalance(true);
      await onSaveMonthBalance(Number(balanceValue));
      runNotify("ok", "Balance saved for this month");
    } catch (e) {
      runNotify("error", String(e));
    } finally {
      setIsSavingBalance(false);
    }
  };

  return (
    <BasicModal
      close={onClose}
      renderContent={
        <div
          className={`content absolute bg-white border-2 border-purple-400 rounded-2xl overflow-hidden z-[1001] w-[95%] max-h-[85vh] ${
            showTransactions ? "sm:max-w-[1500px]" : "max-w-[650px]"
          }`}
        >
          <div
            className={`flex max-h-[85vh] overflow-y-auto sm:overflow-hidden ${
              showTransactions ? "flex-col sm:flex-row" : "flex-col"
            }`}
          >
            <div className="relative flex-1 min-w-0 px-6 pt-8 pb-6 sm:overflow-y-auto">
          <div
            className="absolute top-3 right-3 border-2 rounded-full text-purple-700 p-1 cursor-pointer"
            onClick={onClose}
          >
            <CategoIcon type="MdClose" siz={20} />
          </div>
          <h1 className="text-2xl text-purple-800 capitalize mb-1 flex items-center">
            <span>{monthRow.monthName} {monthRow.year}</span>
            <QuestionTooltip title="Closed months show your real transactions. Future months are a pure estimate built from your active Budgets (expenses) and Income Sources (income). The current month blends both: it starts as an estimate and fills in with real numbers as the month happens. Use 'See transactions' to view the actual movements behind these numbers, and the buffers below to manually account for money that isn't tied to any Budget or Income Source." />
          </h1>
          <p className="text-xs text-gray-500 mb-4">
            {monthRow.type === "actual" && "Closed month — showing real transactions."}
            {monthRow.type === "estimate" && "Future month — pure estimate from your Budgets and Income Sources."}
            {monthRow.type === "current" && "Current month — projected value climbs from your estimate to your real spend as it happens."}
          </p>

          {monthDateRange && (
            <button
              type="button"
              onClick={() => setShowTransactions((v) => !v)}
              className="mb-4 flex items-center gap-1.5 text-xs font-medium text-purple-600 hover:text-purple-500 transition-colors w-fit"
            >
              <CategoIcon type="MdList" siz={14} />
              {showTransactions ? "Hide transactions" : "See transactions"}
            </button>
          )}

          {monthRow.type === "current" && (
            <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
              <div className="bg-purple-50 rounded-xl p-2">
                <p className="text-gray-500">Income</p>
                <p className="text-lg text-green-600">{usdFormatChanger(monthRow.projectedIncome || 0)}</p>
                <p className="text-xs text-gray-400">
                  real so far: {usdFormatChanger(monthRow.actualIncome || 0)} / expected: {usdFormatChanger(monthRow.shadowIncome || 0)}
                </p>
                <CurrencyBreakdownChips breakdown={incomeCurrencyBreakdown} walletPrimaryCurrency={walletPrimaryCurrency} />
              </div>
              <div className="bg-purple-50 rounded-xl p-2">
                <p className="text-gray-500">Expense</p>
                <p className="text-lg text-red-500">{usdFormatChanger(monthRow.projectedExpense || 0)}</p>
                <p className="text-xs text-gray-400">
                  real so far: {usdFormatChanger(monthRow.actualExpense || 0)} / budgeted: {usdFormatChanger(monthRow.shadowExpense || 0)}
                </p>
                <CurrencyBreakdownChips breakdown={expenseCurrencyBreakdown} walletPrimaryCurrency={walletPrimaryCurrency} />
              </div>
            </div>
          )}

          {monthRow.type === "estimate" && (
            <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
              <div className="bg-purple-50 rounded-xl p-2">
                <p className="text-gray-500">Estimated income</p>
                <p className="text-lg text-emerald-500">{usdFormatChanger(monthRow.income || 0)}</p>
              </div>
              <div className="bg-purple-50 rounded-xl p-2">
                <p className="text-gray-500">Estimated expense</p>
                <p className="text-lg text-rose-400">{usdFormatChanger(monthRow.expense || 0)}</p>
              </div>
            </div>
          )}

          {monthRow.type === "actual" && (
            <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
              <div className="bg-purple-50 rounded-xl p-2">
                <p className="text-gray-500">Real income</p>
                <p className="text-lg text-green-700">{usdFormatChanger(monthRow.income || 0)}</p>
                {monthRow.historicalIncome !== undefined && (
                  <p className="text-xs text-gray-400">expected back then: {usdFormatChanger(monthRow.historicalIncome || 0)}</p>
                )}
                <CurrencyBreakdownChips breakdown={incomeCurrencyBreakdown} walletPrimaryCurrency={walletPrimaryCurrency} />
              </div>
              <div className="bg-purple-50 rounded-xl p-2">
                <p className="text-gray-500">Real expense</p>
                <p className="text-lg text-red-700">{usdFormatChanger(monthRow.expense || 0)}</p>
                {monthRow.historicalExpense !== undefined && (
                  <p className="text-xs text-gray-400">budgeted back then: {usdFormatChanger(monthRow.historicalExpense || 0)}</p>
                )}
                <CurrencyBreakdownChips breakdown={expenseCurrencyBreakdown} walletPrimaryCurrency={walletPrimaryCurrency} />
              </div>
            </div>
          )}

          {bucketBreakdown && bucketBreakdown.length > 0 && (
            <div className="w-full mb-4">
              <Column {...config} />
            </div>
          )}

          {incomeOccurrences && incomeOccurrences.length > 0 && (
            <div className="w-full mb-4">
              <h2 className="text-purple-800 mb-1">Expected income this month</h2>
              <ul className="flex flex-col gap-1">
                {incomeOccurrences.map((row, i) => (
                  <li key={i} className="flex justify-between text-sm bg-purple-50 rounded-xl px-3 py-1">
                    <span>{row.name}</span>
                    <span>
                      {row.occurrences} × {usdFormatChanger(row.amount)} = {usdFormatChanger(row.occurrences * row.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {monthRow.type === "actual" && (
            <div className="form-trans-edit w-full flex flex-col gap-2 mb-6 pt-3 border-t border-purple-100">
              <div className="w-full">
                <p className="label-tfp flex items-center mb-1">
                  <span>Set actual balance for this month</span>
                  <QuestionTooltip title="The app can't compute past balances automatically. If you know what your real account balance was at the end of this month, record it here." />
                </p>
                <div className="flex items-center gap-2 w-full">
                  <input
                    type="number"
                    value={balanceValue}
                    onChange={(e) => setBalanceValue(e.target.value)}
                    placeholder="e.g. 45000"
                    className="w-full"
                  />
                  <button
                    type="button"
                    className="h-10 px-6 bg-purple-600 text-white font-semibold text-xs rounded-full hover:bg-purple-500 transition-colors shrink-0 shadow-sm cursor-pointer flex items-center justify-center"
                    onClick={handleSaveBalance}
                  >
                    {isSavingBalance ? <Spin size="small" /> : "Save"}
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="form-trans-edit w-full flex flex-col gap-4 mt-2 pt-4 border-t border-purple-100">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
              <div className="w-full">
                <p className="label-tfp flex items-center mb-1">
                  <span>Unexpected expense buffer</span>
                  <QuestionTooltip title="A manual amount added to your expense estimate, for spending that doesn't have its own Budget." />
                </p>
                <input
                  type="number"
                  value={bufferValue}
                  onChange={(e) => setBufferValue(e.target.value)}
                  placeholder="0"
                  className="w-full"
                />
              </div>
              <div className="w-full">
                <p className="label-tfp flex items-center mb-1">
                  <span>Unexpected income buffer</span>
                  <QuestionTooltip title="A manual amount added to your income estimate, for money coming in that isn't tied to a recurring Income Source." />
                </p>
                <input
                  type="number"
                  value={incomeBufferValue}
                  onChange={(e) => setIncomeBufferValue(e.target.value)}
                  placeholder="0"
                  className="w-full"
                />
              </div>
            </div>
            <button
              type="button"
              className="w-full h-10 bg-purple-600 text-white font-semibold text-xs rounded-full hover:bg-purple-500 transition-colors shadow-sm cursor-pointer flex items-center justify-center"
              onClick={handleSaveBuffers}
            >
              {isSaving ? <Spin size="small" /> : "Save buffers"}
            </button>
          </div>
            </div>

            {showTransactions && monthDateRange && (
              <div className="sm:w-[46%] sm:min-w-[420px] sm:max-w-[820px] shrink-0 border-t sm:border-t-0 sm:border-l border-purple-100 sm:overflow-y-auto px-4 py-6">
                <Movements
                  mail={mail}
                  timePeriodFromFather={[monthDateRange.start, monthDateRange.end]}
                />
              </div>
            )}
          </div>
        </div>
      }
    />
  );
}

export default ProjectionMonthDetailModal;
