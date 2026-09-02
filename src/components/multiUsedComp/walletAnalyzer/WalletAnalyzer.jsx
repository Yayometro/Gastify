"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { buildWalletAnalyzerSnapshot } from "@/helpers/transformers/walletAnalyzer";
import { useAccountsFxExposure } from "@/helpers/hooks/useAccountsFxExposure";
import WalletAnalyzerView from "./WalletAnalyzerView";

const SPANISH_MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];
const SPANISH_MONTHS_SHORT = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const EMPTY_ARRAY = [];

function formatMonthLabel(date) {
  return `${SPANISH_MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

// Self-contained like ResumeTabsTrans/TopElementsContainer/CategoryTreemap's
// container - reads everything it needs straight from Redux instead of
// taking data props from Dashboard.jsx - but it DOES accept the same
// `timePeriodFromFather` every other section already syncs to (the
// dashboard's own top-level date filter), so picking a period up there
// sets Wallet Analyzer's starting month too. It only ever sets the
// *initial* month, though: the same "has the user taken the wheel"
// pattern TopElementsContainer already uses (`userHasSelectedMonth`)
// means navigating the ‹ › stepper or month picker here doesn't get
// stomped by the parent filter, and a later parent-filter change is
// ignored once the user has picked their own month.
function WalletAnalyzer({ timePeriodFromFather }) {
  const transactions = useSelector((state) => state.transacctionsReducer?.data) || EMPTY_ARRAY;
  const budgets = useSelector((state) => state.budgetReducer?.data) || EMPTY_ARRAY;
  const accounts = useSelector((state) => state.accountsReducer?.data) || EMPTY_ARRAY;
  const walletPrimaryCurrency = useSelector((state) => state.walletReducer?.data?.primaryCurrency) || "MXN";

  const today = useMemo(() => new Date(), []);
  const initialMonth = timePeriodFromFather?.[0]
    ? new Date(new Date(timePeriodFromFather[0]).getFullYear(), new Date(timePeriodFromFather[0]).getMonth(), 1)
    : new Date(today.getFullYear(), today.getMonth(), 1);
  const [referenceMonth, setReferenceMonth] = useState(initialMonth);
  const [topN, setTopN] = useState(12);
  const userHasSelectedMonth = useRef(false);

  useEffect(() => {
    if (!userHasSelectedMonth.current && timePeriodFromFather?.[0]) {
      const fatherDate = new Date(timePeriodFromFather[0]);
      setReferenceMonth(new Date(fatherDate.getFullYear(), fatherDate.getMonth(), 1));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timePeriodFromFather]);

  const snapshot = useMemo(
    () => buildWalletAnalyzerSnapshot({ transactions, budgets, referenceDate: referenceMonth, topN }),
    [transactions, budgets, referenceMonth, topN]
  );

  const fxExposure = useAccountsFxExposure(accounts, walletPrimaryCurrency, referenceMonth);

  const previousMonth = new Date(referenceMonth.getFullYear(), referenceMonth.getMonth() - 1, 1);
  const canGoNext = referenceMonth < new Date(today.getFullYear(), today.getMonth(), 1);

  const trendWithLabels = useMemo(
    () =>
      snapshot.trend.map((m, i) => {
        const monthDate = new Date(referenceMonth.getFullYear(), referenceMonth.getMonth() - (snapshot.trend.length - 1 - i), 1);
        return { ...m, label: formatMonthLabel(monthDate), shortLabel: SPANISH_MONTHS_SHORT[monthDate.getMonth()] };
      }),
    [snapshot.trend, referenceMonth]
  );

  if (transactions.length === 0) return null;

  return (
    <WalletAnalyzerView
      referenceMonth={referenceMonth}
      referenceMonthLabel={formatMonthLabel(referenceMonth)}
      previousMonthLabel={formatMonthLabel(previousMonth)}
      onPrevMonth={() => {
        userHasSelectedMonth.current = true;
        setReferenceMonth((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
      }}
      onNextMonth={() => {
        if (!canGoNext) return;
        userHasSelectedMonth.current = true;
        setReferenceMonth((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
      }}
      onSelectMonth={(d) => {
        userHasSelectedMonth.current = true;
        setReferenceMonth(new Date(d.getFullYear(), d.getMonth(), 1));
      }}
      maxSelectableMonth={new Date(today.getFullYear(), today.getMonth(), 1)}
      canGoNext={canGoNext}
      topN={topN}
      onChangeTopN={setTopN}
      walletPrimaryCurrency={walletPrimaryCurrency}
      snapshot={{ ...snapshot, trend: trendWithLabels }}
      fxExposure={fxExposure}
      transactions={transactions}
    />
  );
}

export default WalletAnalyzer;
