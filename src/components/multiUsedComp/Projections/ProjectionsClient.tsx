"use client";

import HistoryGate from "../loaders/HistoryGate";
import React, { useMemo, useState } from "react";
import { Skeleton, Tooltip } from "antd";
import useGetDataFromProvider from "@/hooks/getAllInfo/useGetInfoFromProvider";
import useProjectionTable, { type ProjectionBaselineData } from "@/hooks/useProjectionTable";
import fetcher from "@/helpers/fetcher";
import CategoIcon from "../CategoIcon";
import { usdFormatChanger } from "@/helpers/transformers/transactionsChange";
import IncomeSourcesPanel from "./IncomeSourcesPanel";
import HistoricalBaselinePanel from "./HistoricalBaselinePanel";
import ProjectionsView, { type ProjectionRow } from "./ProjectionsView";
import ProjectionAccuracyReport from "./ProjectionAccuracyReport";
import ProjectionMonthDetailModal, { type SaveBuffersPayload } from "./ProjectionMonthDetailModal";
import { buildSelectedMonthDetails, EMPTY_MONTH_DETAILS, type SelectedMonthDetails } from "./projectionMonthDetails";
import PrimaryCurrencySelector, { type PrimaryCurrencySelectorWallet } from "../PrimaryCurrencySelector";

import { InfoTip } from "@/components/multiUsedComp/InfoTip";
import TutorialTip from "@/components/tour/TutorialTip";
import { useT, useInfo } from "@/i18n/client";

export interface ProjectionsClientProps {
  mcSession?: string | null;
  readOnly?: boolean;
  demoRatesToMxn?: Record<string, number>;
  demoProjectionBaseline?: ProjectionBaselineData | null;
}

