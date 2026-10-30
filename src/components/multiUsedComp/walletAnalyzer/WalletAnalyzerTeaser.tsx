"use client";
import React, { useMemo } from "react";
import Link from "next/link";
import { useSelector } from "react-redux";
import { buildWalletAnalyzerSnapshot } from "@/helpers/transformers/walletAnalyzer";
import WalletAnalyzerInsightsStrip from "./WalletAnalyzerInsightsStrip";
import type { RootState } from "@/lib/store";
import type { TransactionData } from "@/lib/features/transacctionsSlice";
import useBudgetsInPrimaryCurrency from "@/hooks/money/useBudgetsInPrimaryCurrency";
import type { BudgetData } from "@/lib/features/budgetSlice";
import type { WalletData } from "@/lib/features/walletSlice";
import type { WalletAnalyzerSnapshotData } from "./WalletAnalyzerView";

import { useT, useInfo, useWalletText } from "@/i18n/client";

const EMPTY_ARRAY: never[] = [];

export interface WalletAnalyzerTeaserProps {
  timePeriodFromFather?: (Date | string)[] | null;
  demoMode?: boolean;
}

// The full "Lo más destacado del mes" strip (every insight, full detail,
// same click-to-explain modals as the main Wallet Analyzer - not a
// trimmed-down preview), placed near the top of the page. Wallet Analyzer
// itself lives at the very bottom (it's heavy, ~10 sections), so this is
// the "front door" that makes it discoverable without pushing balances/
// transactions further down the page. Self-contained like WalletAnalyzer.jsx
// itself: reads Redux and computes its own (lightweight - current month
// only, no FX) snapshot rather than threading props down from Dashboard.jsx -
// but it DOES take the same `timePeriodFromFather` every other section
// already syncs to, same as WalletAnalyzer.jsx, so changing the dashboard's
// top-level date filter moves this preview's month too. Unlike
// WalletAnalyzer.jsx, there's no local stepper here to "take the wheel"
// with, so it just always follows the parent - one atomic, prop-driven
// piece instead of owning its own navigation state.
function WalletAnalyzerTeaser({ timePeriodFromFather, demoMode = false }: WalletAnalyzerTeaserProps): React.JSX.Element | null {
  const text = useWalletText();
  const { APP_INFO } = useInfo();
  const t = useT();
  const transactions: TransactionData[] = useSelector((state: RootState) => state.transacctionsReducer?.data) || EMPTY_ARRAY;
  const storedBudgets: BudgetData[] = useSelector((state: RootState) => state.budgetReducer?.data) || EMPTY_ARRAY;
  const walletPrimaryCurrency: string = useSelector((state: RootState) => (state.walletReducer?.data as WalletData)?.primaryCurrency) || "MXN";
  const budgets = useBudgetsInPrimaryCurrency(storedBudgets, walletPrimaryCurrency);

  const today = useMemo(() => new Date(), []);
  const snapshot = useMemo<WalletAnalyzerSnapshotData>(
    () => buildWalletAnalyzerSnapshot({ text, transactions, budgets, referenceDate: timePeriodFromFather?.[0] ? new Date(timePeriodFromFather[0]) : today }),
    [transactions, budgets, timePeriodFromFather, today, text]
  );

  if (transactions.length === 0) return null;

  // One title row: the summary's name, its "?" and its compass on the left, the way to the full analyzer on the right.
  return (
    <div className="mb-4" data-tour="dash-analyzer">
      <WalletAnalyzerInsightsStrip
        insights={snapshot.insights}
        walletPrimaryCurrency={walletPrimaryCurrency}
        transactions={transactions}
        currentRange={snapshot.currentRange}
        title={t("analyzer.summaryTitle")}
        tutorial="dashAnalyzer"
        action={
          <Link data-tour="dash-analyzer-link" href={demoMode ? "#demo-top" : "/dashboard/analyzer"} className="flex items-center gap-1 whitespace-nowrap text-sm font-bold text-purple-300 transition-colors hover:text-white">
            {t("analyzer.seeFull")} <span aria-hidden="true">→</span>
          </Link>
        }
      />
    </div>
  );
}

export default WalletAnalyzerTeaser;
