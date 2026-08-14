"use client";

import { useState } from "react";
import { Modal, Tooltip } from "antd";
import { useDispatch } from "react-redux";
import TransactionItemList from "@/components/Transactions/ItemList/TransactionItemList";
import EditSingleTransModal from "@/components/multiUsedComp/EditSingleTransModal";
import UniversalCategoIcon from "@/components/multiUsedComp/UniversalCategoIcon";
import CategoIcon from "@/components/multiUsedComp/CategoIcon";
import fetcher from "@/helpers/fetcher";
import runNotify from "@/helpers/gastifyNotifier";
import { removeOneTransacction } from "@/lib/features/transacctionsSlice";

function CategoryDot({ color, icon }) {
  return (
    <div
      style={{ backgroundColor: color || "#DADADA" }}
      className="w-9 h-9 min-w-[36px] min-h-[36px] rounded-full flex items-center justify-center shrink-0"
    >
      <UniversalCategoIcon type={icon || "md/MdFilterNone"} size={16} />
    </div>
  );
}

// Before -> after preview of what the suggestion would change, kept as its own
// chip (separate from the transaction row) rather than a small badge buried
// inside the row. Full-width so it reads as a peer of the transaction, not a
// footnote - on mobile that means edge-to-edge below it, on sm+ it fills the
// right-hand column next to the transaction. justify-between spreads it into
// three slots across the full width: current (left), arrow (center),
// suggested (right, dot flush against the edge).
function CategoryTransitionChip({ transaction, suggestion }) {
  const currentLabel = transaction.category?.name || transaction.subCategory?.name || "No category";
  const suggestedLabel = suggestion.subCategory?.name || suggestion.category?.name || "Uncategorized";
  const isLowConfidence = suggestion.confidence === "low";

  return (
    <div
      className={`flex items-center justify-between gap-2 rounded-full pl-2 pr-2 py-1.5 w-full border ${
        isLowConfidence ? "bg-amber-50 border-amber-200" : "bg-purple-50 border-purple-200"
      }`}
    >
      <div className="flex items-center gap-1.5 min-w-0 shrink">
        <CategoryDot color={transaction.category?.color} icon={transaction.category?.icon} />
        <Tooltip title={currentLabel}>
          <span className="text-xs text-slate-500 truncate cursor-default">{currentLabel}</span>
        </Tooltip>
      </div>

      <CategoIcon type="MdArrowForward" siz={16} className="shrink-0 text-slate-400" />

      <div className="flex items-center justify-end gap-1.5 min-w-0 shrink">
        <Tooltip title={suggestedLabel}>
          <span
            className={`text-xs truncate cursor-default text-right ${isLowConfidence ? "text-amber-700" : "text-purple-700"}`}
          >
            {suggestedLabel}
          </span>
        </Tooltip>
        <CategoryDot color={suggestion.category?.color || suggestion.subCategory?.color} icon={suggestion.category?.icon || suggestion.subCategory?.icon} />
      </div>
    </div>
  );
}

// Checkbox stays a single left-hand column, vertically centered against the
// whole item - it never splits the transaction from the chip into separate
// rows. What changes responsively is only the content beside it: stacked
// (transaction on top, chip below, both full width) on mobile, side by side
// as two roughly-equal columns split by a divider on sm+, like a table row.
function SuggestionEntry({ entry, selected, onToggle, onEdit, onDelete }) {
  const id = String(entry.transaction._id);
  return (
    <div className={`flex items-center gap-2 transition-opacity ${selected ? "" : "opacity-40"}`}>
      <input
        type="checkbox"
        checked={selected}
        onChange={() => onToggle(id)}
        className="w-4 h-4 cursor-pointer shrink-0 accent-purple-600"
        title={selected ? "Uncheck to skip this suggestion" : "Check to apply this suggestion"}
      />

      <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 sm:border sm:border-slate-100 sm:rounded-2xl sm:p-2">
        <div className="w-full sm:w-1/2 min-w-0">
          <TransactionItemList
            movement={entry.transaction}
            handleEdit={() => onEdit(entry.transaction)}
            handleDelete={() => onDelete(entry.transaction._id)}
          />
        </div>

        <div className="hidden sm:block w-px self-stretch bg-slate-200 shrink-0" />

        <div className="w-full sm:w-1/2 min-w-0">
          <CategoryTransitionChip transaction={entry.transaction} suggestion={entry.suggestion} />
        </div>
      </div>
    </div>
  );
}

