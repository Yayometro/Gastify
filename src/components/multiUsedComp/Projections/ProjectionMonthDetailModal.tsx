"use client";

import React, { useState } from "react";
import { Spin, Tooltip } from "antd";
import BasicModal from "@/components/modals/basicModal/BasicModal";
import dynamic from "next/dynamic";

// Only drawn when the month detail is opened, so it is not part of the page's initial JavaScript.
const ComparativeColumnChart = dynamic(
  () => import("@/components/multiUsedComp/chartsComponents/comparativeColumnChart/ComparativeColumnChart"),
  { ssr: false }
);
import { formatMoneyMajor } from "@gastify/core/money/currencies";
import CategoIcon from "../CategoIcon";
import UniversalCategoIcon from "../UniversalCategoIcon";
import Movements from "../Movements";
import runNotify from "@/helpers/gastifyNotifier";
import { usdFormatChanger } from "@/helpers/transformers/transactionsChange";
import { getYearMonthDateRange } from "@gastify/core/time/timeFunctions";
import CurrencyBreakdownChips, {
  type CurrencyBreakdownData,
} from "../CurrencyBreakdownChips";
import type { ProjectionTableRow } from "@/hooks/useProjectionTable";

import { InfoTip } from "@/components/multiUsedComp/InfoTip";
import { useT, useInfo } from "@/i18n/client";


export interface BucketBreakdownItem {
  label: string;
  budgeted: number;
  actual: number;
}

export interface IncomeOccurrenceItem {
  name?: string;
  amount: number;
  occurrences: number;
}

export interface BufferRevisionItem {
  unexpectedBuffer?: number;
  unexpectedIncomeBuffer?: number;
  expenseMoney?: {
    amountMinor: number;
    currency: string;
  };
  incomeMoney?: {
    amountMinor: number;
    currency: string;
  };
  updatedAt?: Date | string;
}

export interface SaveBuffersPayload {
  unexpectedBuffer: number;
  unexpectedIncomeBuffer: number;
}

export interface ProjectionMonthDetailModalProps {
  monthRow?: ProjectionTableRow | null;
  bucketBreakdown?: BucketBreakdownItem[] | null;
  incomeOccurrences?: IncomeOccurrenceItem[] | null;
  incomeCurrencyBreakdown?: CurrencyBreakdownData | null;
  expenseCurrencyBreakdown?: CurrencyBreakdownData | null;
  walletPrimaryCurrency?: string;
  unexpectedBuffer?: number | null;
  unexpectedIncomeBuffer?: number | null;
  bufferRevisions?: BufferRevisionItem[] | null;
  onSaveBuffers: (buffers: SaveBuffersPayload) => Promise<void> | void;
  onSaveMonthBalance: (balance: number) => Promise<void> | void;
  onClose: () => void;
  mail?: string;
}

interface QuestionTooltipProps {
  title: React.ReactNode;
}

function QuestionTooltip({ title }: QuestionTooltipProps): React.JSX.Element {
  return (
    <Tooltip title={title}>
      <div className="inline-block ml-1 align-middle text-purple-400">
        <UniversalCategoIcon type="fa/FaRegQuestionCircle" siz={12} />
      </div>
    </Tooltip>
  );
}

