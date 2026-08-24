"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Skeleton, Tooltip } from "antd";
import useGetDataFromProvider from "@/hooks/getAllInfo/useGetInfoFromProvider";
import fetcher from "@/helpers/fetcher";
import runNotify from "@/helpers/gastifyNotifier";
import CategoIcon from "../CategoIcon";
import UniversalCategoIcon from "../UniversalCategoIcon";
import { usdFormatChanger } from "@/helpers/transformers/transactionsChange";
import IncomeSourcesPanel from "./IncomeSourcesPanel";
import ProjectionsView from "./ProjectionsView";
import ProjectionMonthDetailModal from "./ProjectionMonthDetailModal";
import ProjectionsInfoModal from "./ProjectionsInfoModal";
import { getYearMonthDateRange } from "@/helpers/timeFunctions/timeFunctions";
import { getTransactionsFromTimeRange, filterBillsOrIncomes } from "@/helpers/transformers/transactionsChange";
import {
  buildYearProjectionTable,
  getMonthBucketBreakdown,
  getExpectedOccurrencesInMonth,
} from "@/helpers/transformers/projectionsChange";
import { getValueActiveInMonth } from "@/helpers/transformers/budgetHistory";
import { isSpendingBudget } from "@/helpers/transformers/budgetTypes";
import PrimaryCurrencySelector from "../PrimaryCurrencySelector";

function ProjectionsClient({ mcSession }) {
  const { transacciones, budgets, accounts, wallet, user, loading } = useGetDataFromProvider();
  const [year, setYear] = useState(new Date().getFullYear());
  const [incomeSources, setIncomeSources] = useState([]);
  const [projectionSettings, setProjectionSettings] = useState(null);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [selectedMonthName, setSelectedMonthName] = useState(null);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const toFetch = fetcher();

  const loadSettings = async () => {
    setSettingsLoading(true);
    try {
      const [incomeRes, projRes] = await Promise.all([
        toFetch.post("general-data/income-sources/get", mcSession),
        toFetch.post("general-data/projections/get", { mail: mcSession, year }),
      ]);
      if (incomeRes.ok) setIncomeSources(incomeRes.data || []);
      if (projRes.ok) setProjectionSettings(projRes.data);
    } catch (e) {
      runNotify("error", String(e));
    } finally {
      setSettingsLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year]);

  const monthlyBalances = projectionSettings?.monthlyBalances || [];
  const monthlyBuffers = projectionSettings?.monthlyBuffers || [];

  const rows = useMemo(() => {
    if (!transacciones || !budgets) return [];
    return buildYearProjectionTable({
      transactions: transacciones,
      budgets,
      incomeSources,
      projectionSettings: { monthlyBuffers },
      year,
      today: new Date(),
    });
  }, [transacciones, budgets, incomeSources, monthlyBuffers, year]);

  const today = new Date();
  const startingBalance = useMemo(() => {
    return (accounts || [])
      .filter((acc) => acc.accountType !== "credit")
      .reduce((acc, item) => acc + (item.amount || 0), 0);
  }, [accounts]);

  const rowsWithBalance = useMemo(() => {
    let runningBalance = startingBalance;
    let reachedCurrent = false;
    return rows.map((row, index) => {
      const net =
        row.type === "current"
          ? row.projectedIncome - row.projectedExpense
          : row.income - row.expense;
      const isCurrentOrLater = year > today.getFullYear() || row.type !== "actual";
      const manualEntry = monthlyBalances.find((m) => m.month === index);
      if (!isCurrentOrLater) {
        return { ...row, net, balance: manualEntry ? manualEntry.balance : null, manualBalance: manualEntry?.balance };
      }
      if (row.type === "current") {
        reachedCurrent = true;
        // Calcular lo que falta por ingresar y gastar en el resto del mes actual
        const remainingNet = (row.projectedIncome - row.actualIncome) - (row.projectedExpense - row.actualExpense);
        // El balance final de este mes incluirá el dinero de hoy más el remanente
        runningBalance += remainingNet;
        return { ...row, net, balance: runningBalance };
      }
      if (reachedCurrent || row.type === "estimate") {
        runningBalance += net;
        return { ...row, net, balance: runningBalance };
      }
      return { ...row, net, balance: manualEntry ? manualEntry.balance : null, manualBalance: manualEntry?.balance };
    });
  }, [rows, startingBalance, year, monthlyBalances]);

  const monthRanges = useMemo(() => getYearMonthDateRange(new Date(year, 0, 1)), [year]);
  const selectedRow = rowsWithBalance.find((r) => r.monthName === selectedMonthName) || null;
  const selectedMonthIndex = rowsWithBalance.findIndex((r) => r.monthName === selectedMonthName);
  const selectedMonthBufferEntry = monthlyBuffers.find((m) => m.month === selectedMonthIndex);
  const selectedUnexpectedBuffer = selectedMonthBufferEntry?.unexpectedBuffer || 0;
  const selectedUnexpectedIncomeBuffer = selectedMonthBufferEntry?.unexpectedIncomeBuffer || 0;

  const selectedMonthDetails = useMemo(() => {
    if (!selectedRow) return { bucketBreakdown: [], incomeOccurrences: [] };
    const { start, end } = monthRanges.get(selectedRow.monthName);
    const monthTx = getTransactionsFromTimeRange(transacciones || [], start, end);
    const { bills } = filterBillsOrIncomes(monthTx);
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
        : (incomeSources || [])
            .filter((s) => s.active && !s.archived)
            .map((s) => ({
              name: s.name,
              amount: s.amount,
              occurrences: getExpectedOccurrencesInMonth(s, start, end),
            }));
    return { bucketBreakdown, incomeOccurrences };
  }, [selectedRow, monthRanges, transacciones, budgets, incomeSources, selectedUnexpectedBuffer]);

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
      <div className="w-full profile-img py-[40px] text-center text-white">
        <h1 className="text-3xl min-[400px]:text-[40px] sm:text-[40px] md:text-[60px] font-thin">
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
      <div className="content-profile-cont w-full h-full bg-slate-100 items-center mt-[10px] sm:mt-[20px] rounded-t-[60px] rounded-b-2xl shadow-sm px-4 sm:px-8 py-6">
        <div className="flex items-center justify-center gap-3 mb-2">
          <div className="cursor-pointer" onClick={() => setYear((y) => y - 1)}>
            <CategoIcon type="MdChevronLeft" siz={28} />
          </div>
          <h2 className="text-2xl text-purple-800">{year}</h2>
          <div className="cursor-pointer" onClick={() => setYear((y) => y + 1)}>
            <CategoIcon type="MdChevronRight" siz={28} />
          </div>
          <div className="cursor-pointer text-purple-500" onClick={() => setShowInfoModal(true)}>
            <UniversalCategoIcon type="fa/FaRegQuestionCircle" siz={20} />
          </div>
        </div>

        <div className="flex items-center justify-center gap-1 mb-4 text-purple-800">
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
          onChange={loadSettings}
        />

        {isLoading ? (
          <Skeleton active />
        ) : (
          <ProjectionsView
            rows={rowsWithBalance}
            onRowClick={(row) => setSelectedMonthName(row.monthName)}
          />
        )}

        {selectedRow && (
          <ProjectionMonthDetailModal
            monthRow={selectedRow}
            bucketBreakdown={selectedMonthDetails.bucketBreakdown}
            incomeOccurrences={selectedMonthDetails.incomeOccurrences}
            unexpectedBuffer={selectedUnexpectedBuffer}
            unexpectedIncomeBuffer={selectedUnexpectedIncomeBuffer}
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
