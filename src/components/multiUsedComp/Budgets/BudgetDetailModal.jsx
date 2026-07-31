"use client";
import React, { useMemo, useState } from "react";
import BasicModal from "@/components/modals/basicModal/BasicModal";
import UniversalCategoIcon from "@/components/multiUsedComp/UniversalCategoIcon";
import { usdFormatChanger } from "@/helpers/transformers/transactionsChange";
import { matchBillToBudget, getBudgetPeriodRange } from "@/helpers/transformers/projectionsChange";
import { getBudgetBarGradient, getBudgetMoodEmoji, getBudgetBarColor } from "@/helpers/transformers/budgetHistory";
import EmptyModule from "@/components/multiUsedComp/EmptyModule";
import { Tooltip, Modal } from "antd";
import { useDispatch } from "react-redux";
import { removeOneTransacction } from "@/lib/features/transacctionsSlice";
import fetcher from "@/helpers/fetcher";
import runNotify from "@/helpers/gastifyNotifier";
import EditSingleTransModal from "@/components/multiUsedComp/EditSingleTransModal";
import Tag from "@/components/multiUsedComp/Tag";
import CategoIcon from "@/components/multiUsedComp/CategoIcon";
import dayjs from "dayjs";
import currencyFormatter from "currency-formatter";