function ProjectionsClient({ mcSession, readOnly = false, demoRatesToMxn, demoProjectionBaseline }: ProjectionsClientProps): React.JSX.Element {
  const { APP_INFO } = useInfo();
  const t = useT();
  const { transacciones, budgets, accounts, wallet, user, loading } = useGetDataFromProvider();
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [selectedMonthName, setSelectedMonthName] = useState<string | null>(null);
  const toFetch = fetcher();

  const walletPrimaryCurrency = (wallet as { primaryCurrency?: string } | null | undefined)?.primaryCurrency || "MXN";

  // Fetch + currency-conversion + running-balance pipeline lives in
  // useProjectionTable (shared with /dashboard/history's own projections
  // table) - see that hook for the full breakdown of what it does.
  const {
    rows: rowsWithEstimates,
    accuracyRows,
    startingBalance,
    incomeSources,
    incomeSourcesConverted,
    budgetsConverted,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
    demoRatesToMxn,
    demoProjectionBaseline,
  });

  const selectedRow = rowsWithEstimates.find((r) => r.monthName === selectedMonthName) || null;
  const selectedMonthIndex = rowsWithEstimates.findIndex((r) => r.monthName === selectedMonthName);
  const selectedMonthBufferEntry = monthlyBuffers.find((m) => m.month === selectedMonthIndex);
  const selectedUnexpectedBuffer = selectedMonthBufferEntry?.unexpectedBuffer || 0;
  const selectedUnexpectedIncomeBuffer = selectedMonthBufferEntry?.unexpectedIncomeBuffer || 0;

  const selectedMonthDetails = useMemo<SelectedMonthDetails>(() => {
    if (!selectedRow) return EMPTY_MONTH_DETAILS;
    return buildSelectedMonthDetails({
      rowType: selectedRow.type,
      range: monthRanges.get(selectedRow.monthName),
      transactions: transacciones || [],
      budgets: budgetsConverted || [],
      incomeSources: incomeSourcesConverted || [],
      unexpectedBuffer: selectedUnexpectedBuffer,
      walletPrimaryCurrency,
      labels: { budget: t("budgets.alert.defaultName"), unexpected: t("projections.unexpectedRow") },
    });
  }, [selectedRow, monthRanges, transacciones, budgetsConverted, incomeSourcesConverted, selectedUnexpectedBuffer, walletPrimaryCurrency, t]);

  const handleSaveBuffers = async ({ unexpectedBuffer: newBuffer, unexpectedIncomeBuffer: newIncomeBuffer }: SaveBuffersPayload): Promise<void> => {
    if (readOnly) return;
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

  const handleSaveMonthBalance = async (balance: number): Promise<void> => {
    if (readOnly) return;
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
          {t("projections.title")}<span aria-hidden="true" className="mx-2 inline-block h-5 w-px shrink-0 align-middle bg-purple-300/40" /><InfoTip info={APP_INFO.proyecciones} /><TutorialTip className="ml-0.5" tour="projections" label={t("navbar.projections")} />
        </h1>
      </div>
      {!readOnly && <div className="w-full flex items-center justify-center pt-2" data-tour="proj-currency">
        <Tooltip title={t("projections.currency.help")}>
          <div>
            <PrimaryCurrencySelector pcsWallet={wallet as PrimaryCurrencySelectorWallet | null | undefined} />
          </div>
        </Tooltip>
      </div>}
      <div className="content-profile-cont w-full h-full content-wallet-glass items-center mt-[10px] sm:mt-[20px] rounded-t-[60px] rounded-b-2xl px-4 sm:px-8 py-6">
        <div className="flex items-center justify-center gap-3 mb-2" data-tour="proj-year">
          <div className="cursor-pointer" onClick={() => setYear((y) => y - 1)}>
            <CategoIcon type="MdChevronLeft" siz={28} />
          </div>
          <h2 className="text-2xl text-purple-300">{year}</h2>
          <div className="cursor-pointer" onClick={() => setYear((y) => y + 1)}>
            <CategoIcon type="MdChevronRight" siz={28} />
          </div>
          <span aria-hidden="true" className="mx-2 inline-block h-5 w-px shrink-0 align-middle bg-purple-300/40" /><TutorialTip tour="projYear" label={t("tour.projYear.name")} />
        </div>

        <div className="flex items-center justify-center gap-1 mb-4 text-purple-300" data-tour="proj-today">
          <p className="text-lg">
            {t("projections.today.total")} <span className="font-bold">{usdFormatChanger(startingBalance)}</span>
          </p>
          <span aria-hidden="true" className="mx-2 inline-block h-5 w-px shrink-0 align-middle bg-purple-300/40" />
          <InfoTip info={{ title: t("projections.today.total"), text: t("projections.today.help") }} />
        </div>

        {!readOnly && <div data-tour="proj-sources"><IncomeSourcesPanel
          incomeSources={incomeSources}
          userId={user?._id as string | undefined}
          walletId={wallet?._id as string | undefined}
          walletPrimaryCurrency={walletPrimaryCurrency}
          onChange={loadSettings}
        /></div>}

        {!readOnly && <HistoricalBaselinePanel
          baseline={projectionBaseline}
          walletPrimaryCurrency={walletPrimaryCurrency}
          mail={mcSession || undefined}
          onChange={loadBaseline}
          defaultOpen={
            (projectionBaseline?.incomeHistory?.length || 0) === 0 &&
            (projectionBaseline?.expenseHistory?.length || 0) === 0 &&
            rowsWithEstimates.some((r) => r.type === "actual" && r.hasTransactions === false)
          }
        />}

        {/* A year that starts before the movements loaded so far would show zeros until the rest of the history arrives. */}
        <HistoryGate starts={[new Date(year, 0, 1)]}>
          {isLoading ? (
            <Skeleton active />
          ) : (
            <div data-tour="proj-table">
              <ProjectionsView
                tutorial="projTable"
                rows={rowsWithEstimates as unknown as ProjectionRow[]}
                onRowClick={(row) => setSelectedMonthName(row.monthName)}
              />
            </div>
          )}

          {!isLoading && (
            <ProjectionAccuracyReport
              rows={accuracyRows}
              onRowClick={(monthName) => setSelectedMonthName(monthName)}
            />
          )}
        </HistoryGate>

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
            mail={mcSession || undefined}
            readOnly={readOnly}
          />
        )}

      </div>
    </div>
  );
}

export default ProjectionsClient;
