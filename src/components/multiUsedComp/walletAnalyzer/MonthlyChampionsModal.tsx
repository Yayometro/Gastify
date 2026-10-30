"use client";
import TutorialTip from "@/components/tour/TutorialTip";
import React from "react";
import { Modal } from "antd";
import { formatMoneyMajor } from "@gastify/core/money/currencies";
import UniversalCategoIcon from "../UniversalCategoIcon";
import type {
  ChampionsModalKind,
  WalletAnalyzerMonthlyChampionEntry,
  WalletAnalyzerChampionMonthItem,
  WalletAnalyzerChampionMonthCategory,
  WalletAnalyzerChampionMonthSubcategory,
} from "./WalletAnalyzerView";
import { useT } from "@/i18n/client";

const TITLES: Record<"transaction" | "category" | "subCategory", string> = {
  transaction: "web.largest.transaction.per.month",
  category: "web.category.with.the.most.spending.per.month",
  subCategory: "web.subcategory.with.the.most.spending.per.month",
};

export type ChampionItem =
  | WalletAnalyzerChampionMonthItem
  | WalletAnalyzerChampionMonthCategory
  | WalletAnalyzerChampionMonthSubcategory;

export interface MonthlyChampionsRow {
  entry: WalletAnalyzerMonthlyChampionEntry;
  champion: ChampionItem;
}

export interface MonthlyChampionsModalProps {
  kind: ChampionsModalKind;
  months?: WalletAnalyzerMonthlyChampionEntry[] | null;
  onClose: () => void;
  onSelectMonth: (entry: WalletAnalyzerMonthlyChampionEntry) => void;
  walletPrimaryCurrency?: string;
}

// The evidence behind "Grandes gastos"'s overall 12-month winner: one row
// per month, sorted by amount descending so the eventual winner visibly
// stands out. Clicking a row hands that month's champion + its own range
// back to the caller, which opens the existing single-month drill-down
// (the same modal already used for category/subcategory/transaction
// detail elsewhere in Wallet Analyzer) - this modal is purely a summary
// list, not itself a transaction list.
function MonthlyChampionsModal({
  kind,
  months,
  onClose,
  onSelectMonth,
  walletPrimaryCurrency,
}: MonthlyChampionsModalProps): React.JSX.Element | null {
  const t = useT();
  if (!kind) return null;

  const rows: MonthlyChampionsRow[] = (months || [])
    .map((entry) => {
      const champion =
        kind === "transaction"
          ? entry.biggestTransaction
          : kind === "category"
          ? entry.biggestCategory
          : entry.biggestSubcategory;
      return { entry, champion };
    })
    .filter((r): r is MonthlyChampionsRow => Boolean(r.champion))
    .sort((a, b) =>
      kind === "category" || kind === "subCategory"
        ? (b.champion as WalletAnalyzerChampionMonthCategory | WalletAnalyzerChampionMonthSubcategory).total -
          (a.champion as WalletAnalyzerChampionMonthCategory | WalletAnalyzerChampionMonthSubcategory).total
        : (b.champion as WalletAnalyzerChampionMonthItem).amount -
          (a.champion as WalletAnalyzerChampionMonthItem).amount
    );

  return (
    <Modal
      open
      onCancel={onClose}
      footer={null}
      className="gf-antd-modal-glass"
      zIndex={20000}
      title={<span className="inline-flex items-center text-purple-300 font-semibold text-base">{t(TITLES[kind])}<span aria-hidden="true" className="mx-2 inline-block h-5 w-px shrink-0 align-middle bg-purple-300/40" /><TutorialTip tour="anaChampions" label={t(TITLES[kind])} /></span>}
    >
      <div data-tour="champ-list" className="flex flex-col max-h-[420px] overflow-y-auto pr-1">
        {rows.map(({ entry, champion }) => (
          <div
            key={entry.label}
            onClick={() => onSelectMonth(entry)}
            role="button"
            tabIndex={0}
            onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => {
              if (e.key === "Enter" || e.key === " ") onSelectMonth(entry);
            }}
            className="flex items-center gap-3 py-2.5 border-t border-gf-border first:border-t-0 cursor-pointer hover:bg-gf-surface-2 transition-colors -mx-1 px-1 rounded-lg"
          >
            <span
              className="h-9 w-9 rounded-full flex items-center justify-center shrink-0"
              style={{
                backgroundColor:
                  kind === "subCategory"
                    ? (champion as WalletAnalyzerChampionMonthSubcategory).categoryColor
                    : (champion as WalletAnalyzerChampionMonthCategory).color,
              }}
            >
              <UniversalCategoIcon
                type={
                  (kind === "subCategory"
                    ? (champion as WalletAnalyzerChampionMonthSubcategory).categoryIcon
                    : (champion as WalletAnalyzerChampionMonthCategory).icon) || "MdFilterNone"
                }
                siz={16}
                colore="#fff"
              />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[10.5px] font-bold uppercase tracking-wide text-gf-text-muted">{entry.label}</p>
              <p className="text-[13px] font-semibold text-gf-text truncate">{champion.name}</p>
              {kind !== "transaction" && (
                <p className="text-[11px] text-gf-text-muted">
                  {t("analyzer.percentOfYear", { p1: Math.round(
                    (champion as WalletAnalyzerChampionMonthCategory | WalletAnalyzerChampionMonthSubcategory)
                      .pctOfWindowTotal as number
                  ) })}
                </p>
              )}
            </div>
            <span className="text-[13px] font-bold text-gf-text shrink-0">
              {formatMoneyMajor(
                kind === "transaction"
                  ? (champion as WalletAnalyzerChampionMonthItem).amount
                  : (champion as WalletAnalyzerChampionMonthCategory | WalletAnalyzerChampionMonthSubcategory).total,
                walletPrimaryCurrency
              )}
            </span>
          </div>
        ))}
      </div>
    </Modal>
  );
}

export default MonthlyChampionsModal;
