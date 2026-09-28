"use client";
import React, { useState } from "react";
import { formatMoneyMajor } from "@/lib/money/currencies";
import { getCategoryTransactions } from "@/helpers/transformers/walletAnalyzer";
import useModal from "@/hooks/useModalBasic";
import BasicModal from "@/components/modals/basicModal/BasicModal";
import ModalContentTopMonthItem from "@/components/modals/contents/modalForTopMonthItem/ModalContentTopMonthItem";
import InsightDetailModal from "./InsightDetailModal";
import type { TransactionData } from "@/lib/features/transacctionsSlice";
import type { WalletAnalyzerInsightItem } from "./WalletAnalyzerView";

// Typed bridge for unmigrated ModalContentTopMonthItem
interface ModalContentTopMonthItemProps {
  item: unknown;
  close: () => void;
  onBack?: (() => void) | false;
}
const TypedModalContentTopMonthItem = ModalContentTopMonthItem as React.ComponentType<ModalContentTopMonthItemProps>;

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
}

// Card one-liners are rendered here (not baked into the transformer)
// because they need `currency` for proper $/comma formatting.
export function renderInsightDetail(insight: WalletAnalyzerInsightItem, currency: string): string {
  const { type, data } = insight;
  switch (type) {
    case "budget": {
      const d = data as BudgetInsightData;
      return d.status === "over"
        ? `${Math.round(d.pct)}% del límite — ${formatMoneyMajor(d.spent, currency)} de ${formatMoneyMajor(d.limit, currency)}`
        : "Bajo presupuesto de forma consistente";
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
  title = "Lo más destacado del mes",
}: WalletAnalyzerInsightsStripProps): React.JSX.Element {
  const { close, handleClose, renderModal, modalContent } = useModal();
  const [activeInsight, setActiveInsight] = useState<WalletAnalyzerInsightItem | null>(null);

  function openCategoryModal(item: CategoryModalItem, range?: { start: Date | string; end: Date | string } | null) {
    const children = getCategoryTransactions(transactions || [], item.name, true, range as { start: Date; end: Date });
    renderModal(
      <TypedModalContentTopMonthItem
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
      <p className="text-[15px] font-extrabold text-gf-text mb-0.5">{title}</p>
      <p className="text-xs text-gf-text-muted mb-4">Calculado a partir de tu historial - sin llamadas a IA</p>
      {insights.length === 0 ? (
        <p className="text-xs text-gf-text-muted">Nada fuera de lo común este mes.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {insights.map((insight, i) => (
            <div
              key={i}
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
              <p className="text-[11px] text-gf-text-muted leading-snug">{renderInsightDetail(insight, walletPrimaryCurrency)}</p>
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
