"use client";

import React, { useState } from "react";
import { Modal, Tooltip } from "antd";
import dayjs from "dayjs";
import { useDispatch } from "react-redux";
import BasicModal from "@/components/modals/basicModal/BasicModal";
import CategoIcon from "@/components/multiUsedComp/CategoIcon";
import UniversalCategoIcon from "@/components/multiUsedComp/UniversalCategoIcon";
import EditSingleTransModal from "@/components/multiUsedComp/EditSingleTransModal";
import { usdFormatChanger } from "@/helpers/transformers/transactionsChange";
import { removeOneTransacction } from "@/lib/features/transacctionsSlice";
import fetcher from "@/helpers/fetcher";
import runNotify from "@/helpers/gastifyNotifier";

function MovementRow({ movement, onEdit, onDelete }) {
  return (
    <div className="flex items-center justify-between gap-3 bg-white border border-gray-100 rounded-2xl px-3 py-2 shadow-xs">
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-gray-800 truncate">
          {movement.name || "Unnamed movement"}
        </p>
        <p className="text-[10px] text-gray-400 truncate">
          {dayjs(movement.date || movement.createdAt).format("DD MMM YYYY")}
          {movement.account?.name ? ` • ${movement.account.name}` : ""}
        </p>
      </div>
      <p className="text-xs font-bold text-red-500 shrink-0">
        {usdFormatChanger(movement.amount || 0)}
      </p>
      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={() => onEdit(movement)}
          className="p-1 text-gray-400 hover:text-purple-600"
          title="Edit movement"
        >
          <CategoIcon type="MdOutlineCreate" siz={15} />
        </button>
        <button
          type="button"
          onClick={() => onDelete(movement._id)}
          className="p-1 text-gray-400 hover:text-red-600"
          title="Delete movement"
        >
          <CategoIcon type="MdDelete" siz={15} />
        </button>
      </div>
    </div>
  );
}

