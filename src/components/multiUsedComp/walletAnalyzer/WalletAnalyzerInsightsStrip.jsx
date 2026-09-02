"use client";
import React, { useState } from "react";
import { formatMoneyMajor } from "@/lib/money/currencies";
import { getCategoryTransactions } from "@/helpers/transformers/walletAnalyzer";
import useModal from "@/hooks/useModalBasic";
import BasicModal from "@/components/modals/basicModal/BasicModal";
import ModalContentTopMonthItem from "@/components/modals/contents/modalForTopMonthItem/ModalContentTopMonthItem";
import InsightDetailModal from "./InsightDetailModal";

const TONE_STYLES = {
  warning: { bg: "bg-amber-50" },
  positive: { bg: "bg-green-50" },
  info: { bg: "bg-purple-50" },
};

// Card one-liners are rendered here (not baked into the transformer)
// because they need `currency` for proper $/comma formatting.
export function renderInsightDetail(insight, currency) {
  const { type, data } = insight;
  switch (type) {
    case "budget":
      return data.status === "over"
        ? `${Math.round(data.pct)}% del límite — ${formatMoneyMajor(data.spent, currency)} de ${formatMoneyMajor(data.limit, currency)}`
        : "Bajo presupuesto de forma consistente";
    case "category_anomaly":
      return `${formatMoneyMajor(data.current, currency)} este mes vs. ${formatMoneyMajor(data.average, currency)} de promedio en los últimos meses`;
    case "new_category":
      return `${formatMoneyMajor(data.current, currency)} — no tenía movimientos el mes pasado`;
    case "subscription":
      return `${formatMoneyMajor(data.amount, currency)} por mes — ${data.categoryName}`;
    case "savings_rate":
      return `${Math.round(data.currentRate * 100)}% de tus ingresos`;
    default:
      return "";
  }
}

// "Lo más destacado del mes" - shared between the full Wallet Analyzer and
// its top-of-page teaser, so both show every insight (not a trimmed
// preview) with full detail text and the same click-to-explain modals -
// fully self-contained (owns its own modal state) so either caller can
// just drop it in with the insight list + a currency/transactions/range.
function WalletAnalyzerInsightsStrip({ insights, walletPrimaryCurrency, transactions, currentRange, title = "Lo más destacado del mes" }) {
  const { close, handleClose, renderModal, modalContent } = useModal();
  const [activeInsight, setActiveInsight] = useState(null);

  function openCategoryModal(item, range) {
    const children = getCategoryTransactions(transactions || [], item.name, true, range);
    renderModal(
      <ModalContentTopMonthItem
        item={{ name: item.name, icon: item.icon, color: item.color, isBill: true, value: item.amount, children }}
        close={handleClose}
      />
    );
  }

  function openInsight(insight) {
    if (insight.type === "new_category") {
      openCategoryModal({ name: insight.data.name, icon: insight.data.icon, color: insight.data.color, amount: insight.data.current }, currentRange);
      return;
    }
    setActiveInsight(insight);
  }

  return (
    <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-5">
      <p className="text-[15px] font-extrabold text-slate-800 mb-0.5">{title}</p>
      <p className="text-xs text-slate-400 mb-4">Calculado a partir de tu historial - sin llamadas a IA</p>
      {insights.length === 0 ? (
        <p className="text-xs text-slate-400">Nada fuera de lo común este mes.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {insights.map((insight, i) => (
            <div
              key={i}
              onClick={() => openInsight(insight)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") openInsight(insight);
              }}
              className="border border-slate-100 rounded-xl p-3.5 flex flex-col gap-1.5 cursor-pointer transition-all duration-150 hover:shadow-md hover:-translate-y-0.5 hover:border-purple-200"
            >
              <span
                className={`h-8 w-8 rounded-full flex items-center justify-center text-base ${TONE_STYLES[insight.tone]?.bg || "bg-slate-50"}`}
              >
                {insight.icon}
              </span>
              <p className="text-xs font-bold text-slate-800 leading-tight">{insight.title}</p>
              <p className="text-[11px] text-slate-500 leading-snug">{renderInsightDetail(insight, walletPrimaryCurrency)}</p>
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
