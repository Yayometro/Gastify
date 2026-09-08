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
import { isSpendingBudget } from "@/helpers/transformers/budgetTypes";

function MovementRow({ movement, onEdit, onDelete }) {
  return (
    <div className="flex items-center justify-between gap-3 gf-glass-row rounded-2xl px-3 py-2">
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-gf-text truncate">
          {movement.name || "Unnamed movement"}
        </p>
        <p className="text-[10px] text-gf-text-muted truncate">
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
          className="p-1 text-gf-text-muted hover:text-purple-600"
          title="Edit movement"
        >
          <CategoIcon type="MdOutlineCreate" siz={15} />
        </button>
        <button
          type="button"
          onClick={() => onDelete(movement._id)}
          className="p-1 text-gf-text-muted hover:text-red-400"
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
      className={`w-full text-left rounded-2xl transition-all ${
        hasSpending ? "gf-glass-warning" : "gf-glass-success"
      } ${compact ? "p-3" : "p-4"}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
              hasSpending ? "bg-amber-500/25 text-amber-400" : "bg-emerald-500/25 text-emerald-400"
            }`}
          >
            <UniversalCategoIcon
              type={hasSpending ? "md/MdOutlineWarningAmber" : "md/MdCheckCircleOutline"}
              siz={21}
            />
          </div>
          <div className="min-w-0">
            <p className={`font-bold ${hasSpending ? "text-amber-400" : "text-emerald-400"}`}>
              {hasSpending ? "Unbudgeted spending" : "All your spending is covered"}
            </p>
            <p className="text-[11px] text-gf-text-muted truncate">
              {hasSpending
                ? `${coverage.groups.length} ${coverage.groups.length === 1 ? "category" : "categories"} • ${coverage.uncovered.length} ${coverage.uncovered.length === 1 ? "movement" : "movements"} • ${percentage}% of spending`
                : "No movements outside your active budgets in this period."}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <p className={`font-bold ${hasSpending ? "text-amber-400" : "text-emerald-400"}`}>
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
  projectBudgets = [],
  uncoveredCatalogCategories = [],
  rangeLabel,
  onClose,
  onCreateBudget,
  onAddToBudget,
  onCreateProject,
  onAddToProject,
}) {
  const [expandedKey, setExpandedKey] = useState(null);
  const [selectedBudgets, setSelectedBudgets] = useState({});
  const [selectedProjects, setSelectedProjects] = useState({});
  const [showCatalog, setShowCatalog] = useState(false);
  const [editingMovement, setEditingMovement] = useState(null);
  const [deletingMovementId, setDeletingMovementId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const dispatch = useDispatch();
  const toFetch = fetcher();
  const spendingBudgets = (budgets || []).filter((budget) => !budget.archived && isSpendingBudget(budget));

  // Was Modal.confirm() - antd's imperative static API renders into a node
  // appended straight to document.body, outside this app's own component
  // tree and its dark ConfigProvider, so it always came out plain white/
  // light-themed regardless of the rest of the app, and its default
  // z-index (1000) lost to this modal's own backdrop (z-[5000]+), rendering
  // it invisible behind Unbudgeted Spending instead of on top of it. A
  // normal controlled <Modal> inherits the theme correctly and can be given
  // an explicit z-index high enough to win.
  const handleDelete = (movementId) => setDeletingMovementId(movementId);

  const confirmDeleteMovement = async () => {
    setIsDeleting(true);
    try {
      const res = await toFetch.post(`general-data/transactions/remove-transaction/${deletingMovementId}`);
      if (!res.ok) throw new Error(res.message || "Could not delete movement");
      dispatch(removeOneTransacction(deletingMovementId));
      runNotify("ok", "Movement deleted successfully!");
      setDeletingMovementId(null);
    } catch (error) {
      runNotify("error", String(error));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <BasicModal
        close={onClose}
        renderContent={
          <div className="content absolute gf-glass-violet flex flex-col w-[94vw] max-w-[680px] max-h-[90vh] overflow-hidden rounded-3xl z-[1001] shadow-2xl">
            <div className="relative px-6 pt-6 pb-5 text-white shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="absolute top-4 right-4 rounded-full gf-glass-card p-1.5 text-purple-100 hover:text-white transition-colors"
                title="Close"
              >
                <CategoIcon type="MdClose" siz={18} />
              </button>
              <p className="text-2xl font-bold">Unbudgeted spending</p>
              <p className="text-xs text-purple-100 mt-1">{rangeLabel}</p>
            </div>

            <div className="rounded-t-[38px] px-5 sm:px-7 py-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="gf-glass-warning rounded-2xl p-3">
                  <p className="text-[10px] uppercase tracking-wide text-amber-300">Outside budgets</p>
                  <p className="text-xl font-bold text-amber-300">
                    {usdFormatChanger(coverage.unbudgetedSpent)}
                  </p>
                </div>
                <div className="gf-glass-row rounded-2xl p-3">
                  <p className="text-[10px] uppercase tracking-wide gf-text-muted-glass">Share of spending</p>
                  <p className="text-xl font-bold text-purple-200">
                    {Math.round(coverage.unbudgetedPercentage)}%
                  </p>
                </div>
              </div>

              <p className="text-xs gf-text-muted-glass mb-4">
                These movements are not covered by any active spending budget. Open a category to review its movements or include it in your plan.
              </p>

              {coverage.groups.length === 0 ? (
                <div className="gf-glass-success rounded-2xl p-5 text-center text-emerald-300">
                  <p className="font-bold">Everything is covered 🎉</p>
                  <p className="text-xs mt-1">No unbudgeted movements were found in this period.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {coverage.groups.map((group) => {
                    const isExpanded = expandedKey === group.key;
                    const selectedBudgetId = selectedBudgets[group.key] || "";
                    const selectedProjectId = selectedProjects[group.key] || "";
                    return (
                      <div key={group.key} className="gf-glass-warning rounded-2xl overflow-hidden">
                        <button
                          type="button"
                          onClick={() => setExpandedKey(isExpanded ? null : group.key)}
                          className="w-full p-3 flex items-center justify-between gap-3 hover:bg-amber-500/15 text-left"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div
                              className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 border border-white shadow-sm"
                              style={{ backgroundColor: group.color }}
                            >
                              <UniversalCategoIcon type={group.icon} siz={17} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-gf-text truncate">{group.name}</p>
                              <p className="text-[10px] text-gf-text-muted">
                                {group.movements.length} {group.movements.length === 1 ? "movement" : "movements"}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <p className="text-sm font-bold text-amber-400">{usdFormatChanger(group.amount)}</p>
                            <UniversalCategoIcon
                              type={isExpanded ? "md/MdExpandLess" : "md/MdExpandMore"}
                              siz={20}
                            />
                          </div>
                        </button>

                        {isExpanded && (
                          <div className="border-t border-amber-100/30 p-3">
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

                            <div className="bg-gf-accent-soft-bg border border-gf-border rounded-2xl p-3 mb-3">
                              <p className="text-xs font-bold text-purple-300 mb-1">Treat these expenses as part of a project</p>
                              <p className="text-[10px] text-gf-text-muted mb-2">Projects group specific movements, independently of their categories or purchase dates.</p>
                              <div className="flex flex-col sm:flex-row gap-2">
                                <button type="button" onClick={() => onCreateProject(group)} className="rounded-full gf-glass-button text-white text-xs font-bold px-4 py-2 shrink-0">Create project</button>
                                {projectBudgets.length > 0 && <div className="flex flex-1 gap-2 min-w-0">
                                  <select value={selectedProjectId} onChange={(event) => setSelectedProjects((current) => ({ ...current, [group.key]: event.target.value }))} className="min-w-0 flex-1 rounded-full border border-purple-200 bg-gf-surface px-3 text-xs"><option value="">Add to project…</option>{projectBudgets.map((project) => <option key={project._id} value={project._id}>{project.name}</option>)}</select>
                                  <button type="button" disabled={!selectedProjectId} onClick={() => { const selected = projectBudgets.find((project) => String(project._id) === String(selectedProjectId)); if (selected) onAddToProject(group, selected); }} className="rounded-full border border-purple-300 text-purple-300 text-xs font-bold px-3 py-2 disabled:opacity-40">Add</button>
                                </div>}
                              </div>
                            </div>

                            {group.type === "uncategorized" ? (
                              <div className="bg-amber-500/15 text-amber-400 rounded-xl p-3 text-xs">
                                Review these movements and assign a category before creating a budget.
                              </div>
                            ) : (
                              <div className="flex flex-col sm:flex-row gap-2">
                                <button
                                  type="button"
                                  onClick={() => onCreateBudget(group)}
                                  className="rounded-full gf-glass-button text-white text-xs font-bold px-4 py-2 shrink-0"
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
                                      className="min-w-0 flex-1 rounded-full border border-purple-200 bg-gf-surface px-3 text-xs"
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
                                        className="rounded-full border border-purple-300 text-purple-300 text-xs font-bold px-3 py-2 disabled:opacity-40"
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
                <div className="mt-5 pt-4 border-t border-gf-border">
                  <button
                    type="button"
                    onClick={() => setShowCatalog((current) => !current)}
                    className="w-full flex items-center justify-between text-xs font-bold text-purple-300"
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
                          className="bg-gf-surface border border-gf-border hover:border-purple-300 text-gf-text-muted rounded-full px-3 py-1.5 text-xs"
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
      <Modal
        className="gf-antd-modal-glass"
        open={!!deletingMovementId}
        zIndex={20000}
        onOk={confirmDeleteMovement}
        onCancel={() => setDeletingMovementId(null)}
        confirmLoading={isDeleting}
        okText="Yes, delete"
        cancelText="Cancel"
        okButtonProps={{ className: "gf-glass-button-danger !border-0 !text-white" }}
        cancelButtonProps={{ className: "gf-glass-button-neutral !border-0 !text-gf-text" }}
        title={<span className="text-red-400 font-semibold flex items-center gap-1">⚠️ Delete this movement?</span>}
      >
        <p className="text-gf-text-muted text-sm">This removes the transaction permanently.</p>
      </Modal>
    </>
  );
}
