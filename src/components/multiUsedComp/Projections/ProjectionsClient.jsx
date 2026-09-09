"use client";

import React, { useMemo, useState } from "react";
import { Skeleton, Tooltip } from "antd";
import useGetDataFromProvider from "@/hooks/getAllInfo/useGetInfoFromProvider";
import useProjectionTable from "@/hooks/useProjectionTable";
import fetcher from "@/helpers/fetcher";
import CategoIcon from "../CategoIcon";
import UniversalCategoIcon from "../UniversalCategoIcon";
import { usdFormatChanger } from "@/helpers/transformers/transactionsChange";
import IncomeSourcesPanel from "./IncomeSourcesPanel";
import HistoricalBaselinePanel from "./HistoricalBaselinePanel";
import ProjectionsView from "./ProjectionsView";
import ProjectionAccuracyReport from "./ProjectionAccuracyReport";
import ProjectionMonthDetailModal from "./ProjectionMonthDetailModal";
import ProjectionsInfoModal from "./ProjectionsInfoModal";
import { getTransactionsFromTimeRange, filterBillsOrIncomes } from "@/helpers/transformers/transactionsChange";
import { getMonthBucketBreakdown, getExpectedOccurrencesInMonth, getMonthCurrencyBreakdown } from "@/helpers/transformers/projectionsChange";
import { getValueActiveInMonth } from "@/helpers/transformers/budgetHistory";
import { isSpendingBudget } from "@/helpers/transformers/budgetTypes";
import PrimaryCurrencySelector from "../PrimaryCurrencySelector";

