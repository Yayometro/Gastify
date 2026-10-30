"use client";
import type { TranslateFn } from "@gastify/core/i18n/translate";
import React, { useState } from "react";
import { formatMoneyMajor } from "@gastify/core/money/currencies";
import { getCategoryTransactions } from "@/helpers/transformers/walletAnalyzer";
import useModal from "@/hooks/useModalBasic";
import BasicModal from "@/components/modals/basicModal/BasicModal";
import ModalContentTopMonthItem from "@/components/modals/contents/modalForTopMonthItem/ModalContentTopMonthItem";
import InsightDetailModal from "./InsightDetailModal";
import type { TransactionData } from "@/lib/features/transacctionsSlice";
import type { WalletAnalyzerInsightItem } from "./WalletAnalyzerView";

import TutorialTip from "@/components/tour/TutorialTip";
import type { ComponentTourId } from "@gastify/core/tour/tourSteps";
import { useT, useWalletText } from "@/i18n/client";

// Typed bridge for unmigrated ModalContentTopMonthItem

const TONE_STYLES: Record<string, { bg: string } | undefined> = {
  warning: { bg: "bg-amber-500/15" },
  positive: { bg: "bg-green-500/15" },
  info: { bg: "bg-gf-accent-soft-bg" },
};

export interface BudgetInsightData {
  status?: string;
  pct: number;
  spent: number;
  limit: number;
  category?: string;
  streakMonths?: number;
  monthlySeries?: unknown[];
  [key: string]: unknown;
}

export interface CategoryAnomalyInsightData {
  name?: string;
  current: number;
  average: number;
  changePct?: number;
  monthlyTotals?: unknown[];
  [key: string]: unknown;
}

export interface NewCategoryInsightData {
  name: string;
  current: number;
  icon?: string;
  color?: string;
  isNew?: boolean;
  [key: string]: unknown;
}

export interface SubscriptionInsightData {
  name?: string;
  categoryName: string;
  amount: number;
  [key: string]: unknown;
}

export interface SavingsRateInsightData {
  currentRate: number;
  savingsHistoryLabeled?: unknown[];
  [key: string]: unknown;
}

