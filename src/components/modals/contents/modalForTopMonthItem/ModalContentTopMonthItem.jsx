"use client";

import { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { Tooltip } from "antd";
import { useDispatch, useSelector } from "react-redux";
import CategoIcon from "@/components/multiUsedComp/CategoIcon";
import UniversalCategoIcon from "@/components/multiUsedComp/UniversalCategoIcon";
import TransactionItemList from "@/components/Transactions/ItemList/TransactionItemList";
import { usdFormatChanger } from "@/helpers/transformers/transactionsChange";
import EditSingleTransModal from "@/components/multiUsedComp/EditSingleTransModal";
import EditMultipleTransModal from "@/components/multiUsedComp/EditMultipleTransModal";
import QuickEditModal from "@/components/multiUsedComp/QuickEditModal";
import fetcher from "@/helpers/fetcher";
import runNotify from "@/helpers/gastifyNotifier";
import DeletePreviewRow from "@/components/multiUsedComp/DeletePreviewRow";
import {
  removeOneTransacction,
  removeManyTransactions,
} from "@/lib/features/transacctionsSlice";

const QUICK_ACTIONS = [
  { key: "name",     label: "Rename",   icon: "MdDriveFileRenameOutline" },
  { key: "date",     label: "Date",     icon: "MdCalendarMonth" },
  { key: "type",     label: "Type",     icon: "MdSwapVert" },
  { key: "category", label: "Category", icon: "MdCategory" },
  { key: "account",  label: "Account",  icon: "MdAccountBalance" },
];

function ModalContentTopMonthItem({ item, close }) {
  const dispatch = useDispatch();
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

  const toggleSelect = (id) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const toggleAll = () =>
    setSelected(
      selected.size === localItems.length
        ? new Set()
        : new Set(localItems.map((t) => t._id))
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
    }
  };

  const executeDeleteMany = async (ids) => {
    try {
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
            <b>{usdFormatChanger(item?.value || item?.amount) || "No total info..."}</b>
          </p>

          {/* Selection controls — only when multiple items */}
          {isMulti && (
            <div className="w-full px-3 pb-1 mt-1 flex flex-col gap-1">
              {/* Row 1: select-all, count, delete */}
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleAll}
                  className="flex items-center gap-1 text-xs text-white/80 hover:text-white border border-white/30 rounded-lg px-2 py-0.5"
                >
                  <CategoIcon
                    type={allSelected ? "MdCheckBox" : "MdCheckBoxOutlineBlank"}
                    siz={14}
                  />
                  {allSelected ? "Deselect all" : "Select all"}
                </button>
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
            </div>
          )}

          <div className="footer-header w-full h-3 rounded-t-3xl bg-slate-100 mt-2" />
        </header>

        {/* Transaction list */}
        <div className="w-full h-full overflow-y-scroll bg-slate-100 mb-[10px]">
          <section className="w-full h-full bg-slate-100 flex flex-col items-center gap-1 p-1">
            {localItems.map((transaction) => (
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
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 flex flex-col gap-4 border border-slate-200">
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
            <div className="max-h-[260px] overflow-y-auto pr-1 flex flex-col gap-1 my-1">
              {confirmDelete.type === "single" ? (
                <DeletePreviewRow
                  transaction={
                    allTransactions.find((t) => t._id === confirmDelete.id) ||
                    localItems.find((t) => t._id === confirmDelete.id)
                  }
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
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
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
                Confirm delete
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

export default ModalContentTopMonthItem;
