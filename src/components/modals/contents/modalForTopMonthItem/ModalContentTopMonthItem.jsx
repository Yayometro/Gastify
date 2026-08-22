"use client";

import { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { Tooltip, Modal, Button } from "antd";
import { useDispatch, useSelector } from "react-redux";
import CategoIcon from "@/components/multiUsedComp/CategoIcon";
import UniversalCategoIcon from "@/components/multiUsedComp/UniversalCategoIcon";
import TransactionItemList from "@/components/Transactions/ItemList/TransactionItemList";
import { formatMoneyMajor } from "@/lib/money/currencies";
import EditSingleTransModal from "@/components/multiUsedComp/EditSingleTransModal";
import EditMultipleTransModal from "@/components/multiUsedComp/EditMultipleTransModal";
import QuickEditModal from "@/components/multiUsedComp/QuickEditModal";
import fetcher from "@/helpers/fetcher";
import runNotify from "@/helpers/gastifyNotifier";
import DeletePreviewRow from "@/components/multiUsedComp/DeletePreviewRow";
import DuplicateComparisonTable from "@/components/multiUsedComp/DuplicateComparisonTable";
import {
  removeOneTransacction,
  removeManyTransactions,
} from "@/lib/features/transacctionsSlice";
import {
  getDuplicates,
  getDuplicatesToDelete,
  getAllMatchingIds,
  getDuplicatePairs,
} from "@/helpers/transformers/transactionDuplicates";

const QUICK_ACTIONS = [
  { key: "name",     label: "Rename",   icon: "MdDriveFileRenameOutline" },
  { key: "date",     label: "Date",     icon: "MdCalendarMonth" },
  { key: "type",     label: "Type",     icon: "MdSwapVert" },
  { key: "category", label: "Category", icon: "MdCategory" },
  { key: "account",  label: "Account",  icon: "MdAccountBalance" },
  { key: "tags",     label: "Tags",     icon: "MdLocalOffer" },
];

function ModalContentTopMonthItem({ item, close }) {
  const dispatch = useDispatch();
  const walletPrimaryCurrency = useSelector((state) => state.walletReducer?.data?.primaryCurrency) || "MXN";
  const toFetch = fetcher();

  // Capture original IDs at mount — never changes
  const originalIds = useMemo(
    () => (item.children?.length > 0 ? item.children : [item]).map((t) => t._id),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // Track deletions locally
  const [deletedIds, setDeletedIds] = useState(new Set());

  // Derive localItems live from Redux so edits reflect immediately,
  // and dynamically remove items if their category or isBill type changed away from this modal's item!
  const allTransactions = useSelector((state) => state.transacctionsReducer.data);
  const localItems = useMemo(() => {
    return originalIds
      .filter((id) => !deletedIds.has(id))
      .map((id) => allTransactions.find((t) => t._id === id))
      .filter(Boolean)
      .filter((t) => {
        if (item.isBill !== undefined && t.isBill !== item.isBill) {
          return false;
        }
        if (item.children?.length > 0 || item.childrens?.length > 0) {
          const catId = item._id;
          const catName = item.type || item.name;
          const tCatId = t.category?._id;
          const tCatName = t.category?.name || "No category";
          if (catId && catId !== "No category" && tCatId) {
            return String(tCatId) === String(catId);
          }
          return tCatName === catName;
        }
        return true;
      });
  }, [allTransactions, originalIds, deletedIds, item]);

  const [selected, setSelected] = useState(new Set());
  const [editTrans, setEditTrans] = useState(null);
  const [editKey, setEditKey] = useState(0);
  const [quickEditField, setQuickEditField] = useState(null);
  const [generalEditOpen, setGeneralEditOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [dupMode, setDupMode] = useState(false);
  const [dupCriteria, setDupCriteria] = useState({ name: true, date: true, amount: true, category: false, subcategory: false });
  const [dupDateTolerance, setDupDateTolerance] = useState(0);
  const [dupAmountTolerance, setDupAmountTolerance] = useState(0);
  const [comparing, setComparing] = useState(false);
  const [dupDeleteAll, setDupDeleteAll] = useState(false);

  const displayItems = useMemo(() => {
    if (!dupMode) return localItems;
    const dups = getDuplicates(localItems, dupCriteria, dupDateTolerance, dupAmountTolerance);
    const dupIds = new Set(dups.map((d) => d._id));
    return localItems.filter((t) => dupIds.has(t._id));
  }, [localItems, dupMode, dupCriteria, dupDateTolerance, dupAmountTolerance]);

  const toggleSelect = (id) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const toggleAll = () =>
    setSelected(
      selected.size === displayItems.length && displayItems.length > 0
        ? new Set()
        : new Set(displayItems.map((t) => t._id))
    );

  const removeLocal = (ids) => {
    const idSet = new Set(ids);
    setDeletedIds((prev) => new Set([...prev, ...idSet]));
    setSelected((prev) => {
      const s = new Set(prev);
      ids.forEach((id) => s.delete(id));
      return s;
    });
    const remaining = originalIds.filter(
      (id) => !deletedIds.has(id) && !idSet.has(id)
    );
    if (remaining.length === 0) close();
  };

  const handleEdit = (trans) => {
    setEditTrans(trans);
    setEditKey((k) => k + 1);
  };

  const executeDeleteSingle = async (id) => {
    try {
      setDeleting(true);
      const res = await toFetch.post(
        `general-data/transactions/remove-transaction/${id}`,
        {}
      );
      if (res.ok !== false) {
        dispatch(removeOneTransacction(id));
        runNotify("ok", res.message || "Transaction deleted");
        removeLocal([id]);
      } else {
        runNotify("error", res.message || "Error deleting transaction");
      }
    } catch (e) {
      runNotify("error", String(e));
    } finally {
      setDeleting(false);
    }
  };

  const executeDeleteMany = async (ids) => {
    try {
      setDeleting(true);
      const res = await toFetch.post(
        "general-data/transactions/remove-many",
        { manyTrans: ids }
      );
      if (res.ok !== false) {
        dispatch(removeManyTransactions(ids));
        runNotify("ok", res.message || `${ids.length} transaction(s) deleted`);
        removeLocal(ids);
      } else {
        runNotify("error", res.message || "Error deleting transactions");
      }
    } catch (e) {
      runNotify("error", String(e));
    } finally {
      setDeleting(false);
    }
  };

  const handleDelete = (id) => {
    setConfirmDelete({ type: "single", id });
  };

  const handleDeleteSelected = () => {
    const ids = [...selected];
    if (!ids.length) return;
    setConfirmDelete({ type: "many", ids });
  };

  const selectionCount = selected.size;
  const allSelected = selectionCount > 0 && selectionCount === localItems.length;
  const isMulti = localItems.length > 1;
  const selectedTransObjects = localItems.filter((t) => selected.has(t._id));

  return (
    <>
      <div className="content absolute bg-slate-100 border-2 border-purple-600 flex flex-col w-full h-full max-w-[500px] max-h-[90%] rounded-2xl items-center justify-center overflow-hidden z-[10002]">
        {/* Header */}
        <header className="pt-2 w-full h-fit flex flex-col justify-between items-center bg-purple-600 text-white sticky top-0 z-10">
          <span className="w-full flex gap-1 items-center justify-center font-bold text-3xl px-8">
            <UniversalCategoIcon
              type={item?.icon || item?.type || item?.category?.icon || "md/MdFilterNone"}
              siz={30}
            />
            <Tooltip title={`${item?.name || item?.type || "No name..."} Detail`} placement="bottom">
              <h1 className="truncate max-w-[70%]">
                {item?.name || item?.type || "No name..."} Detail
              </h1>
            </Tooltip>
          </span>
          <p className="font-semibold">
            <b>{formatMoneyMajor(item?.value || item?.amount, walletPrimaryCurrency) || "No total info..."}</b>
          </p>

          {/* Selection controls — only when multiple items */}
          {isMulti && (
            <div className="w-full px-3 pb-1 mt-1 flex flex-col gap-1">
              {/* Row 1: select-all, count, delete */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={toggleAll}
                  className="flex items-center gap-1 text-xs text-white/80 hover:text-white border border-white/30 rounded-lg px-2 py-0.5 transition-colors"
                >
                  <CategoIcon
                    type={allSelected ? "MdCheckBox" : "MdCheckBoxOutlineBlank"}
                    siz={14}
                  />
                  {allSelected ? "Deselect all" : "Select all"}
                </button>
                {selectionCount > 0 && !allSelected && (
                  <button
                    onClick={() => setSelected(new Set())}
                    className="flex items-center gap-1 text-xs text-white/80 hover:text-white border border-white/30 rounded-lg px-2 py-0.5 transition-colors"
                  >
                    <CategoIcon type="MdCheckBoxOutlineBlank" siz={14} />
                    Deselect all
                  </button>
                )}
                {selectionCount > 0 && (
                  <span className="text-xs text-white/70">{selectionCount} selected</span>
                )}
                {selectionCount > 0 && (
                  <button
                    onClick={handleDeleteSelected}
                    className="ml-auto flex items-center gap-1 text-xs text-white/80 hover:text-red-300 border border-white/30 hover:border-red-400 rounded-lg px-2 py-0.5 transition-colors"
                  >
                    <CategoIcon type="MdDelete" siz={14} />
                    Delete
                  </button>
                )}
                <button
                  onClick={() => {
                    setDupMode(!dupMode);
                    setSelected(new Set());
                  }}
                  className={`ml-auto flex items-center gap-1 text-xs border rounded-lg px-2 py-0.5 transition-colors ${
                    dupMode
                      ? "bg-purple-600 text-white border-purple-400 font-medium shadow-2xs"
                      : "text-white/80 hover:text-white border-white/30"
                  }`}
                >
                  <CategoIcon type="MdOutlineFindInPage" siz={14} />
                  {dupMode ? "Exit duplicates" : "Find duplicates"}
                </button>
              </div>

              {/* Row 2: quick-edit + general edit — only when ≥1 selected */}
              {selectionCount > 0 && (
                <div className="flex flex-wrap gap-1 pb-0.5">
                  {QUICK_ACTIONS.map((action) => (
                    <button
                      key={action.key}
                      onClick={() => setQuickEditField(action.key)}
                      className="flex items-center gap-1 bg-white/20 hover:bg-white/30 text-white text-xs rounded-lg px-2 py-0.5 border border-white/20"
                    >
                      <CategoIcon type={action.icon} siz={12} />
                      {action.label}
                    </button>
                  ))}
                  <Tooltip title="Edit all fields at once. Blank fields keep their original value.">
                    <button
                      onClick={() => setGeneralEditOpen(true)}
                      className="flex items-center gap-1 bg-white/10 hover:bg-white/20 text-white/70 hover:text-white text-xs rounded-lg px-2 py-0.5 border border-white/20"
                    >
                      <CategoIcon type="MdOutlineCreate" siz={12} />
                      General
                    </button>
                  </Tooltip>
                </div>
              )}

              {dupMode && (
                <div className="flex flex-col gap-2.5 w-full bg-purple-950/80 border border-purple-400/50 rounded-2xl p-3 my-1 text-xs text-white shadow-md">
                  {/* Row 1: Criteria Checkboxes */}
                  <div className="flex flex-wrap items-center gap-3 border-b border-purple-400/20 pb-2">
                    <span className="text-white/70 font-medium">Match criteria:</span>
                    {[
                      { key: "name",        label: "Name" },
                      { key: "date",        label: "Date" },
                      { key: "amount",      label: "Amount" },
                      { key: "category",    label: "Category" },
                      { key: "subcategory", label: "Subcategory" },
                    ].map(({ key, label }) => (
                      <label key={key} className="flex items-center gap-1 cursor-pointer text-white/90 hover:text-white select-none">
                        <input
                          type="checkbox"
                          checked={dupCriteria[key]}
                          onChange={() => setDupCriteria((prev) => ({ ...prev, [key]: !prev[key] }))}
                          className="accent-purple-400 rounded cursor-pointer"
                        />
                        {label}
                      </label>
                    ))}
                  </div>

                  {/* Row 2: Tolerance Controls */}
                  <div className="flex flex-wrap items-center gap-4 border-b border-purple-400/20 pb-2">
                    <div className="flex items-center gap-2">
                      <Tooltip title="Allow this many days of difference between dates to still count as duplicates">
                        <label className="text-white/80 select-none cursor-help">Date tolerance:</label>
                      </Tooltip>
                      <select
                        value={dupDateTolerance}
                        onChange={(e) => setDupDateTolerance(Number(e.target.value))}
                        className="bg-purple-900 border border-purple-400/60 text-white rounded-lg px-2 py-0.5 outline-none focus:border-purple-300"
                      >
                        <option value={0}>Exact (same day)</option>
                        <option value={1}>±1 day</option>
                        <option value={3}>±3 days</option>
                        <option value={7}>±7 days</option>
                        <option value={30}>±30 days</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <Tooltip title="Allow this amount difference (in your currency) between two transactions to still count as duplicates">
                        <label className="text-white/80 select-none cursor-help">Amount tolerance:</label>
                      </Tooltip>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={dupAmountTolerance}
                        onChange={(e) => setDupAmountTolerance(Math.max(0, Number(e.target.value)))}
                        className="bg-purple-900 border border-purple-400/60 text-white rounded-lg px-2 py-0.5 w-20 outline-none focus:border-purple-300"
                        placeholder="0.00"
                      />
                    </div>
                    <Tooltip title="Reset to default criteria (Name + Date + Amount, exact match)">
                      <button
                        onClick={() => {
                          setDupCriteria({ name: true, date: true, amount: true, category: false, subcategory: false });
                          setDupDateTolerance(0);
                          setDupAmountTolerance(0);
                        }}
                        className="ml-auto text-white/80 hover:text-white border border-white/20 hover:border-white/40 px-2.5 py-0.5 rounded-lg transition-colors flex items-center gap-1"
                      >
                        <UniversalCategoIcon type="md/MdRefresh" siz={13} />
                        Refresh defaults
                      </button>
                    </Tooltip>
                  </div>

                  {/* Row 3: Selection Tools & Action Buttons */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => {
                          const idsToDelete = dupDeleteAll
                            ? getAllMatchingIds(localItems, dupCriteria, dupDateTolerance, dupAmountTolerance)
                            : getDuplicatesToDelete(localItems, dupCriteria, dupDateTolerance, dupAmountTolerance);
                          setSelected(new Set(idsToDelete));
                        }}
                        className="bg-purple-600 hover:bg-purple-500 text-white px-2.5 py-1 rounded-lg font-medium transition-colors border border-purple-400/50 shadow-2xs"
                      >
                        Select possible duplicates ({
                          dupDeleteAll
                            ? getAllMatchingIds(localItems, dupCriteria, dupDateTolerance, dupAmountTolerance).length
                            : getDuplicatesToDelete(localItems, dupCriteria, dupDateTolerance, dupAmountTolerance).length
                        })
                      </button>

                      <Tooltip
                        title={
                          dupDeleteAll
                            ? "All matching items will be selected (nothing is kept)"
                            : "One original per group is kept — only extras are selected"
                        }
                      >
                        <button
                          onClick={() => setDupDeleteAll((v) => !v)}
                          className={`px-2.5 py-1 rounded-lg border transition-colors flex items-center gap-1 ${
                            dupDeleteAll
                              ? "text-red-300 border-red-400/80 bg-red-950/60 hover:bg-red-900/60 font-medium"
                              : "text-white/80 border-white/30 hover:bg-white/10"
                          }`}
                        >
                          <UniversalCategoIcon type={dupDeleteAll ? "md/MdSelectAll" : "md/MdFilterAlt"} siz={13} />
                          {dupDeleteAll ? "Delete all matches" : "Delete only duplicates"}
                        </button>
                      </Tooltip>

                      {selectionCount > 0 && (
                        <>
                          <button
                            onClick={() => setSelected(new Set())}
                            className="bg-slate-700 hover:bg-slate-600 text-white px-2 py-1 rounded-lg transition-colors border border-slate-500/50"
                          >
                            Clear selection
                          </button>
                          <button
                            onClick={() => setComparing(true)}
                            className="bg-purple-600/80 hover:bg-purple-500 text-white px-2 py-1 rounded-lg transition-colors border border-purple-400/50"
                          >
                            Compare in detail
                          </button>
                        </>
                      )}
                    </div>

                    {selectionCount > 0 && (
                      <button
                        onClick={handleDeleteSelected}
                        className="bg-red-600 hover:bg-red-500 text-white px-3 py-1 rounded-lg font-medium transition-colors shadow-2xs border border-red-400/50"
                      >
                        Delete {selectionCount} selected
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="footer-header w-full h-3 rounded-t-3xl bg-slate-100 mt-2" />
        </header>

        {/* Transaction list */}
        <div className="w-full h-full overflow-y-scroll bg-slate-100 mb-[10px]">
          <section className="w-full h-full bg-slate-100 flex flex-col items-center gap-1 p-1">
            {dupMode && displayItems.length === 0 && (
              <div className="w-full text-center py-4 text-slate-500 text-sm font-light">
                No duplicates found among these transactions.
              </div>
            )}
            {displayItems.map((transaction) => (
              <TransactionItemList
                movement={transaction}
                key={`top-modal-${transaction._id}`}
                handleEdit={handleEdit}
                handleDelete={handleDelete}
                selectable={isMulti}
                selected={selected.has(transaction._id)}
                onSelect={toggleSelect}
              />
            ))}
          </section>
        </div>

        {/* Close */}
        <button
          onClick={close}
          className="close-con absolute top-[0%] right-[0%] border-2 rounded-full bg-slate-50 text-purple-700 m-1 pulse-animation-short z-50"
        >
          <CategoIcon type="MdClose" siz={20} />
        </button>
      </div>

      {/* Single edit — portaled to escape z-index stacking context */}
      {editTrans && createPortal(
        <EditSingleTransModal
          key={`edit-single-${editTrans._id}-${editKey}`}
          trans={editTrans}
          onClose={() => setEditTrans(null)}
        />,
        document.body
      )}

      {/* General bulk edit */}
      {generalEditOpen && createPortal(
        <EditMultipleTransModal
          trans={selectedTransObjects}
          onClose={() => setGeneralEditOpen(false)}
        />,
        document.body
      )}

      {/* Quick field edit */}
      {quickEditField && createPortal(
        <QuickEditModal
          field={quickEditField}
          transIds={[...selected]}
          onClose={() => setQuickEditField(null)}
        />,
        document.body
      )}

      {/* Declarative confirmation modal — avoids Ant Design static Modal.confirm minified chunk issues in Vercel */}
      {confirmDelete && createPortal(
        <div className="fixed inset-0 z-[30000] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`bg-white rounded-2xl shadow-xl ${dupMode && confirmDelete.type === "many" ? "max-w-3xl" : "max-w-lg"} w-full p-6 flex flex-col gap-4 border border-slate-200`}>
            <div className="flex items-center gap-3 text-red-600">
              <CategoIcon type="MdWarning" siz={24} />
              <h3 className="font-bold text-lg text-slate-800">
                {confirmDelete.type === "many"
                  ? `Delete ${confirmDelete.ids.length} transaction${confirmDelete.ids.length !== 1 ? "s" : ""}?`
                  : "Delete transaction?"}
              </h3>
            </div>
            <p className="text-sm text-slate-600">
              This action cannot be undone. Are you sure you want to permanently delete{" "}
              <b>{confirmDelete.type === "many" ? `${confirmDelete.ids.length} transactions` : "this transaction"}</b>?
            </p>
            <div className="max-h-[360px] overflow-y-auto pr-1 flex flex-col gap-1 my-1">
              {confirmDelete.type === "single" ? (
                <DeletePreviewRow
                  transaction={
                    allTransactions.find((t) => t._id === confirmDelete.id) ||
                    localItems.find((t) => t._id === confirmDelete.id)
                  }
                />
              ) : dupMode ? (
                <DuplicateComparisonTable
                  pairs={getDuplicatePairs(localItems, confirmDelete.ids, dupCriteria, dupDateTolerance, dupAmountTolerance)}
                  selectedIds={selected}
                  onToggleSelect={(id) => {
                    setSelected((prev) => {
                      const next = new Set(prev);
                      if (next.has(id)) next.delete(id);
                      else next.add(id);
                      return next;
                    });
                  }}
                />
              ) : (
                confirmDelete.ids.map((id) => (
                  <DeletePreviewRow
                    key={id}
                    transaction={
                      allTransactions.find((t) => t._id === id) ||
                      localItems.find((t) => t._id === id)
                    }
                  />
                ))
              )}
            </div>
            <div className="flex justify-end gap-3 mt-2">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={() => {
                  const target = confirmDelete;
                  setConfirmDelete(null);
                  if (target.type === "single") {
                    executeDeleteSingle(target.id);
                  } else {
                    executeDeleteMany(target.ids);
                  }
                }}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-red-600 hover:bg-red-500 text-white shadow-md transition-colors"
              >
                {deleting ? "Deleting..." : "Confirm delete"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {comparing && createPortal(
        <Modal
          open
          zIndex={20000}
          width={750}
          onCancel={() => setComparing(false)}
          title={
            <div className="flex items-center gap-2 text-purple-700 font-semibold text-base">
              <UniversalCategoIcon type="md/MdOutlineCompare" siz={18} />
              Duplicate Comparison Detail
            </div>
          }
          footer={[
            <Button key="cancel" onClick={() => setComparing(false)}>
              Cancel
            </Button>,
            <Button
              key="delete"
              danger
              type="primary"
              loading={deleting}
              onClick={() => {
                setComparing(false);
                setConfirmDelete({ type: "many", ids: [...selected] });
              }}
              disabled={selected.size === 0}
            >
              Delete {selected.size} elements
            </Button>,
          ]}
        >
          <p className="text-xs text-slate-500 mb-3">
            Mode: <b>{dupDeleteAll ? "Delete all matches" : "Delete only duplicates (keep 1 original)"}</b>.
            Review what will be kept vs deleted before proceeding.
          </p>
          <div className="max-h-[60vh] overflow-y-auto pr-1">
            <DuplicateComparisonTable
              pairs={getDuplicatePairs(localItems, Array.from(selected), dupCriteria, dupDateTolerance, dupAmountTolerance)}
              selectedIds={selected}
              onToggleSelect={(id) => {
                setSelected((prev) => {
                  const next = new Set(prev);
                  if (next.has(id)) next.delete(id);
                  else next.add(id);
                  return next;
                });
              }}
            />
          </div>
        </Modal>,
        document.body
      )}
    </>
  );
}

export default ModalContentTopMonthItem;
