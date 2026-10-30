"use client";

import React, { useState } from "react";
import { Modal, Tooltip } from "antd";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "@/lib/store";
import TransactionItemList from "@/components/Transactions/ItemList/TransactionItemList";
import EditSingleTransModal, {
  type EditSingleTransItem,
} from "@/components/multiUsedComp/EditSingleTransModal";
import UniversalCategoIcon from "@/components/multiUsedComp/UniversalCategoIcon";
import CategoIcon from "@/components/multiUsedComp/CategoIcon";
import fetcher from "@/helpers/fetcher";
import runNotify from "@/helpers/gastifyNotifier";
import { removeOneTransacction } from "@/lib/features/transacctionsSlice";
import { useT } from "@/i18n/client";

export interface SuggestionCategoryRef {
  _id?: string;
  name?: string;
  color?: string | null;
  icon?: string | null;
  [key: string]: unknown;
}

export interface SuggestionTransaction {
  _id?: string;
  name?: string;
  amount?: number | string;
  category?: SuggestionCategoryRef | null;
  subCategory?: SuggestionCategoryRef | null;
  [key: string]: unknown;
}

export interface SuggestionRuleMatch {
  category?: SuggestionCategoryRef | null;
  subCategory?: SuggestionCategoryRef | null;
  confidence?: "high" | "low" | string;
  [key: string]: unknown;
}

export interface CategorySuggestionEntry {
  transaction: SuggestionTransaction;
  suggestion: SuggestionRuleMatch;
  [key: string]: unknown;
}

export interface CategorySuggestionApplication {
  transactionId?: string;
  category: string | null;
  subCategory: string | null;
}

interface TransactionItemListProps {
  movement?: SuggestionTransaction;
  handleDelete?: (id?: string) => void;
  handleEdit?: (transaction?: SuggestionTransaction) => void;
  style?: string;
  selectable?: boolean;
  selected?: boolean;
  onSelect?: (id?: string) => void;
  [key: string]: unknown;
}

const TypedTransactionItemList = TransactionItemList as React.ComponentType<TransactionItemListProps>;

interface CategoryDotProps {
  color?: string | null;
  icon?: string | null;
}

