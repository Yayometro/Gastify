"use client";
import React from "react";
import { Modal } from "antd";
import { formatMoneyMajor } from "@/lib/money/currencies";
import UniversalCategoIcon from "../UniversalCategoIcon";

const TITLES = {
  transaction: "Transacción más grande por mes",
  category: "Categoría con más gasto por mes",
  subCategory: "Subcategoría con más gasto por mes",
};

// The evidence behind "Grandes gastos"'s overall 12-month winner: one row
// per month, sorted by amount descending so the eventual winner visibly
// stands out. Clicking a row hands that month's champion + its own range
// back to the caller, which opens the existing single-month drill-down
// (the same modal already used for category/subcategory/transaction
// detail elsewhere in Wallet Analyzer) - this modal is purely a summary
// list, not itself a transaction list.
function MonthlyChampionsModal({ kind, months, onClose, onSelectMonth, walletPrimaryCurrency }) {
  if (!kind) return null;

  const rows = (months || [])
    .map((entry) => {
      const champion = kind === "transaction" ? entry.biggestTransaction : kind === "category" ? entry.biggestCategory : entry.biggestSubcategory;
      return { entry, champion };
    })
    .filter((r) => r.champion)
    .sort((a, b) => (kind === "category" || kind === "subCategory" ? b.champion.total - a.champion.total : b.champion.amount - a.champion.amount));

  return (
    <Modal
      open
      onCancel={onClose}
      footer={null}
      title={<span className="text-purple-700 font-semibold text-base">{TITLES[kind]}</span>}
    >
      <div className="flex flex-col max-h-[420px] overflow-y-auto pr-1">
        {rows.map(({ entry, champion }) => (
          <div
            key={entry.label}
            onClick={() => onSelectMonth(entry)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") onSelectMonth(entry);
            }}
            className="flex items-center gap-3 py-2.5 border-t border-slate-100 first:border-t-0 cursor-pointer hover:bg-slate-50 transition-colors -mx-1 px-1 rounded-lg"
          >
            <span
              className="h-9 w-9 rounded-full flex items-center justify-center shrink-0"
              style={{ backgroundColor: kind === "subCategory" ? champion.categoryColor : champion.color }}
            >
              <UniversalCategoIcon type={(kind === "subCategory" ? champion.categoryIcon : champion.icon) || "MdFilterNone"} siz={16} colore="#fff" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[10.5px] font-bold uppercase tracking-wide text-slate-400">{entry.label}</p>
              <p className="text-[13px] font-semibold text-slate-800 truncate">{champion.name}</p>
              {kind !== "transaction" && (
                <p className="text-[11px] text-slate-400">{Math.round(champion.pctOfWindowTotal)}% del total de los 12 meses</p>
              )}
            </div>
            <span className="text-[13px] font-bold text-slate-800 shrink-0">
              {formatMoneyMajor(kind === "transaction" ? champion.amount : champion.total, walletPrimaryCurrency)}
            </span>
          </div>
        ))}
      </div>
    </Modal>
  );
}

export default MonthlyChampionsModal;
