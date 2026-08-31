"use client";

import React from "react";
import TransactionItemList from "@/components/Transactions/ItemList/TransactionItemList";

// Reuses the real transaction row component (same one shown everywhere else
// in the app) instead of the old AtomicTop square, stacked one-per-line.
// Wraps it in a clickable layer since TransactionItemList itself has no
// onClick - clicking anywhere on the row opens the shared detail modal.
function TopTransactionRow({ transaction, onClick }) {
  return (
    <div
      onClick={() => onClick?.(transaction)}
      className="w-full cursor-pointer"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onClick?.(transaction);
      }}
    >
      <TransactionItemList movement={transaction} />
    </div>
  );
}

export default TopTransactionRow;