// Shared "guts" for reviewing/applying category suggestions - no portal/backdrop of
// its own, so it can be dropped into a standalone modal or nested inside a bigger
// tabbed container (e.g. the Movements tools modal).
function SuggestionsList({ suggestions: initialSuggestions, onConfirm, onCancel, confirming, cancelLabel = "Skip" }) {
  const [items, setItems] = useState(initialSuggestions);
  const [deselected, setDeselected] = useState(new Set());
  const [editingTrans, setEditingTrans] = useState(null);
  const [editKey, setEditKey] = useState(0);
  const dispatch = useDispatch();
  const toFetch = fetcher();

  const toggle = (id) => {
    setDeselected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const removeEntry = (transactionId) => {
    setItems((prev) => prev.filter((e) => String(e.transaction._id) !== String(transactionId)));
  };

  const handleEdit = (transaction) => {
    setEditingTrans(transaction);
    setEditKey((k) => k + 1);
  };

  const handleEditClose = () => {
    // Whatever happened in the edit modal, this row is no longer this tool's
    // concern - the user took direct control of it.
    if (editingTrans) removeEntry(editingTrans._id);
    setEditingTrans(null);
  };

  const handleDelete = (transactionId) => {
    Modal.confirm({
      title: "Delete this movement?",
      content: "Are you sure you want to remove this transaction?",
      okText: "Yes, delete",
      okType: "danger",
      cancelText: "Cancel",
      zIndex: 4000, // above this component's own modal wrapper (z-[3000])
      onOk: async () => {
        try {
          dispatch(removeOneTransacction(transactionId));
          const res = await toFetch.post(`general-data/transactions/remove-transaction/${transactionId}`);
          if (res.ok) {
            runNotify("ok", "Movement deleted successfully!");
          } else {
            runNotify("error", "Error removing transaction.");
          }
        } catch (e) {
          runNotify("error", String(e));
        } finally {
          removeEntry(transactionId);
        }
      },
    });
  };

  const effective = items.filter((e) => !deselected.has(String(e.transaction._id)));

  const handleConfirm = async () => {
    const applications = effective.map((e) => ({
      transactionId: e.transaction._id,
      category: e.suggestion.category?._id || null,
      subCategory: e.suggestion.subCategory?._id || null,
    }));
    const success = await onConfirm(applications);
    if (success !== false) {
      const appliedIds = new Set(effective.map((e) => String(e.transaction._id)));
      setItems((prev) => prev.filter((e) => !appliedIds.has(String(e.transaction._id))));
      setDeselected(new Set());
    }
  };

  if (items.length === 0) {
    return <p className="text-sm text-slate-400 text-center py-6">Nothing left to review here.</p>;
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-4">
        {items.map((entry) => (
          <SuggestionEntry
            key={String(entry.transaction._id)}
            entry={entry}
            selected={!deselected.has(String(entry.transaction._id))}
            onToggle={toggle}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ))}
      </div>

      <p className="text-xs text-center text-slate-500 bg-slate-50 rounded-xl py-2 px-3">
        {effective.length > 0
          ? `${effective.length} transaction${effective.length !== 1 ? "s" : ""} will be categorized.`
          : "All items unchecked — nothing will change."}
      </p>

      <div className="flex gap-3 justify-end">
        {onCancel && (
          <button
            onClick={onCancel}
            disabled={confirming}
            className="px-4 py-2 rounded-full text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-50"
          >
            {cancelLabel}
          </button>
        )}
        <button
          onClick={handleConfirm}
          disabled={confirming || effective.length === 0}
          className="flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium bg-purple-600 text-white hover:bg-purple-500 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {confirming && (
            <svg className="animate-spin h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
          )}
          {confirming ? "Applying…" : `Apply ${effective.length}`}
        </button>
      </div>

      {editingTrans && (
        <EditSingleTransModal key={editKey} trans={editingTrans} onClose={handleEditClose} />
      )}
    </div>
  );
}

export default SuggestionsList;