function BudgetDetailModal({
  budget,
  transacciones = [],
  startDate,
  endDate,
  onClose,
  onEdit,
}) {
  const dispatch = useDispatch();
  const [editingTrans, setEditingTrans] = useState(null);
  const [editKey, setEditKey] = useState(0);

  const { matchingTransactions, totalSpent, categoryBreakdown } = useMemo(() => {
    if (!budget) return { matchingTransactions: [], totalSpent: 0, categoryBreakdown: [] };

    let effectiveStart = startDate;
    let effectiveEnd = endDate;
    if (budget.period && budget.period !== "monthly") {
      const refDate = startDate || new Date();
      const range = getBudgetPeriodRange(budget, refDate, startDate, endDate);
      effectiveStart = range.start;
      effectiveEnd = range.end;
    }

    const startMs = effectiveStart ? new Date(effectiveStart).getTime() : 0;
    const endMs = effectiveEnd
      ? new Date(effectiveEnd).setHours(23, 59, 59, 999)
      : Infinity;

    const matched = [];
    let spent = 0;
    const catMap = {};

    for (const t of transacciones) {
      const tMs = new Date(t.date).getTime();
      if (tMs >= startMs && tMs <= endMs) {
        if (matchBillToBudget(t, budget)) {
          matched.push(t);
          const amount = Number(t.amount) || 0;
          spent += amount;

          const catName = t.subCategory?.name || t.category?.name || "Other";
          const catColor = t.subCategory?.color || t.category?.color || "#DADADA";
          const catIcon = t.subCategory?.icon || t.category?.icon || "md/MdFilterNone";

          if (!catMap[catName]) {
            catMap[catName] = { name: catName, color: catColor, icon: catIcon, amount: 0 };
          }
          catMap[catName].amount += amount;
        }
      }
    }

    matched.sort((a, b) => new Date(b.date) - new Date(a.date));

    const breakdown = Object.values(catMap).sort((a, b) => b.amount - a.amount);

    return {
      matchingTransactions: matched,
      totalSpent: spent,
      categoryBreakdown: breakdown,
    };
  }, [budget, transacciones, startDate, endDate]);

  if (!budget) return null;

  const goalAmount = Number(budget.goalAmount) || 0;
  const isSaving = budget.isSaving === true;

  let effectiveAmount = totalSpent;
  if (isSaving) {
    if (budget.linkedAccounts && budget.linkedAccounts.length > 0) {
      effectiveAmount = budget.linkedAccounts.reduce(
        (acc, a) => acc + (Number(a.amount) || 0),
        0
      );
    } else {
      effectiveAmount = Math.max(Number(budget.savingAmount) || 0, totalSpent);
    }
  }

  const ratio = goalAmount > 0 ? effectiveAmount / goalAmount : 0;
  const widthPct = Math.min(Math.max(ratio * 100, 0), 100);
  const pctNum = Math.round(ratio * 100);
  const isExceeded = effectiveAmount > goalAmount;
  const gradient = getBudgetBarGradient(ratio, isSaving);
  const barColor = getBudgetBarColor(ratio, isSaving);
  const moodEmoji = getBudgetMoodEmoji(ratio, isSaving);

  let remainingText = "";
  if (isSaving) {
    const toGo = goalAmount - effectiveAmount;
    remainingText =
      toGo <= 0
        ? "Goal reached 🎉"
        : `${usdFormatChanger(toGo)} to go`;
  } else {
    const remain = goalAmount - effectiveAmount;
    remainingText =
      remain >= 0
        ? `${usdFormatChanger(remain)} remaining`
        : `Exceeded limit by ${usdFormatChanger(Math.abs(remain))}`;
  }

  const periodLabel = budget.period
    ? ` / ${budget.period === "yearly" ? "year" : budget.period === "quarterly" ? "quarter" : budget.period === "biannual" ? "6m" : "month"}`
    : " / month";

  const getEmojiTooltipMessage = (r, saving) => {
    const safeRatio = Number.isFinite(r) ? r : 0;
    if (saving) {
      if (safeRatio >= 0.85) return "🤩 Amazing! You are at or very close to your savings goal!";
      if (safeRatio >= 0.35) return "🙂 Good progress! Keep saving toward your goal.";
      return "😟 Just starting. Keep pushing toward your savings goal!";
    }
    if (safeRatio > 1) return "🔥 Watch out! You have exceeded the limit for this budget.";
    if (safeRatio >= 0.85) return "😰 Cuidado, estás muy cerca de tu límite.";
    if (safeRatio >= 0.6) return "😐 Halfway there. Keep an eye on your remaining limit.";
    if (safeRatio >= 0.3) return "🙂 Doing well! Spendings are moderate.";
    return "🤩 Excellent! Very little spent so far.";
  };

  const emojiTooltip = getEmojiTooltipMessage(ratio, isSaving);

  const handleRemoveTrans = (id) => {
    Modal.confirm({
      title: "Delete this movement?",
      content: "Are you sure you want to remove this transaction?",
      okText: "Yes, delete",
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          dispatch(removeOneTransacction(id));
          const res = await fetcher.post(
            `general-data/transactions/remove-transaction/${id}`
          );
          if (res.ok) {
            runNotify("ok", "Movement deleted successfully!");
          } else {
            runNotify("error", "Error removing transaction.");
          }
        } catch (e) {
          runNotify("error", String(e));
        }
      },
    });
  };

  return (
    <>
      <BasicModal
        close={onClose}
        renderContent={
          <div className="content absolute bg-purple-600 border-2 border-purple-600 flex flex-col w-[94vw] max-w-[640px] max-h-[90vh] overflow-y-auto rounded-3xl pt-8 pb-6 px-4 z-[1001]">
            <div className="w-full bg-slate-50 rounded-2xl p-6 relative flex flex-col gap-5 shadow-lg">
              <button
                type="button"
                onClick={onClose}
                className="absolute top-4 right-4 text-purple-700 hover:bg-purple-100 rounded-full p-1.5 transition-colors cursor-pointer"
              >
                <UniversalCategoIcon type="md/MdClose" siz={22} />
              </button>

              {/* Header section */}
              <div className="flex items-start justify-between gap-3 pr-8">
                <div>
                  <h2 className="text-2xl font-bold text-purple-800">
                    {budget.name || "Unnamed Budget"}
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {isSaving ? "Savings goal" : "Spending budget"} ({budget.period || "monthly"})
                  </p>
                </div>
                <Tooltip title={emojiTooltip} placement="left">
                  <span className="text-4xl leading-none cursor-help inline-block hover:scale-110 transition-transform">
                    {moodEmoji}
                  </span>
                </Tooltip>
              </div>

              {/* Progress Bar Summary with Circle Percentage Badge at Head */}
              <div className="bg-white rounded-2xl p-4 border border-purple-100 shadow-sm">
                <div className="flex justify-between items-baseline mb-2">
                  <span className="text-sm font-semibold text-gray-700">
                    {isSaving ? "Saved:" : "Spent:"}{" "}
                    <span className="text-purple-700 font-bold">
                      {usdFormatChanger(effectiveAmount)}
                    </span>
                  </span>
                  <span className="text-xs text-gray-500 font-medium">
                    {isSaving ? "Goal: " : "Limit: "}
                    {usdFormatChanger(goalAmount)}
                    {periodLabel}
                  </span>
                </div>
                <div className="w-full h-5 bg-gray-200 rounded-full relative my-3">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${Math.min(Math.max(ratio * 100, 0), 100)}%`, background: gradient }}
                  />
                  <div
                    style={{
                      left: `calc(${Math.min(Math.max(ratio * 100, 0), 100)}% - ${Math.min(Math.max(ratio * 100, 0), 100) * 0.40}px)`,
                      borderColor: barColor,
                    }}
                    className={`absolute top-1/2 -translate-y-1/2 w-10 h-10 min-w-[40px] min-h-[40px] rounded-full flex items-center justify-center text-[12px] font-extrabold shadow-md z-10 border-[3px] ${
                      isExceeded
                        ? "bg-red-50 text-red-700"
                        : "bg-white text-slate-800"
                    }`}
                    title={isExceeded ? `Exceeded limit/goal! (${pctNum}%)` : `${pctNum}% of goal/limit`}
                  >
                    <span>{pctNum}%</span>
                  </div>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-purple-800">
                    {pctNum}% of {isSaving ? "goal" : "limit"}
                  </span>
                  <span className="font-bold text-gray-600">{remainingText}</span>
                </div>
              </div>

              {/* Spending by Category (Horizontal Stacked Bar Chart) */}
              {categoryBreakdown.length > 0 && (
                <div className="bg-white rounded-2xl p-4 border border-purple-100 shadow-sm">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                    Spending Distribution by Category
                  </h3>
                  {/* Stacked bar */}
                  <div className="w-full h-3.5 bg-gray-100 rounded-full overflow-hidden flex mb-3">
                    {categoryBreakdown.map((cat, idx) => {
                      const catPct = totalSpent > 0 ? (cat.amount / totalSpent) * 100 : 0;
                      return (
                        <div
                          key={idx}
                          style={{
                            width: `${catPct}%`,
                            backgroundColor: cat.color || "#DADADA",
                          }}
                          title={`${cat.name}: ${usdFormatChanger(cat.amount)} (${Math.round(catPct)}%)`}
                          className="h-full transition-all hover:opacity-80"
                        />
                      );
                    })}
                  </div>
                  {/* Legend list */}
                  <div className="grid grid-cols-2 gap-2 max-h-[110px] overflow-y-auto pr-1">
                    {categoryBreakdown.map((cat, idx) => {
                      const catPct = totalSpent > 0 ? Math.round((cat.amount / totalSpent) * 100) : 0;
                      return (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-xs bg-gray-50 rounded-xl px-2.5 py-1.5"
                        >
                          <div className="flex items-center gap-1.5 truncate pr-2">
                            <span
                              style={{ backgroundColor: cat.color }}
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                            />
                            <span className="text-gray-700 font-medium truncate">
                              {cat.name}
                            </span>
                          </div>
                          <span className="font-bold text-purple-700 shrink-0">
                            {catPct}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Detailed Movements List (Movements.jsx transaction component style) */}
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Detailed Movements ({matchingTransactions.length})
                </h3>

                {/* Linked accounts banner for savings */}
                {isSaving && budget.linkedAccounts && budget.linkedAccounts.length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3 mb-3 flex items-center justify-between text-xs text-blue-900">
                    <div className="flex items-center gap-2">
                      <span className="text-base">🔗</span>
                      <span>
                        Linked to {budget.linkedAccounts.length} account{budget.linkedAccounts.length !== 1 ? "s" : ""}:{" "}
                        <strong>{budget.linkedAccounts.map(a => `${a.name || "Account"} (${usdFormatChanger(a.amount || 0)})`).join(", ")}</strong>
                      </span>
                    </div>
                    <span className="font-bold text-blue-700">{usdFormatChanger(effectiveAmount)}</span>
                  </div>
                )}

                {/* Manual saving progress banner for savings */}
                {isSaving && (!budget.linkedAccounts || budget.linkedAccounts.length === 0) && (Number(budget.savingAmount) || 0) > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3 mb-3 flex items-center justify-between text-xs text-blue-900">
                    <div className="flex items-center gap-2">
                      <span className="text-base">📌</span>
                      <span>
                        Manual saving progress set:
                      </span>
                    </div>
                    <span className="font-bold text-blue-700">{usdFormatChanger(budget.savingAmount)}</span>
                  </div>
                )}

                {matchingTransactions.length > 0 ? (
                  <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1">
                    {matchingTransactions.map((movement) => (
                      <div
                        key={movement._id}
                        id={`trans-${movement._id}`}
                        className="flex flex-row justify-between items-center bg-white rounded-2xl py-2 px-3 border border-gray-100 hover:bg-slate-100 relative shadow-xs transition-colors"
                      >
                        <div className="flex gap-3 items-center truncate pr-2">
                          <div className="tra-cat-cont shrink-0">
                            <div
                              style={{ backgroundColor: movement.category?.color || "#DADADA" }}
                              className="w-[44px] h-[44px] rounded-full flex items-center justify-center text-white border border-white shadow-sm"
                            >
                              {!movement.category || !movement.category.icon ? (
                                <UniversalCategoIcon type="md/MdFilterNone" siz={16} />
                              ) : (
                                <UniversalCategoIcon type={movement.category.icon} siz={16} />
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col truncate">
                            <div className="font-medium text-xs text-gray-800 truncate">
                              {!movement.name ? (
                                <span className="italic text-gray-400">No name. Asign one...</span>
                              ) : (
                                <span>{movement.name}</span>
                              )}
                            </div>
                            <div className="text-[10px] text-gray-500 flex items-center gap-2 flex-wrap mt-0.5">
                              <span>
                                <strong className="text-gray-400 font-light">Cat: </strong>
                                {movement.category?.name || "—"}
                              </span>
                              {movement.subCategory?.name && (
                                <span>
                                  <strong className="text-gray-400 font-light">Sub: </strong>
                                  {movement.subCategory.name}
                                </span>
                              )}
                              <span>
                                <strong className="text-gray-400 font-light">Acc: </strong>
                                {movement.account?.name || "—"}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-1 items-center justify-start text-[10px] text-gray-400 mt-1">
                              <span className="font-light">Tags:</span>
                              {!movement.tags || movement.tags.length === 0 ? (
                                <span>No tags...</span>
                              ) : (
                                movement.tags.map((tag) => (
                                  <Tag tag={tag} key={tag._id} size={8} />
                                ))
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col items-end shrink-0 pl-2">
                          <div className="flex flex-col items-end">
                            {movement.isBill ? (
                              <div className="text-red-500 flex gap-1 items-center font-bold text-xs">
                                <CategoIcon type="MdKeyboardDoubleArrowDown" />
                                <span>
                                  {currencyFormatter.format(movement.amount, { locale: "en-US" })}
                                </span>
                              </div>
                            ) : (
                              <div className="text-green-500 flex gap-1 items-center font-bold text-xs">
                                <CategoIcon type="MdKeyboardDoubleArrowUp" />
                                <span>
                                  {currencyFormatter.format(movement.amount, { locale: "en-US" })}
                                </span>
                              </div>
                            )}
                            <div className="text-[10px] text-gray-400 font-light mt-0.5">
                              {dayjs(movement.date || movement.createdAt).format("DD/MM/YYYY")}
                            </div>
                          </div>
                          <div className="btns flex justify-end gap-2 mt-1.5">
                            <button
                              type="button"
                              onClick={() => handleRemoveTrans(movement._id)}
                              className="text-gray-400 hover:text-red-600 transition-colors p-1 cursor-pointer"
                              title="Delete transaction"
                            >
                              <CategoIcon type="MdDelete" size={15} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingTrans(movement)}
                              className="text-gray-400 hover:text-purple-600 transition-colors p-1 cursor-pointer"
                              title="Edit transaction"
                            >
                              <CategoIcon type="MdOutlineCreate" size={15} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-4">
                    <EmptyModule emMessage="No movements found for this budget in the selected time period 🤓" />
                  </div>
                )}
              </div>

              {/* Action Bar: Edit Budget Button */}
              <div className="pt-2 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onEdit) onEdit(budget);
                  }}
                  className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer text-sm"
                >
                  <UniversalCategoIcon type="md/MdEdit" siz={18} />
                  <span>Edit Budget ✏️</span>
                </button>
              </div>
            </div>
          </div>
        }
      />
      {editingTrans && (
        <EditSingleTransModal
          key={editKey}
          trans={editingTrans}
          onClose={() => {
            setEditingTrans(null);
            setEditKey((k) => k + 1);
          }}
        />
      )}
    </>
  );
}

export default BudgetDetailModal;