export function UnbudgetedSpendingCard({ coverage, onClick, compact = false }) {
  const hasSpending = coverage.unbudgetedSpent > 0;
  const percentage = Math.round(coverage.unbudgetedPercentage);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left rounded-2xl border transition-all hover:shadow-md ${
        hasSpending
          ? "bg-amber-50 border-amber-300 hover:border-amber-400"
          : "bg-emerald-50 border-emerald-200 hover:border-emerald-300"
      } ${compact ? "p-3" : "p-4"}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
              hasSpending ? "bg-amber-200 text-amber-800" : "bg-emerald-200 text-emerald-800"
            }`}
          >
            <UniversalCategoIcon
              type={hasSpending ? "md/MdOutlineWarningAmber" : "md/MdCheckCircleOutline"}
              siz={21}
            />
          </div>
          <div className="min-w-0">
            <p className={`font-bold ${hasSpending ? "text-amber-900" : "text-emerald-900"}`}>
              {hasSpending ? "Unbudgeted spending" : "All your spending is covered"}
            </p>
            <p className="text-[11px] text-gray-500 truncate">
              {hasSpending
                ? `${coverage.groups.length} ${coverage.groups.length === 1 ? "category" : "categories"} • ${coverage.uncovered.length} ${coverage.uncovered.length === 1 ? "movement" : "movements"} • ${percentage}% of spending`
                : "No movements outside your active budgets in this period."}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <p className={`font-bold ${hasSpending ? "text-amber-800" : "text-emerald-700"}`}>
            {usdFormatChanger(coverage.unbudgetedSpent)}
          </p>
          <UniversalCategoIcon type="md/MdChevronRight" siz={22} />
        </div>
      </div>
    </button>
  );
}

export function UnbudgetedSpendingModal({
  coverage,
  budgets,
  uncoveredCatalogCategories = [],
  rangeLabel,
  onClose,
  onCreateBudget,
  onAddToBudget,
}) {
  const [expandedKey, setExpandedKey] = useState(null);
  const [selectedBudgets, setSelectedBudgets] = useState({});
  const [showCatalog, setShowCatalog] = useState(false);
  const [editingMovement, setEditingMovement] = useState(null);
  const dispatch = useDispatch();
  const toFetch = fetcher();
  const spendingBudgets = (budgets || []).filter((budget) => !budget.archived && budget.isSaving !== true);

  const handleDelete = (movementId) => {
    Modal.confirm({
      title: "Delete this movement?",
      content: "This removes the transaction permanently.",
      okText: "Yes, delete",
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          const res = await toFetch.post(`general-data/transactions/remove-transaction/${movementId}`);
          if (!res.ok) throw new Error(res.message || "Could not delete movement");
          dispatch(removeOneTransacction(movementId));
          runNotify("ok", "Movement deleted successfully!");
        } catch (error) {
          runNotify("error", String(error));
        }
      },
    });
  };

  return (
    <>
      <BasicModal
        close={onClose}
        renderContent={
          <div className="content absolute bg-purple-600 border-2 border-purple-600 flex flex-col w-[94vw] max-w-[680px] max-h-[90vh] overflow-hidden rounded-3xl z-[1001] shadow-2xl">
            <div className="relative px-6 pt-6 pb-5 text-white shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="absolute top-4 right-4 bg-white text-purple-700 rounded-full p-1.5 hover:bg-purple-50"
                title="Close"
              >
                <CategoIcon type="MdClose" siz={18} />
              </button>
              <p className="text-2xl font-bold">Unbudgeted spending</p>
              <p className="text-xs text-purple-100 mt-1">{rangeLabel}</p>
            </div>

            <div className="bg-slate-50 rounded-t-[38px] px-5 sm:px-7 py-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="bg-amber-100 border border-amber-200 rounded-2xl p-3">
                  <p className="text-[10px] uppercase tracking-wide text-amber-700">Outside budgets</p>
                  <p className="text-xl font-bold text-amber-900">
                    {usdFormatChanger(coverage.unbudgetedSpent)}
                  </p>
                </div>
                <div className="bg-white border border-purple-100 rounded-2xl p-3">
                  <p className="text-[10px] uppercase tracking-wide text-gray-400">Share of spending</p>
                  <p className="text-xl font-bold text-purple-800">
                    {Math.round(coverage.unbudgetedPercentage)}%
                  </p>
                </div>
              </div>

              <p className="text-xs text-gray-500 mb-4">
                These movements are not covered by any active spending budget. Open a category to review its movements or include it in your plan.
              </p>

              {coverage.groups.length === 0 ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-center text-emerald-800">
                  <p className="font-bold">Everything is covered 🎉</p>
                  <p className="text-xs mt-1">No unbudgeted movements were found in this period.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {coverage.groups.map((group) => {
                    const isExpanded = expandedKey === group.key;
                    const selectedBudgetId = selectedBudgets[group.key] || "";
                    return (
                      <div key={group.key} className="bg-white border border-amber-200 rounded-2xl overflow-hidden">
                        <button
                          type="button"
                          onClick={() => setExpandedKey(isExpanded ? null : group.key)}
                          className="w-full p-3 flex items-center justify-between gap-3 hover:bg-amber-50 text-left"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div
                              className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 border border-white shadow-sm"
                              style={{ backgroundColor: group.color }}
                            >
                              <UniversalCategoIcon type={group.icon} siz={17} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-gray-800 truncate">{group.name}</p>
                              <p className="text-[10px] text-gray-400">
                                {group.movements.length} {group.movements.length === 1 ? "movement" : "movements"}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <p className="text-sm font-bold text-amber-800">{usdFormatChanger(group.amount)}</p>
                            <UniversalCategoIcon
                              type={isExpanded ? "md/MdExpandLess" : "md/MdExpandMore"}
                              siz={20}
                            />
                          </div>
                        </button>

                        {isExpanded && (
                          <div className="border-t border-amber-100 bg-slate-50 p-3">
                            <div className="flex flex-col gap-2 mb-3">
                              {group.movements.map((movement) => (
                                <MovementRow
                                  key={movement._id}
                                  movement={movement}
                                  onEdit={setEditingMovement}
                                  onDelete={handleDelete}
                                />
                              ))}
                            </div>

                            {group.type === "uncategorized" ? (
                              <div className="bg-amber-100 text-amber-900 rounded-xl p-3 text-xs">
                                Review these movements and assign a category before creating a budget.
                              </div>
                            ) : (
                              <div className="flex flex-col sm:flex-row gap-2">
                                <button
                                  type="button"
                                  onClick={() => onCreateBudget(group)}
                                  className="rounded-full bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold px-4 py-2 shrink-0"
                                >
                                  Create new budget
                                </button>
                                {spendingBudgets.length > 0 && (
                                  <div className="flex flex-1 gap-2 min-w-0">
                                    <select
                                      value={selectedBudgetId}
                                      onChange={(event) =>
                                        setSelectedBudgets((current) => ({
                                          ...current,
                                          [group.key]: event.target.value,
                                        }))
                                      }
                                      className="min-w-0 flex-1 rounded-full border border-purple-200 bg-white px-3 text-xs"
                                      aria-label={`Add ${group.name} to an existing budget`}
                                    >
                                      <option value="">Add to existing…</option>
                                      {spendingBudgets.map((budget) => (
                                        <option key={budget._id} value={budget._id}>{budget.name}</option>
                                      ))}
                                    </select>
                                    <Tooltip title={selectedBudgetId ? "Review the budget before saving" : "Choose a budget first"}>
                                      <button
                                        type="button"
                                        disabled={!selectedBudgetId}
                                        onClick={() => {
                                          const selected = spendingBudgets.find(
                                            (budget) => String(budget._id) === String(selectedBudgetId)
                                          );
                                          if (selected) onAddToBudget(group, selected);
                                        }}
                                        className="rounded-full border border-purple-300 text-purple-700 text-xs font-bold px-3 py-2 disabled:opacity-40"
                                      >
                                        Add
                                      </button>
                                    </Tooltip>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {uncoveredCatalogCategories.length > 0 && (
                <div className="mt-5 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowCatalog((current) => !current)}
                    className="w-full flex items-center justify-between text-xs font-bold text-purple-700"
                  >
                    <span>Other categories without a budget ({uncoveredCatalogCategories.length})</span>
                    <UniversalCategoIcon type={showCatalog ? "md/MdExpandLess" : "md/MdExpandMore"} siz={18} />
                  </button>
                  {showCatalog && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {uncoveredCatalogCategories.map((category) => (
                        <button
                          type="button"
                          key={category._id}
                          onClick={() =>
                            onCreateBudget({
                              key: `category:${category._id}`,
                              name: category.name,
                              category,
                              subCategory: null,
                              color: category.color,
                              icon: category.icon,
                              type: "category",
                              amount: 0,
                              movements: [],
                            })
                          }
                          className="bg-white border border-purple-100 hover:border-purple-300 text-gray-600 rounded-full px-3 py-1.5 text-xs"
                        >
                          {category.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        }
      />
      {editingMovement && (
        <EditSingleTransModal trans={editingMovement} onClose={() => setEditingMovement(null)} />
      )}
    </>
  );
}