export interface PeakMonthInsightData {
  peakMonth: {
    total: number;
    label?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface PeakMonthVsPreviousInsightData {
  current: {
    total: number;
    label?: string;
    [key: string]: unknown;
  };
  previous: {
    total: number;
    label?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface PeakQuarterInsightData {
  peakQuarter: {
    total: number;
    label?: string;
    months?: unknown[];
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface CategoryModalItem {
  name: string;
  icon?: string;
  color?: string;
  amount?: number;
  [key: string]: unknown;
}

export interface WalletAnalyzerInsightsStripProps {
  insights: WalletAnalyzerInsightItem[];
  walletPrimaryCurrency: string;
  transactions?: TransactionData[];
  currentRange?: { start: Date | string; end: Date | string } | null;
  title?: string;
  // The tutorial of this card, when the screen that shows it has one (the compass button next to the title).
  tutorial?: ComponentTourId;
  // The explanation next to the title (the strip's own by default), and an action at the right end of that title row.
  action?: React.ReactNode;
}

// Card one-liners are rendered here (not baked into the transformer)
// because they need `currency` for proper $/comma formatting.
export function renderInsightDetail(insight: WalletAnalyzerInsightItem, currency: string, t: TranslateFn): string {
  const { type, data } = insight;
  switch (type) {
    case "budget": {
      const d = data as BudgetInsightData;
      return d.status === "over"
        ? `${Math.round(d.pct)}% del límite — ${formatMoneyMajor(d.spent, currency)} de ${formatMoneyMajor(d.limit, currency)}`
        : t("web.consistently.under.budget");
    }
    case "category_anomaly": {
      const d = data as CategoryAnomalyInsightData;
      return `${formatMoneyMajor(d.current, currency)} este mes vs. ${formatMoneyMajor(d.average, currency)} de promedio en los últimos meses`;
    }
    case "new_category": {
      const d = data as NewCategoryInsightData;
      return `${formatMoneyMajor(d.current, currency)} — no tenía movimientos el mes pasado`;
    }
    case "subscription": {
      const d = data as SubscriptionInsightData;
      return `${formatMoneyMajor(d.amount, currency)} por mes — ${d.categoryName}`;
    }
    case "savings_rate": {
      const d = data as SavingsRateInsightData;
      return `${Math.round(d.currentRate * 100)}% de tus ingresos`;
    }
    case "peak_month": {
      const d = data as PeakMonthInsightData;
      return `${formatMoneyMajor(d.peakMonth.total, currency)} de gasto ese mes`;
    }
    case "peak_month_vs_previous": {
      const d = data as PeakMonthVsPreviousInsightData;
      return `${formatMoneyMajor(d.current.total, currency)} vs. ${formatMoneyMajor(d.previous.total, currency)} en el período anterior`;
    }
    case "peak_quarter": {
      const d = data as PeakQuarterInsightData;
      return `${formatMoneyMajor(d.peakQuarter.total, currency)} de gasto ese trimestre`;
    }
    default:
      return "";
  }
}

// "Lo más destacado del mes" - shared between the full Wallet Analyzer and
// its top-of-page teaser, so both show every insight (not a trimmed
// preview) with full detail text and the same click-to-explain modals -
// fully self-contained (owns its own modal state) so either caller can
// just drop it in with the insight list + a currency/transactions/range.
function WalletAnalyzerInsightsStrip({
  insights,
  walletPrimaryCurrency,
  transactions,
  currentRange,
  title: titleProp,
  tutorial,
  action,
}: WalletAnalyzerInsightsStripProps): React.JSX.Element {
  const text = useWalletText();
  const t = useT();
  const title = titleProp ?? t("web.highlights.of.the.month");
  const { close, handleClose, renderModal, modalContent } = useModal();
  const [activeInsight, setActiveInsight] = useState<WalletAnalyzerInsightItem | null>(null);

  function openCategoryModal(item: CategoryModalItem, range?: { start: Date | string; end: Date | string } | null) {
    const children = getCategoryTransactions(text, transactions || [], item.name, true, range as { start: Date; end: Date });
    renderModal(
      <ModalContentTopMonthItem
        item={{ name: item.name, icon: item.icon, color: item.color, isBill: true, value: item.amount, children }}
        close={handleClose}
      />
    );
  }

  function openInsight(insight: WalletAnalyzerInsightItem) {
    if (insight.type === "new_category") {
      const data = insight.data as NewCategoryInsightData;
      openCategoryModal({ name: data.name, icon: data.icon, color: data.color, amount: data.current }, currentRange);
      return;
    }
    setActiveInsight(insight);
  }

  return (
    <div className="gf-glass-card border border-gf-border rounded-[32px] shadow-sm p-5">
      <div className="mb-0.5 flex flex-wrap items-center gap-x-2 gap-y-1"><p className="text-[15px] font-extrabold text-gf-text">{title}</p>{tutorial && (<><span aria-hidden="true" className="mx-2 inline-block h-5 w-px shrink-0 align-middle bg-purple-300/40" /><TutorialTip tour={tutorial} label={t(`tour.${tutorial}.name`)} /></>)}{action ? <div className="ml-auto">{action}</div> : null}</div>
      <p className="text-xs text-gf-text-muted mb-4">{t("analyzer.projections.method")}</p>
      {insights.length === 0 ? (
        <p className="text-xs text-gf-text-muted">{t("analyzer.unusualNone")}</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3" data-tour="ana-insight-cards">
          {insights.map((insight, i) => (
            <div
              key={i}
              data-tour={i === 0 ? "ana-insight-first" : undefined}
              onClick={() => openInsight(insight)}
              role="button"
              tabIndex={0}
              onKeyDown={(e: React.KeyboardEvent) => {
                if (e.key === "Enter" || e.key === " ") openInsight(insight);
              }}
              className="border border-gf-border rounded-xl p-3.5 flex flex-col gap-1.5 cursor-pointer transition-all duration-150 hover:shadow-md hover:-translate-y-0.5 hover:border-purple-200"
            >
              <span
                className={`h-8 w-8 rounded-full flex items-center justify-center text-base ${TONE_STYLES[insight.tone as string]?.bg || "bg-gf-surface-2"}`}
              >
                {insight.icon}
              </span>
              <p className="text-xs font-bold text-gf-text leading-tight">{insight.title}</p>
              <p className="text-[11px] text-gf-text-muted leading-snug">{renderInsightDetail(insight, walletPrimaryCurrency, t)}</p>
            </div>
          ))}
        </div>
      )}
      {close && <BasicModal close={handleClose} renderContent={modalContent} />}
      <InsightDetailModal insight={activeInsight} onClose={() => setActiveInsight(null)} walletPrimaryCurrency={walletPrimaryCurrency} />
    </div>
  );
}

export default WalletAnalyzerInsightsStrip;
