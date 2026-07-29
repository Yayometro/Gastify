"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Skeleton } from "antd";
import useGetDataFromProvider from "@/hooks/getAllInfo/useGetInfoFromProvider";
import fetcher from "@/helpers/fetcher";
import runNotify from "@/helpers/gastifyNotifier";
import CategoIcon from "../CategoIcon";
import IncomeSourcesPanel from "./IncomeSourcesPanel";
import ProjectionsView from "./ProjectionsView";
import ProjectionMonthDetailModal from "./ProjectionMonthDetailModal";
import { getYearMonthDateRange } from "@/helpers/timeFunctions/timeFunctions";
import { getTransactionsFromTimeRange, filterBillsOrIncomes } from "@/helpers/transformers/transactionsChange";
import {
  buildYearProjectionTable,
  getMonthBucketBreakdown,
  getExpectedOccurrencesInMonth,
} from "@/helpers/transformers/projectionsChange";

function ProjectionsClient({ mcSession }) {
  const { transacciones, budgets, accounts, wallet, user, loading } = useGetDataFromProvider();
  const [year, setYear] = useState(new Date().getFullYear());
  const [incomeSources, setIncomeSources] = useState([]);
  const [projectionSettings, setProjectionSettings] = useState(null);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [selectedMonthName, setSelectedMonthName] = useState(null);
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

  const unexpectedBuffer = projectionSettings?.unexpectedBuffer || 0;

  const rows = useMemo(() => {
    if (!transacciones || !budgets) return [];
    return buildYearProjectionTable({
      transactions: transacciones,
      budgets,
      incomeSources,
      projectionSettings: { unexpectedBuffer },
      year,
      today: new Date(),
    });
  }, [transacciones, budgets, incomeSources, unexpectedBuffer, year]);

  const today = new Date();
  const startingBalance = useMemo(() => {
    return (accounts || [])
      .filter((acc) => acc.accountType !== "credit")
      .reduce((acc, item) => acc + (item.amount || 0), 0);
  }, [accounts]);

  const rowsWithBalance = useMemo(() => {
    let runningBalance = startingBalance;
    let reachedCurrent = false;
    return rows.map((row) => {
      const net =
        row.type === "current"
          ? row.projectedIncome - row.projectedExpense
          : row.income - row.expense;
      const isCurrentOrLater = year > today.getFullYear() || row.type !== "actual";
      if (!isCurrentOrLater) {
        return { ...row, net, balance: null };
      }
      if (row.type === "current") {
        reachedCurrent = true;
        return { ...row, net, balance: runningBalance };
      }
      if (reachedCurrent || row.type === "estimate") {
        runningBalance += net;
        return { ...row, net, balance: runningBalance };
      }
      return { ...row, net, balance: null };
    });
  }, [rows, startingBalance, year]);

  const monthRanges = useMemo(() => getYearMonthDateRange(new Date(year, 0, 1)), [year]);
  const selectedRow = rowsWithBalance.find((r) => r.monthName === selectedMonthName) || null;

  const selectedMonthDetails = useMemo(() => {
    if (!selectedRow) return { bucketBreakdown: [], incomeOccurrences: [] };
    const { start, end } = monthRanges.get(selectedRow.monthName);
    const monthTx = getTransactionsFromTimeRange(transacciones || [], start, end);
    const { bills } = filterBillsOrIncomes(monthTx);
    const activeBudgets = (budgets || []).filter((b) => !b.isSaving && !b.archived);
    const bucketBreakdown = getMonthBucketBreakdown(bills, activeBudgets, unexpectedBuffer);
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
  }, [selectedRow, monthRanges, transacciones, budgets, incomeSources, unexpectedBuffer]);

  const handleSaveBuffer = async (newBuffer) => {
    const res = await toFetch.post("general-data/projections/update", {
      mail: mcSession,
      year,
      unexpectedBuffer: newBuffer,
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
      <div className="content-profile-cont w-full h-full bg-slate-100 items-center mt-[10px] sm:mt-[20px] rounded-t-[60px] rounded-b-2xl shadow-sm px-4 sm:px-8 py-6">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div
            className="cursor-pointer"
            onClick={() => setYear((y) => y - 1)}
          >
            <CategoIcon type="MdChevronLeft" siz={28} />
          </div>
          <h2 className="text-2xl text-purple-800">{year}</h2>
          <div
            className="cursor-pointer"
            onClick={() => setYear((y) => y + 1)}
          >
            <CategoIcon type="MdChevronRight" siz={28} />
          </div>
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
            unexpectedBuffer={unexpectedBuffer}
            onSaveBuffer={handleSaveBuffer}
            onClose={() => setSelectedMonthName(null)}
          />
        )}
      </div>
    </div>
  );
}

export default ProjectionsClient;
