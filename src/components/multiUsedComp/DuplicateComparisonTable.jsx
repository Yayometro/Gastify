"use client";
import React from "react";
import UniversalCategoIcon from "./UniversalCategoIcon";
import DeletePreviewRow from "./DeletePreviewRow";

function DuplicateComparisonTable({ pairs, selectedTrans = [], selectedIds, onToggleSelect }) {
  if (!pairs || pairs.length === 0) {
    return <p className="text-xs text-slate-400 italic text-center py-4">No duplicate pairs to compare</p>;
  }

  // Support both selectedTrans array or selectedIds Set/array
  const selArray = selectedTrans.length > 0 ? selectedTrans : (selectedIds ? Array.from(selectedIds) : []);
  const selectedSet = new Set(selArray.map(String));

  return (
    <div className="flex flex-col border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
      <div className="bg-amber-50 border-b border-amber-200 px-3 py-2 text-[11px] text-amber-800 flex items-center gap-2">
        <span className="text-sm">☑️</span>
        <span>
          <b>Checked items</b> will be permanently deleted when you confirm. Uncheck any duplicate you want to keep, or check an original if you want to delete it too.
        </span>
      </div>
      <div className="grid grid-cols-2 bg-slate-100 border-b border-slate-200 py-2 px-3 font-semibold text-xs text-slate-700">
        <div className="flex items-center gap-1.5 text-green-700 truncate">
          <UniversalCategoIcon type="md/MdCheckCircle" siz={15} />
          <span>ORIGINAL (TO KEEP)</span>
        </div>
        <div className="flex items-center gap-1.5 text-red-600 truncate">
          <UniversalCategoIcon type="md/MdDelete" siz={15} />
          <span>DUPLICATE (TO DELETE)</span>
        </div>
      </div>
      <div className="max-h-[50vh] overflow-y-auto divide-y divide-slate-200">
        {pairs.map((pair, index) => {
          const isOrigChecked = pair.original ? selectedSet.has(String(pair.original._id)) : false;
          const isDupChecked = pair.duplicate ? selectedSet.has(String(pair.duplicate._id)) : false;

          return (
            <div
              key={`dup-pair-${index}-${pair.duplicate?._id}`}
              className="grid grid-cols-2 gap-3 p-2 items-center hover:bg-slate-100/50 transition-colors"
            >
              {/* Left Column: Original */}
              <div className="min-w-0 flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isOrigChecked}
                  onChange={() => pair.original && onToggleSelect && onToggleSelect(pair.original._id)}
                  className="w-4 h-4 text-red-600 rounded border-slate-300 focus:ring-red-500 cursor-pointer flex-shrink-0"
                  title="Check to also delete this original transaction"
                />
                <div className={`min-w-0 flex-1 transition-all ${isOrigChecked ? "opacity-40 line-through grayscale" : ""}`}>
                  <DeletePreviewRow transaction={pair.original} />
                </div>
              </div>

              {/* Right Column: Duplicate */}
              <div className="min-w-0 flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isDupChecked}
                  onChange={() => pair.duplicate && onToggleSelect && onToggleSelect(pair.duplicate._id)}
                  className="w-4 h-4 text-red-600 rounded border-slate-300 focus:ring-red-500 cursor-pointer flex-shrink-0"
                  title="Uncheck to keep this transaction instead of deleting it"
                />
                <div className={`min-w-0 flex-1 transition-all ${!isDupChecked ? "opacity-60 border-2 border-green-500/30 rounded-xl" : ""}`}>
                  <DeletePreviewRow transaction={pair.duplicate} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default DuplicateComparisonTable;
