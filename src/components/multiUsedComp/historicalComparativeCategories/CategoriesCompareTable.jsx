"use client";

import React from "react";
import TopCategoryRow from "../top3/topMonthContainer/TopCategoryRow";
import { formatMoneyMajor } from "@/lib/money/currencies";

const TOP_N = 10;

// A mirrored bar chart forces both periods onto the same x-axis order, which
// only makes sense when the two periods actually rank their categories the
// same way - the moment period B's #1 category isn't period A's #1 (e.g. a
// "Vacations" category that spikes in one year but barely exists in the
// other), the shared axis stops representing either period's real ranking.
// A table sidesteps that: each column is sorted purely by its own values,
// so "row 1" on the left and "row 1" on the right are each period's actual
// top category, even if they're not the same category.
function CategoriesCompareTable({
  rowsA,
  rowsB,
  totalA,
  totalB,
  labelA,
  labelB,
  kindLabel,
  walletPrimaryCurrency = "MXN",
  onOpenItem,
}) {
  const topA = (rowsA || []).slice(0, TOP_N);
  const topB = (rowsB || []).slice(0, TOP_N);

  return (
    <div className="w-full flex flex-col items-center gap-2">
      <div className="flex items-center justify-center gap-3 flex-wrap text-sm">
        <div className="flex flex-col items-center">
          <b className="text-xs text-gray-500">{labelA}</b>
          <p>
            Total {kindLabel}: <b>{formatMoneyMajor(totalA || 0, walletPrimaryCurrency)}</b>
          </p>
        </div>
        <span className="text-purple-700 font-bold shrink-0">VS</span>
        <div className="flex flex-col items-center">
          <b className="text-xs text-gray-500">{labelB}</b>
          <p>
            Total {kindLabel}: <b>{formatMoneyMajor(totalB || 0, walletPrimaryCurrency)}</b>
          </p>
        </div>
      </div>
      <div className="w-full grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1 min-w-0">
          {topA.length === 0 ? (
            <p className="text-xs text-gray-400 text-center">No categories</p>
          ) : (
            topA.map((item, i) => (
              <TopCategoryRow key={`a-${item._id || item.type || i}`} item={item} index={i} onClick={onOpenItem} />
            ))
          )}
        </div>
        <div className="flex flex-col gap-1 min-w-0">
          {topB.length === 0 ? (
            <p className="text-xs text-gray-400 text-center">No categories</p>
          ) : (
            topB.map((item, i) => (
              <TopCategoryRow key={`b-${item._id || item.type || i}`} item={item} index={i} onClick={onOpenItem} />
            ))
          )}
        </div>
      </div>
      <p className="text-[10px] text-gray-400 text-center">
        Each side ranks its own top {TOP_N} categories independently - row 1 on the left and row 1
        on the right don't have to be the same category.
      </p>
    </div>
  );
}

export default CategoriesCompareTable;