// Timestamp of a revision, 0 when it is missing or invalid so the sort stays stable (bug 65).
function revisionTime(value?: Date | string | null): number {
  const time = +new Date(value as string | number | Date);
  return Number.isNaN(time) ? 0 : time;
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
  bufferRevisions,
  onSaveBuffers,
  onSaveMonthBalance,
  onClose,
  mail,
}: ProjectionMonthDetailModalProps): React.JSX.Element | null {
  const { APP_INFO } = useInfo();
  const t = useT();
  const [bufferValue, setBufferValue] = useState<number | string>(unexpectedBuffer ?? 0);
  const [incomeBufferValue, setIncomeBufferValue] = useState<number | string>(unexpectedIncomeBuffer ?? 0);
  const [balanceValue, setBalanceValue] = useState<number | string>(monthRow?.manualBalance ?? "");
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isSavingBalance, setIsSavingBalance] = useState<boolean>(false);
  const [showTransactions, setShowTransactions] = useState<boolean>(false);

  if (!monthRow) return null;

  // Same [start, end] shape Movements already accepts via timePeriodFromFather
  // elsewhere in the app (e.g. Dashboard.jsx) - reusing the real Movements UI
  // here instead of building a second transaction list from scratch.
  const monthDateRange = getYearMonthDateRange(new Date(monthRow.year as number, 0, 1)).get(monthRow.monthName);

  // Budgeted vs actual per bucket, side by side.
  const chartData = (bucketBreakdown || []).flatMap((row) => [
    { type: String(row.label), transactionType: "Budgeted", value: Number(row.budgeted) || 0, color: "#a78bfa" },
    { type: String(row.label), transactionType: "Actual", value: Number(row.actual) || 0, color: "#f87171" },
  ]);

  const handleSaveBuffers = async () => {
    try {
      setIsSaving(true);
      await onSaveBuffers({
        unexpectedBuffer: Number(bufferValue),
        unexpectedIncomeBuffer: Number(incomeBufferValue),
      });
      runNotify("ok", t("projections.error.buffers"));
    } catch (e) {
      runNotify("error", String(e));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveBalance = async () => {
    // Nothing typed is not a balance of 0 (Number("") is 0, bug 64).
    if (String(balanceValue).trim() === "" || !Number.isFinite(Number(balanceValue))) {
      runNotify("error", t("projections.balance.enterFirst"));
      return;
    }
    try {
      setIsSavingBalance(true);
      await onSaveMonthBalance(Number(balanceValue));
      runNotify("ok", t("projections.balance.saved"));
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
          className={`content absolute gf-glass-violet rounded-2xl overflow-hidden z-[1001] w-[95%] max-h-[85vh] ${
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
            className="absolute top-3 right-3 rounded-full gf-glass-card p-1.5 text-purple-100 hover:text-white transition-colors cursor-pointer"
            onClick={onClose}
          >
            <CategoIcon type="MdClose" siz={20} />
          </div>
          <h1 className="text-2xl text-purple-300 capitalize mb-1 flex items-center">
            <span>{monthRow.monthName} {monthRow.year}</span>
            <InfoTip info={APP_INFO.c_mo_leer_este_mes} />
            <QuestionTooltip title={t("projections.intro")} />
          </h1>
          <p className="text-xs text-gf-text-muted mb-4">
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
              <div className="bg-gf-accent-soft-bg rounded-xl p-2">
                <p className="text-gf-text-muted">{t("projections.income")}</p>
                <p className="text-lg text-green-400">{usdFormatChanger(monthRow.projectedIncome || 0)}</p>
                <p className="text-xs text-gf-text-muted">
                  {t("projections.realSoFar", { p1: usdFormatChanger(monthRow.actualIncome || 0), p2: usdFormatChanger(monthRow.shadowIncome || 0) })}
                </p>
                <CurrencyBreakdownChips breakdown={incomeCurrencyBreakdown} walletPrimaryCurrency={walletPrimaryCurrency} />
              </div>
              <div className="bg-gf-accent-soft-bg rounded-xl p-2">
                <p className="text-gf-text-muted">{t("projections.expense")}</p>
                <p className="text-lg text-red-500">{usdFormatChanger(monthRow.projectedExpense || 0)}</p>
                <p className="text-xs text-gf-text-muted">
                  {t("projections.realBudgeted", { p1: usdFormatChanger(monthRow.actualExpense || 0), p2: usdFormatChanger(monthRow.shadowExpense || 0) })}
                </p>
                <CurrencyBreakdownChips breakdown={expenseCurrencyBreakdown} walletPrimaryCurrency={walletPrimaryCurrency} />
              </div>
            </div>
          )}

          {monthRow.type === "estimate" && (
            <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
              <div className="bg-gf-accent-soft-bg rounded-xl p-2">
                <p className="text-gf-text-muted">{t("projections.estimatedIncome")}</p>
                <p className="text-lg text-emerald-500">{usdFormatChanger(monthRow.income || 0)}</p>
              </div>
              <div className="bg-gf-accent-soft-bg rounded-xl p-2">
                <p className="text-gf-text-muted">{t("projections.estimatedExpense")}</p>
                <p className="text-lg text-rose-400">{usdFormatChanger(monthRow.expense || 0)}</p>
              </div>
            </div>
          )}

          {monthRow.type === "actual" && (
            <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
              <div className="bg-gf-accent-soft-bg rounded-xl p-2">
                <p className="text-gf-text-muted">{t("projections.realIncome")}</p>
                <p className="text-lg text-green-400">{usdFormatChanger(monthRow.income || 0)}</p>
                {monthRow.historicalIncome !== undefined && (
                  <p className="text-xs text-gf-text-muted">{t("projections.expectedThen", { p1: usdFormatChanger(monthRow.historicalIncome || 0) })}</p>
                )}
                <CurrencyBreakdownChips breakdown={incomeCurrencyBreakdown} walletPrimaryCurrency={walletPrimaryCurrency} />
              </div>
              <div className="bg-gf-accent-soft-bg rounded-xl p-2">
                <p className="text-gf-text-muted">{t("projections.realExpense")}</p>
                <p className="text-lg text-red-400">{usdFormatChanger(monthRow.expense || 0)}</p>
                {monthRow.historicalExpense !== undefined && (
                  <p className="text-xs text-gf-text-muted">{t("projections.budgetedThen", { p1: usdFormatChanger(monthRow.historicalExpense || 0) })}</p>
                )}
                <CurrencyBreakdownChips breakdown={expenseCurrencyBreakdown} walletPrimaryCurrency={walletPrimaryCurrency} />
              </div>
            </div>
          )}

          {bucketBreakdown && bucketBreakdown.length > 0 && (
            <div className="w-full mb-4">
              <ComparativeColumnChart
                data={chartData}
                propPlus={{
                  mode: "grouped",
                  height: 260,
                  legend: [
                    { id: "Budgeted", label: t("projections.budgeted"), color: "#a78bfa" },
                    { id: "Actual", label: t("projections.actual"), color: "#f87171" },
                  ],
                  valueFormat: (value) => formatMoneyMajor(value, walletPrimaryCurrency),
                }}
              />
            </div>
          )}

          {incomeOccurrences && incomeOccurrences.length > 0 && (
            <div className="w-full mb-4">
              <h2 className="text-purple-300 mb-1">{t("projections.expectedIncomeThisMonth")}</h2>
              <ul className="flex flex-col gap-1">
                {incomeOccurrences.map((row, i) => (
                  <li key={i} className="flex justify-between text-sm bg-gf-accent-soft-bg rounded-xl px-3 py-1">
                    <span>{row.name}</span>
                    <span>
                      {row.occurrences} × {usdFormatChanger(row.amount)} = {usdFormatChanger((Number(row.occurrences) || 0) * (Number(row.amount) || 0))}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {monthRow.type === "actual" && (
            <div className="form-trans-edit w-full flex flex-col gap-2 mb-6 pt-3 border-t border-gf-border">
              <div className="w-full">
                <p className="label-tfp flex items-center mb-1">
                  <span>{t("projections.balance.setThisMonth")}</span>
                  <InfoTip info={APP_INFO.saldo_real_del_mes} />
                  <QuestionTooltip title={t("projections.balance.help")} />
                </p>
                <div className="flex items-center gap-2 w-full">
                  <input
                    type="number"
                    value={balanceValue}
                    onChange={(e) => setBalanceValue(e.target.value)}
                    placeholder={t("projections.balance.example")}
                    className="w-full"
                  />
                  <button
                    type="button"
                    className="h-10 px-6 gf-glass-button text-white font-semibold text-xs rounded-full transition-colors shrink-0 cursor-pointer flex items-center justify-center"
                    onClick={handleSaveBalance}
                  >
                    {isSavingBalance ? <Spin size="small" /> : "Save"}
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="form-trans-edit w-full flex flex-col gap-4 mt-2 pt-4 border-t border-gf-border">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
              <div className="w-full">
                <p className="label-tfp flex items-center mb-1">
                  <span>{t("projections.buffer.expense")}</span>
                  <InfoTip info={APP_INFO.tope_de_gasto_inesperado} />
                  <QuestionTooltip title={t("projections.buffer.expenseHelp")} />
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
                  <span>{t("projections.buffer.income")}</span>
                  <InfoTip info={APP_INFO.tope_de_ingreso_inesperado} />
                  <QuestionTooltip title={t("projections.buffer.incomeHelp")} />
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
              className="w-full h-10 gf-glass-button text-white font-semibold text-xs rounded-full transition-colors cursor-pointer flex items-center justify-center"
              onClick={handleSaveBuffers}
            >
              {isSaving ? <Spin size="small" /> : "Save buffers"}
            </button>
            {bufferRevisions && bufferRevisions.length > 0 && (
              <details className="text-xs">
                <summary className="text-purple-500 cursor-pointer select-none">
                  {t("projections.history.title", { p1: bufferRevisions.length })}
                </summary>
                <ul className="mt-2 flex flex-col gap-1">
                  {[...bufferRevisions]
                    .sort((a, b) => revisionTime(a.updatedAt) - revisionTime(b.updatedAt))
                    .map((rev, i) => (
                      <li key={i} className="flex justify-between bg-gf-accent-soft-bg/70 rounded-lg px-2 py-1 text-gf-text-muted">
                        <span>
                          {rev.updatedAt && !Number.isNaN(revisionTime(rev.updatedAt)) ? new Date(rev.updatedAt as string | number | Date).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                        </span>
                        <span>
                          {t("projections.history.values", { p1: usdFormatChanger(rev.unexpectedBuffer || 0), p2: usdFormatChanger(rev.unexpectedIncomeBuffer || 0) })}
                        </span>
                      </li>
                    ))}
                </ul>
              </details>
            )}
          </div>
            </div>

            {showTransactions && monthDateRange && (
              <div className="sm:w-[46%] sm:min-w-[420px] sm:max-w-[820px] shrink-0 border-t sm:border-t-0 sm:border-l border-gf-border sm:overflow-y-auto px-4 py-6">
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