function ProjectionsClient({ mcSession }) {
  const { transacciones, budgets, accounts, wallet, user, loading } = useGetDataFromProvider();
  const [year, setYear] = useState(new Date().getFullYear());
  const [selectedMonthName, setSelectedMonthName] = useState(null);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const toFetch = fetcher();

  const walletPrimaryCurrency = wallet?.primaryCurrency || "MXN";

  // Fetch + currency-conversion + running-balance pipeline lives in
  // useProjectionTable (shared with /dashboard/history's own projections
  // table) - see that hook for the full breakdown of what it does.
  const {
    rows: rowsWithEstimates,
    accuracyRows,
    startingBalance,
    incomeSources,
    incomeSourcesConverted,
    projectionSettings,
    setProjectionSettings,
    projectionBaseline,
    monthlyBuffers,
    monthRanges,
    isLoading: settingsLoading,
    reloadSettings: loadSettings,
    reloadBaseline: loadBaseline,
  } = useProjectionTable({
    mail: mcSession,
    year,
    transactions: transacciones,
    budgets,
    accounts,
    walletPrimaryCurrency,
  });

  const selectedRow = rowsWithEstimates.find((r) => r.monthName === selectedMonthName) || null;
  const selectedMonthIndex = rowsWithEstimates.findIndex((r) => r.monthName === selectedMonthName);
  const selectedMonthBufferEntry = monthlyBuffers.find((m) => m.month === selectedMonthIndex);
  const selectedUnexpectedBuffer = selectedMonthBufferEntry?.unexpectedBuffer || 0;
  const selectedUnexpectedIncomeBuffer = selectedMonthBufferEntry?.unexpectedIncomeBuffer || 0;

  const selectedMonthDetails = useMemo(() => {
    if (!selectedRow) return { bucketBreakdown: [], incomeOccurrences: [], incomeCurrencyBreakdown: null, expenseCurrencyBreakdown: null };
    const { start, end } = monthRanges.get(selectedRow.monthName);
    const monthTx = getTransactionsFromTimeRange(transacciones || [], start, end);
    const { bills, incomes } = filterBillsOrIncomes(monthTx);
    const expenseCurrencyBreakdown = getMonthCurrencyBreakdown(bills, walletPrimaryCurrency);
    const incomeCurrencyBreakdown = getMonthCurrencyBreakdown(incomes, walletPrimaryCurrency);
    // Past months compare against the goalAmount that was actually active back
    // then (via history[]), not today's value - otherwise the chart would show
    // a budget you only set recently as if it applied to a much older month.
    const nonSavingBudgets = (budgets || []).filter(isSpendingBudget);
    const budgetsForChart =
      selectedRow.type === "actual"
        ? nonSavingBudgets
            .map((b) => {
              const resolved = getValueActiveInMonth(b.history, start);
              return resolved ? { ...b, goalAmount: resolved.goalAmount } : null;
            })
            .filter(Boolean)
        : nonSavingBudgets.filter((b) => !b.archived);
    const bucketBreakdown = getMonthBucketBreakdown(bills, budgetsForChart, selectedUnexpectedBuffer);
    const incomeOccurrences =
      selectedRow.type === "actual"
        ? []
        : (incomeSourcesConverted || [])
            .filter((s) => s.active && !s.archived)
            .map((s) => ({
              name: s.name,
              amount: s.amount,
              occurrences: getExpectedOccurrencesInMonth(s, start, end),
            }));
    return { bucketBreakdown, incomeOccurrences, incomeCurrencyBreakdown, expenseCurrencyBreakdown };
  }, [selectedRow, monthRanges, transacciones, budgets, incomeSourcesConverted, selectedUnexpectedBuffer, walletPrimaryCurrency]);

  const handleSaveBuffers = async ({ unexpectedBuffer: newBuffer, unexpectedIncomeBuffer: newIncomeBuffer }) => {
    const res = await toFetch.post("general-data/projections/update", {
      mail: mcSession,
      year,
      monthBuffer: {
        month: selectedMonthIndex,
        unexpectedBuffer: newBuffer,
        unexpectedIncomeBuffer: newIncomeBuffer,
      },
    });
    if (res.ok) setProjectionSettings(res.data);
  };

  const handleSaveMonthBalance = async (balance) => {
    const res = await toFetch.post("general-data/projections/update", {
      mail: mcSession,
      year,
      monthBalance: { month: selectedMonthIndex, balance },
    });
    if (res.ok) setProjectionSettings(res.data);
  };

  const isLoading = loading || settingsLoading;

  return (
    <div className="w-full h-full sm:pr-2 pb-10">
      <div className="w-full profile-img py-4 text-center text-white">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-thin">
          Projections
        </h1>
      </div>
      <div className="w-full flex items-center justify-center pt-2">
        <Tooltip title="Every figure in these projections is expressed in this currency. Change it here if you want projections in a different currency.">
          <div>
            <PrimaryCurrencySelector pcsWallet={wallet} />
          </div>
        </Tooltip>
      </div>
      <div className="content-profile-cont w-full h-full content-wallet-glass items-center mt-[10px] sm:mt-[20px] rounded-t-[60px] rounded-b-2xl px-4 sm:px-8 py-6">
        <div className="flex items-center justify-center gap-3 mb-2">
          <div className="cursor-pointer" onClick={() => setYear((y) => y - 1)}>
            <CategoIcon type="MdChevronLeft" siz={28} />
          </div>
          <h2 className="text-2xl text-purple-300">{year}</h2>
          <div className="cursor-pointer" onClick={() => setYear((y) => y + 1)}>
            <CategoIcon type="MdChevronRight" siz={28} />
          </div>
          <div className="cursor-pointer text-purple-500" onClick={() => setShowInfoModal(true)}>
            <UniversalCategoIcon type="fa/FaRegQuestionCircle" siz={20} />
          </div>
        </div>

        <div className="flex items-center justify-center gap-1 mb-4 text-purple-300">
          <p className="text-lg">
            Total money today: <span className="font-bold">{usdFormatChanger(startingBalance)}</span>
          </p>
          <Tooltip title="Sum of all your non-credit accounts (debit, cash, savings) as of right now. Credit accounts are excluded since that money isn't really yours to spend.">
            <div>
              <UniversalCategoIcon type="fa/FaRegQuestionCircle" siz={13} />
            </div>
          </Tooltip>
        </div>

        <IncomeSourcesPanel
          incomeSources={incomeSources}
          userId={user?._id}
          walletId={wallet?._id}
          walletPrimaryCurrency={walletPrimaryCurrency}
          onChange={loadSettings}
        />

        <HistoricalBaselinePanel
          baseline={projectionBaseline}
          walletPrimaryCurrency={walletPrimaryCurrency}
          mail={mcSession}
          onChange={loadBaseline}
          defaultOpen={
            (projectionBaseline?.incomeHistory?.length || 0) === 0 &&
            (projectionBaseline?.expenseHistory?.length || 0) === 0 &&
            rowsWithEstimates.some((r) => r.type === "actual" && r.hasTransactions === false)
          }
        />

        {isLoading ? (
          <Skeleton active />
        ) : (
          <ProjectionsView
            rows={rowsWithEstimates}
            onRowClick={(row) => setSelectedMonthName(row.monthName)}
          />
        )}

        {!isLoading && (
          <ProjectionAccuracyReport
            rows={accuracyRows}
            onRowClick={(monthName) => setSelectedMonthName(monthName)}
          />
        )}

        {selectedRow && (
          <ProjectionMonthDetailModal
            monthRow={selectedRow}
            bucketBreakdown={selectedMonthDetails.bucketBreakdown}
            incomeOccurrences={selectedMonthDetails.incomeOccurrences}
            incomeCurrencyBreakdown={selectedMonthDetails.incomeCurrencyBreakdown}
            expenseCurrencyBreakdown={selectedMonthDetails.expenseCurrencyBreakdown}
            walletPrimaryCurrency={walletPrimaryCurrency}
            unexpectedBuffer={selectedUnexpectedBuffer}
            unexpectedIncomeBuffer={selectedUnexpectedIncomeBuffer}
            bufferRevisions={selectedMonthBufferEntry?.revisions}
            onSaveBuffers={handleSaveBuffers}
            onSaveMonthBalance={handleSaveMonthBalance}
            onClose={() => setSelectedMonthName(null)}
            mail={mcSession}
          />
        )}

        {showInfoModal && <ProjectionsInfoModal onClose={() => setShowInfoModal(false)} />}
      </div>
    </div>
  );
}

export default ProjectionsClient;
