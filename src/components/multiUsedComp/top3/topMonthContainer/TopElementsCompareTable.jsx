"use client";

import React from "react";
import TopTransactionRow from "./TopTransactionRow";
import TopCategoryRow from "./TopCategoryRow";
import useModal from "@/hooks/useModalBasic";
import BasicModal from "@/components/modals/basicModal/BasicModal";
import ModalContentTopMonthItem from "@/components/modals/contents/modalForTopMonthItem/ModalContentTopMonthItem";

// One relative-month "row" of the compare table: the earlier period's top
// items on the left, the later period's on the right, so the reader scans
// month-vs-month left to right instead of period-then-period stacked.
function CompareCell({ column, mode, onOpenItem }) {
  if (!column || column.childrens.length === 0) {
    return (
      <div className="flex flex-col gap-1 min-w-0">
        <p className="text-[11px] text-gray-400 text-center">{column?.monthLabel || "No data"}</p>
        <p className="text-xs text-gray-300 italic">Nothing this month</p>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-1 min-w-0">
      <p className="w-full text-center text-sm font-bold text-purple-800 mb-0.5">
        {column.monthLabel}
      </p>
      {column.childrens.map((item, i) =>
        mode === "category" ? (
          <TopCategoryRow key={`${column.index}-${i}-${item._id || item.type}`} item={item} index={i} onClick={onOpenItem} />
        ) : (
          <TopTransactionRow key={`${column.index}-${i}-${item._id}`} transaction={item} onClick={onOpenItem} />
        )
      )}
    </div>
  );
}

function CompareSection({ title, rows, mode, labelLeft, labelRight, onOpenItem }) {
  return (
    <div className="w-full flex flex-col gap-2 mb-4">
      <h2 className="text-xl text-purple-700">{title}</h2>
      {!rows || rows.length === 0 ? (
        <p className="text-sm text-gray-400">No items to compare for this period.</p>
      ) : (
        <div className="w-full overflow-x-auto">
          <div className="min-w-[560px] flex flex-col gap-2">
            <div className="grid grid-cols-2 gap-3 sticky top-0 z-[1]">
              <p className="text-xs font-semibold text-purple-700 bg-purple-100 rounded-lg px-2 py-1 truncate" title={labelLeft}>
                {labelLeft}
              </p>
              <p className="text-xs font-semibold text-purple-700 bg-purple-100 rounded-lg px-2 py-1 truncate" title={labelRight}>
                {labelRight}
              </p>
            </div>
            {rows.map((row) => (
              <div key={`compare-row-${row.index}`} className="grid grid-cols-2 gap-3 border-t border-slate-200 pt-2">
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
function TopElementsCompareTable({ transactionRows, categoryRows, labelLeft, labelRight, elementsToDisplay }) {
  const { close, handleClose, renderModal, modalContent } = useModal();
  function onOpenItem(item) {
    renderModal(<ModalContentTopMonthItem item={item} close={handleClose} />);
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
