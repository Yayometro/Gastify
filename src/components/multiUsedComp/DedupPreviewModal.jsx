"use client";

import { createPortal } from "react-dom";
import { useState } from "react";
import TransactionItemList from "@/components/Transactions/ItemList/TransactionItemList";
import dayjs from "dayjs";
import { formatMoneyMajor } from "@/lib/money/currencies";

function ExcelRowChip({ match }) {
  if (!match) return null;
  return (
    <div className="h-full bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 flex flex-col justify-center gap-[3px] min-h-0">
      <p className="text-xs font-medium text-amber-800 truncate" title={match.name}>
        {match.name}
      </p>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] text-amber-600 whitespace-nowrap">
          {dayjs(match.date).format("DD/MM/YYYY")}
        </p>
        <p className="text-[11px] font-semibold text-amber-700 whitespace-nowrap">
          {formatMoneyMajor(match.amount ?? 0, match.currency || "MXN")}
        </p>
      </div>
    </div>
  );
}

function DeleteRow({ transaction, selected, onToggle }) {
  const id = String(transaction._id);
  return (
    <div
      className={`grid gap-2 transition-opacity ${selected ? "" : "opacity-40"}`}
      style={{ gridTemplateColumns: "auto minmax(0,1fr) clamp(160px, 22%, 220px)" }}
    >
      <div className="flex items-center">
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onToggle(id)}
          className="w-4 h-4 cursor-pointer accent-red-500"
          title={selected ? "Uncheck to skip deletion" : "Check to include in deletion"}
        />
      </div>
      <div className="min-w-0">
        <TransactionItemList movement={transaction} />
      </div>
      <ExcelRowChip match={transaction._match} />
    </div>
  );
}

function SideColumn({ title, colorClass, children, maxH = "max-h-[55vh]", headerRight }) {
  return (
    <div className="flex flex-col gap-2 flex-1 min-w-0">
      <div className="flex items-center justify-between">
        <h3 className={`text-sm font-semibold ${colorClass}`}>{title}</h3>
        {headerRight}
      </div>
      <div className={`flex flex-col gap-2 ${maxH} overflow-y-auto pr-1`}>
        {children}
      </div>
    </div>
  );
}

function DedupPreviewModal({ preview, deleteAll, onConfirm, onCancel, confirming }) {
  const { toDelete = [], toKeep = [], scanned = 0 } = preview;

  const [deselected, setDeselected] = useState(new Set());

  const toggle = (id) => {
    setDeselected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const effective = toDelete.filter((t) => !deselected.has(String(t._id)));
  const skipped = deselected.size;
  const handleConfirm = () => onConfirm(effective.map((t) => String(t._id)));

  // In "keep one" mode the modal goes side-by-side and needs extra width
  const maxW = deleteAll ? "max-w-[1000px]" : "max-w-[1280px]";

  return createPortal(
    <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className={`bg-white rounded-3xl shadow-2xl w-full ${maxW} mx-2 sm:mx-4 flex flex-col gap-5 p-4 sm:p-7 max-h-[95vh] overflow-y-auto`}>

        {/* Header */}
        <div className="text-center">
          <h2 className="text-xl font-semibold text-slate-800">Confirm deduplication</h2>
          <p className="text-xs text-slate-400 mt-1">
            {scanned} row{scanned !== 1 ? "s" : ""} scanned
            {!deleteAll && " · uncheck any item to skip deletion"}
          </p>
        </div>

        {/* ── DELETE ALL mode: single column ── */}
        {deleteAll && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between pr-1">
              <h3 className="text-sm font-semibold text-red-500">
                Will be deleted{" "}
                <span className="font-normal text-slate-400">
                  ({effective.length} of {toDelete.length})
                  {skipped > 0 && <span> · {skipped} skipped</span>}
                </span>
              </h3>
              {toDelete.length > 0 && (
                <span className="text-[10px] uppercase tracking-wide text-amber-500 w-[clamp(160px,22%,220px)] text-center">
                  Excel row
                </span>
              )}
            </div>
            {toDelete.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No transactions will be deleted.</p>
            ) : (
              <div className="flex flex-col gap-2 max-h-[58vh] overflow-y-auto pr-1">
                {toDelete.map((t) => (
                  <DeleteRow
                    key={String(t._id)}
                    transaction={t}
                    selected={!deselected.has(String(t._id))}
                    onToggle={toggle}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── KEEP ONE mode: side-by-side columns ── */}
        {!deleteAll && (
          <div className="flex gap-4 items-start">
            {/* Left — will be kept */}
            <SideColumn
              title={`Will be kept (${toKeep.length})`}
              colorClass="text-green-600"
            >
              {toKeep.length === 0
                ? <p className="text-xs text-slate-400 italic">Nothing to keep.</p>
                : toKeep.map((t) => (
                    <div key={String(t._id)} className="min-w-0">
                      <TransactionItemList movement={t} />
                    </div>
                  ))
              }
            </SideColumn>

            {/* Vertical divider */}
            <div className="w-px self-stretch bg-slate-200 shrink-0" />

            {/* Right — will be deleted */}
            <SideColumn
              title={`Will be deleted (${effective.length} of ${toDelete.length}${skipped > 0 ? `, ${skipped} skipped` : ""})`}
              colorClass="text-red-500"
              headerRight={
                toDelete.length > 0 ? (
                  <span className="text-[10px] uppercase tracking-wide text-amber-500 w-[clamp(160px,22%,220px)] text-center">
                    Excel row
                  </span>
                ) : null
              }
            >
              {toDelete.length === 0
                ? <p className="text-xs text-slate-400 italic">No transactions will be deleted.</p>
                : toDelete.map((t) => (
                    <DeleteRow
                      key={String(t._id)}
                      transaction={t}
                      selected={!deselected.has(String(t._id))}
                      onToggle={toggle}
                    />
                  ))
              }
            </SideColumn>
          </div>
        )}

        {/* Summary */}
        <p className="text-xs text-center text-slate-500 bg-slate-50 rounded-xl py-2 px-3">
          {effective.length > 0
            ? `${effective.length} transaction${effective.length !== 1 ? "s" : ""} will be permanently deleted.${skipped > 0 ? ` ${skipped} unchecked will be kept.` : ""}`
            : toDelete.length > 0
            ? "All items unchecked — nothing will be deleted."
            : "No duplicates found — nothing to delete."}
        </p>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            disabled={confirming}
            className="px-4 py-2 rounded-full text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={confirming || effective.length === 0}
            className="flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium bg-red-500 text-white hover:bg-red-600 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {confirming && (
              <svg className="animate-spin h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
            )}
            {confirming ? "Deleting…" : `Delete ${effective.length}`}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default DedupPreviewModal;