function CategoryDot({ color, icon }: CategoryDotProps): React.JSX.Element {
  return (
    <div
      style={{ backgroundColor: color || "#DADADA" }}
      className="w-9 h-9 min-w-[36px] min-h-[36px] rounded-full flex items-center justify-center shrink-0"
    >
      <UniversalCategoIcon type={icon || "md/MdFilterNone"} />
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
interface CategoryTransitionChipProps {
  transaction: SuggestionTransaction;
  suggestion: SuggestionRuleMatch;
}

function CategoryTransitionChip({ transaction, suggestion }: CategoryTransitionChipProps): React.JSX.Element {
  const t = useT();
  const currentLabel = transaction.category?.name || transaction.subCategory?.name || t("web.no.category");
  const suggestedLabel = suggestion.subCategory?.name || suggestion.category?.name || t("web.uncategorized");
  const isLowConfidence = suggestion.confidence === "low";

  return (
    <div
      className={`flex items-center justify-between gap-2 rounded-full pl-2 pr-2 py-1.5 w-full border ${
        isLowConfidence ? "bg-amber-500/15 border-amber-200" : "bg-gf-accent-soft-bg border-purple-200"
      }`}
    >
      <div className="flex items-center gap-1.5 min-w-0 shrink">
        <CategoryDot color={transaction.category?.color} icon={transaction.category?.icon} />
        <Tooltip title={currentLabel}>
          <span className="text-xs text-gf-text-muted truncate cursor-default">{currentLabel}</span>
        </Tooltip>
      </div>

      <CategoIcon type="MdArrowForward" siz={16} className="shrink-0 text-gf-text-muted" />

      <div className="flex items-center justify-end gap-1.5 min-w-0 shrink">
        <Tooltip title={suggestedLabel}>
          <span
            className={`text-xs truncate cursor-default text-right ${isLowConfidence ? "text-amber-400" : "text-purple-300"}`}
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
interface SuggestionEntryProps {
  entry: CategorySuggestionEntry;
  selected: boolean;
  // The first row carries the guided tutorial's anchors (the other rows look the same).
  first: boolean;
  onToggle: (id: string) => void;
  onEdit: (transaction: SuggestionTransaction) => void;
  onDelete: (transactionId?: string) => void;
}

function SuggestionEntry({ entry, selected, first, onToggle, onEdit, onDelete }: SuggestionEntryProps): React.JSX.Element {
  const t = useT();
  const id = String(entry.transaction._id);
  return (
    <div className={`flex items-center gap-2 transition-opacity ${selected ? "" : "opacity-40"}`}>
      <input
        type="checkbox"
        data-tour={first ? "tools-check" : undefined}
        checked={selected}
        onChange={() => onToggle(id)}
        className="gf-checkbox-round"
        title={selected ? t("web.uncheck.to.skip.this.suggestion") : t("web.check.to.apply.this.suggestion")}
      />

      <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 sm:border sm:border-gf-border sm:rounded-2xl sm:p-2">
        <div data-tour={first ? "tools-movement" : undefined} className="w-full sm:w-1/2 min-w-0">
          <TypedTransactionItemList
            movement={entry.transaction}
            handleEdit={() => onEdit(entry.transaction)}
            handleDelete={() => onDelete(entry.transaction._id)}
            actionsTour={first ? "tools-actions" : undefined}
          />
        </div>

        <div className="hidden sm:block w-px self-stretch bg-gf-surface-2 shrink-0" />

        <div data-tour={first ? "tools-chip" : undefined} className="w-full sm:w-1/2 min-w-0">
          <CategoryTransitionChip transaction={entry.transaction} suggestion={entry.suggestion} />
        </div>
      </div>
    </div>
  );
}

// Shared "guts" for reviewing/applying category suggestions - no portal/backdrop of
// its own, so it can be dropped into a standalone modal or nested inside a bigger
// tabbed container (e.g. the Movements tools modal).
export interface SuggestionsListProps {
  suggestions: CategorySuggestionEntry[];
  onConfirm: (applications: CategorySuggestionApplication[]) => boolean | Promise<boolean | void> | void;
  onCancel?: () => void;
  confirming?: boolean;
  cancelLabel?: string;
}

interface FetcherDeleteResponse {
  ok?: boolean;
  message?: string;
  [key: string]: unknown;
}

function SuggestionsList({ suggestions: initialSuggestions, onConfirm, onCancel, confirming, cancelLabel: cancelLabelProp }: SuggestionsListProps): React.JSX.Element {
  const t = useT();
  const cancelLabel = cancelLabelProp ?? t("web.skip");
  const [items, setItems] = useState<CategorySuggestionEntry[]>(initialSuggestions);
  const [deselected, setDeselected] = useState<Set<string>>(new Set());
  const [editingTrans, setEditingTrans] = useState<EditSingleTransItem | null>(null);
  const [editKey, setEditKey] = useState<number>(0);
  // Modal.useModal reads the app's theme; the static Modal.confirm does not (it came out white in dark mode).
  const [modal, modalContextHolder] = Modal.useModal();
  const dispatch = useDispatch<AppDispatch>();
  const toFetch = fetcher();

  const toggle = (id: string) => {
    setDeselected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const removeEntry = (transactionId: string | undefined) => {
    setItems((prev) => prev.filter((e) => String(e.transaction._id) !== String(transactionId)));
  };

  const handleEdit = (transaction: SuggestionTransaction) => {
    setEditingTrans(transaction as EditSingleTransItem);
    setEditKey((k) => k + 1);
  };

  const handleEditClose = () => {
    // Whatever happened in the edit modal, this row is no longer this tool's
    // concern - the user took direct control of it.
    if (editingTrans) removeEntry(editingTrans._id);
    setEditingTrans(null);
  };

  const handleDelete = (transactionId?: string) => {
    modal.confirm({
      title: t("movements.delete.confirm"),
      content: t("web.are.you.sure.you.want.to.remove.this.transaction"),
      okText: t("web.yes.delete"),
      okType: "danger",
      cancelText: t("web.cancel"),
      zIndex: 4000, // above this component's own modal wrapper (z-[3000])
      onOk: async () => {
        try {
          dispatch(removeOneTransacction(transactionId));
          const res = (await toFetch.post(
            `general-data/transactions/remove-transaction/${transactionId}`
          )) as FetcherDeleteResponse;
          if (res.ok) {
            runNotify("ok", t("movements.delete.done"));
          } else {
            runNotify("error", t("movements.delete.error"));
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
    return <p className="text-sm text-gf-text-muted text-center py-6">{t("movements.dup.nothingLeft")}</p>;
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-4">
        {items.map((entry, index) => (
          <SuggestionEntry
            key={String(entry.transaction._id)}
            entry={entry}
            first={index === 0}
            selected={!deselected.has(String(entry.transaction._id))}
            onToggle={toggle}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ))}
      </div>

      <p data-tour="tools-footer" className="text-xs text-center text-gf-text-muted bg-gf-surface-2 rounded-xl py-2 px-3">
        {effective.length > 0
          ? `${effective.length} transaction${effective.length !== 1 ? "s" : ""} will be categorized.`
          : t("web.all.items.unchecked.nothing.will.change")}
      </p>

      <div className="flex gap-3 justify-end">
        {onCancel && (
          <button
            onClick={onCancel}
            disabled={confirming}
            className="px-4 py-2 rounded-full text-sm text-gf-text-muted hover:text-gf-text-muted hover:bg-gf-surface-2 transition-colors disabled:opacity-50"
          >
            {cancelLabel}
          </button>
        )}
        <button
          data-tour="tools-apply"
          onClick={handleConfirm}
          disabled={confirming || effective.length === 0}
          className="flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium gf-glass-button text-white"
        >
          {confirming && (
            <svg className="animate-spin h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
          )}
          {confirming ? "Applying…" : t("web.apply.p1", { p1: effective.length })}
        </button>
      </div>

      {modalContextHolder}
      {editingTrans && (
        <EditSingleTransModal key={editKey} trans={editingTrans} onClose={handleEditClose} />
      )}
    </div>
  );
}

export default SuggestionsList;
