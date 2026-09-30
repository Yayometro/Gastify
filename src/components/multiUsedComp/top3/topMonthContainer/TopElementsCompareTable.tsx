"use client";

import React from "react";
import TopTransactionRow from "./TopTransactionRow";
import TopCategoryRow, { TopCategoryRowItem } from "./TopCategoryRow";
import type { TransactionItemMovement } from "@/components/Transactions/ItemList/TransactionItemList";
import useModal from "@/hooks/useModalBasic";
import BasicModal from "@/components/modals/basicModal/BasicModal";
import ModalContentTopMonthItem, {
  type ModalContentTopMonthItemItem,
} from "@/components/modals/contents/modalForTopMonthItem/ModalContentTopMonthItem";
import type { RelativeMonthGroup } from "@/helpers/transformers/transactionsChange";

export interface CompareColumn<T = unknown> extends Partial<RelativeMonthGroup<T>> {
  index?: number;
  monthLabel?: string;
  childrens: T[];
  [key: string]: unknown;
}

export interface CompareRow<T = unknown> {
  index?: number;
  colA?: CompareColumn<T> | null;
  colB?: CompareColumn<T> | null;
  [key: string]: unknown;
}

export interface CompareCellProps<T = unknown> {
  column?: CompareColumn<T> | null;
  mode: "category" | "transaction" | string;
  onOpenItem: (item: T) => void;
}

export interface CompareSectionProps<T = unknown> {
  title: string;
  rows?: CompareRow<T>[] | null;
  mode: "category" | "transaction" | string;
  labelLeft?: string;
  labelRight?: string;
  onOpenItem: (item: T) => void;
}

export interface TopElementsCompareTableProps<T = unknown> {
  transactionRows?: CompareRow<T>[] | null;
  categoryRows?: CompareRow<T>[] | null;
  labelLeft?: string;
  labelRight?: string;
  elementsToDisplay?: number | string;
}

// One relative-month "row" of the compare table: the earlier period's top
// items on the left, the later period's on the right, so the reader scans
// month-vs-month left to right instead of period-then-period stacked.
function CompareCell({ column, mode, onOpenItem }: CompareCellProps): React.JSX.Element {
  if (!column || column.childrens.length === 0) {
    return (
      <div className="flex flex-col gap-1 min-w-0">
        <p className="text-[11px] text-gf-text-muted text-center">{column?.monthLabel || "No data"}</p>
        <p className="text-xs text-gray-300 italic">Nothing this month</p>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-1 min-w-0">
      <p className="w-full text-center text-sm font-bold text-purple-300 mb-0.5">
        {column.monthLabel}
      </p>
      {column.childrens.map((item, i) =>
        mode === "category" ? (
          <TopCategoryRow key={`${column.index}-${i}-${(item as TopCategoryRowItem)._id || (item as TopCategoryRowItem).type}`} item={item as TopCategoryRowItem} index={i} onClick={onOpenItem as (item: TopCategoryRowItem) => void} />
        ) : (
          <TopTransactionRow key={`${column.index}-${i}-${(item as TransactionItemMovement)._id}`} transaction={item as TransactionItemMovement} onClick={onOpenItem as (transaction: TransactionItemMovement) => void} />
        )
      )}
    </div>
  );
}

function CompareSection({ title, rows, mode, labelLeft, labelRight, onOpenItem }: CompareSectionProps): React.JSX.Element {
  return (
    <div className="w-full flex flex-col gap-2 mb-4">
      <h2 className="text-xl text-purple-300">{title}</h2>
      {!rows || rows.length === 0 ? (
        <p className="text-sm text-gf-text-muted">No items to compare for this period.</p>
      ) : (
        <div className="w-full overflow-x-auto">
          <div className="min-w-[560px] flex flex-col gap-2">
            <div className="grid grid-cols-2 gap-3 sticky top-0 z-[1]">
              <p className="text-xs font-semibold text-purple-300 bg-gf-accent-soft-bg rounded-lg px-2 py-1 truncate" title={labelLeft}>
                {labelLeft}
              </p>
              <p className="text-xs font-semibold text-purple-300 bg-gf-accent-soft-bg rounded-lg px-2 py-1 truncate" title={labelRight}>
                {labelRight}
              </p>
            </div>
            {rows.map((row) => (
              <div key={`compare-row-${row.index}`} className="grid grid-cols-2 gap-3 border-t border-gf-border pt-2">
                <CompareCell column={row.colA} mode={mode} onOpenItem={onOpenItem} />
                <CompareCell column={row.colB} mode={mode} onOpenItem={onOpenItem} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// The "smart table" comparative: left column = the earlier of the two
// picked periods, right column = the later one, rows aligned by relative
// month position (month 1 next to month 1, etc.) rather than calendar name,
// so a 2025-vs-2026 comparison still lines up January with January. Reuses
// the exact same row components (and detail modal) as the single-period
// view above, just laid out two-up per month instead of one column.
function TopElementsCompareTable({ transactionRows, categoryRows, labelLeft, labelRight, elementsToDisplay }: TopElementsCompareTableProps): React.JSX.Element {
  const { close, handleClose, renderModal, modalContent } = useModal();
  function onOpenItem(item: unknown) {
    renderModal(<ModalContentTopMonthItem item={item as ModalContentTopMonthItemItem} close={handleClose} />);
  }
  return (
    <div className="w-full flex flex-col items-start">
      <CompareSection
        title={`Top ${elementsToDisplay} Transactions comparative`}
        rows={transactionRows}
        mode="transaction"
        labelLeft={labelLeft}
        labelRight={labelRight}
        onOpenItem={onOpenItem}
      />
      <CompareSection
        title={`Top ${elementsToDisplay} Categories comparative`}
        rows={categoryRows}
        mode="category"
        labelLeft={labelLeft}
        labelRight={labelRight}
        onOpenItem={onOpenItem}
      />
      {close && <BasicModal close={handleClose} renderContent={modalContent} />}
    </div>
  );
}

export default TopElementsCompareTable;
