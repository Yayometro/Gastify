"use client";

import React, { useMemo, useState } from "react";
import { Skeleton, Tooltip } from "antd";
import { useDispatch } from "react-redux";
import useGetDataFromProvider from "@/hooks/getAllInfo/useGetInfoFromProvider";
import { getBudgetActualSpend } from "@/helpers/transformers/projectionsChange";
import {
  getBudgetCoverage,
  getUncoveredCatalogCategories,
  type CoverageGroup,
} from "@/helpers/transformers/budgetCoverage";
import { usdFormatChanger } from "@/helpers/transformers/transactionsChange";
import { getLastDayOfMonth } from "@/helpers/timeFunctions/timeFunctions";
import CategoIcon from "../CategoIcon";
import UniversalCategoIcon from "../UniversalCategoIcon";
import EmptyModule from "../EmptyModule";
import TimeRange from "@/components/Filters/timeRange/TimeRange";
import BudgetBarRow, { type BudgetBarRowBudgetItem } from "./BudgetBarRow";
import BudgetEditModal, {
  type BudgetModalItem,
  type BudgetEditModalMode,
  type FormCategoryEntry,
  type BudgetTransactionRef,
} from "./BudgetEditModal";
import BudgetDetailModal, {
  type BudgetDetailItem,
  type BudgetDetailTransactionItem,
} from "./BudgetDetailModal";
import ProjectBudgetDetailModal, {
  type ProjectBudgetItem,
  type ProjectBudgetTransactionItem,
} from "./ProjectBudgetDetailModal";
import {
  UnbudgetedSpendingCard,
  UnbudgetedSpendingModal,
} from "./UnbudgetedSpending";
import SpendingSummaryDetailModal, {
  type SpendingBudgetSummaryItem,
  type SpendingSummaryCoverage,
  type SpendingTotals,
} from "./SpendingSummaryDetailModal";
import BasicModal from "@/components/modals/basicModal/BasicModal";
import { getExplicitBudgetId, isProjectBudget, isSavingBudget, isSpendingBudget, BUDGET_TYPES } from "@/helpers/transformers/budgetTypes";
import PrimaryCurrencySelector, { type PrimaryCurrencySelectorWallet } from "../PrimaryCurrencySelector";
import fetcher from "@/helpers/fetcher";
import runNotify from "@/helpers/gastifyNotifier";
import { updateTransaction, type TransactionData } from "@/lib/features/transacctionsSlice";
import type { BudgetData } from "@/lib/features/budgetSlice";
import type { UserData } from "@/lib/features/userSlice";
import type { WalletData } from "@/lib/features/walletSlice";
import type { CategoryData } from "@/lib/features/categoriesSlice";
import type { AppDispatch } from "@/lib/store";

export interface BudgetsClientProps {
  mcSession?: string | null;
}

export type UnbudgetedGroup = CoverageGroup;

const today = new Date();

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function BudgetsClient({ mcSession }: BudgetsClientProps): React.JSX.Element {
  const { transacciones, budgets, categories, user, wallet, loading } = useGetDataFromProvider();
  const [startDate, setStartDate] = useState<Date>(new Date(today.getFullYear(), today.getMonth(), 1));
  const [endDate, setEndDate] = useState<Date>(getLastDayOfMonth(today.getFullYear(), today.getMonth()));
  const [editingBudget, setEditingBudget] = useState<BudgetModalItem | null>(null);
  const [selectedDetailBudget, setSelectedDetailBudget] = useState<BudgetDetailItem | null>(null);
  const [returnToDetailBudget, setReturnToDetailBudget] = useState<BudgetDetailItem | null>(null);
  const [modalMode, setModalMode] = useState<BudgetEditModalMode | null>(null); // "creation" | "edition" | null
  const [showUnbudgeted, setShowUnbudgeted] = useState<boolean>(false);
  const [returnToUnbudgeted, setReturnToUnbudgeted] = useState<boolean>(false);
  const [showSpendingSummary, setShowSpendingSummary] = useState<boolean>(false);
  const dispatch = useDispatch<AppDispatch>();
  const toFetch = fetcher();

  const activeBudgets = useMemo(
    () => ((budgets as BudgetData[]) || []).filter((b) => !b.archived),
    [budgets]
  );
  const spendingBudgets = useMemo(
    () => activeBudgets.filter(isSpendingBudget),
    [activeBudgets]
  );
  const savingBudgets = useMemo(
    () => activeBudgets.filter(isSavingBudget),
    [activeBudgets]
  );
  const projectBudgets = useMemo(() => activeBudgets.filter(isProjectBudget), [activeBudgets]);

  const coverage = useMemo(
    () => getBudgetCoverage({ transactions: transacciones as TransactionData[], budgets: [...spendingBudgets, ...projectBudgets], startDate, endDate }),
    [transacciones, spendingBudgets, projectBudgets, startDate, endDate]
  );

  const uncoveredCatalogCategories = useMemo(
    () => getUncoveredCatalogCategories(categories as unknown as CategoryData[], spendingBudgets),
    [categories, spendingBudgets]
  );

  const actualByBudgetId = useMemo(() => {
    const map: Record<string, number> = {};
    spendingBudgets.forEach((budget) => {
      if (budget._id) {
        map[budget._id] = getBudgetActualSpend(budget, transacciones, startDate, endDate);
      }
    });
    return map;
  }, [spendingBudgets, transacciones, startDate, endDate]);

  const projectActualById = useMemo(() => {
    const map: Record<string, number> = {};
    projectBudgets.forEach((project) => {
      if (project._id) {
        map[project._id] = 0;
      }
    });
    ((transacciones as TransactionData[]) || []).forEach((transaction) => {
      const id = getExplicitBudgetId(transaction);
      if (id && Object.prototype.hasOwnProperty.call(map, id) && transaction.isBill && !transaction.isIncome) {
        map[id] += Number(transaction.amount) || 0;
      }
    });
    return map;
  }, [projectBudgets, transacciones]);

  const spendingTotals: SpendingTotals = useMemo(() => {
    const fixed = spendingBudgets.reduce((acc, b) => acc + (b.goalAmount || 0), 0);
    return { fixed };
  }, [spendingBudgets]);

  const handleDateChange = (sDate: Date | null, eDate: Date | null): void => {
    if (sDate) setStartDate(sDate);
    if (eDate) setEndDate(eDate);
  };

  const getBudgetRangeLabel = (start?: Date | null, end?: Date | null): string => {
    if (!start || !end) return "";
    const todayDate = new Date();
    const lastMonthDate = new Date(
      todayDate.getFullYear(),
      todayDate.getMonth() - 1,
      1
    );

    const isThisMonth =
      start.getFullYear() === todayDate.getFullYear() &&
      start.getMonth() === todayDate.getMonth();

    const isLastMonth =
      start.getFullYear() === lastMonthDate.getFullYear() &&
      start.getMonth() === lastMonthDate.getMonth();

    const startStr = start.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    const endStr = end.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    let tag = "";
    if (isThisMonth) tag = " (This Month)";
    else if (isLastMonth) tag = " (Last Month)";

    return `${startStr} - ${endStr}${tag}`;
  };

  const openCreate = (): void => {
    setEditingBudget({ user: (user as UserData)?._id, wallet: (wallet as WalletData)?._id });
    setReturnToDetailBudget(null);
    setReturnToUnbudgeted(false);
    setModalMode("creation");
  };
  const openDetail = (budget: BudgetBarRowBudgetItem | BudgetDetailItem): void => {
    setSelectedDetailBudget(budget as BudgetDetailItem);
  };
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const openEdit = (budget: BudgetModalItem): void => {
    setSelectedDetailBudget(null);
    setReturnToDetailBudget(null);
    setEditingBudget(budget);
    setModalMode("edition");
  };
  const openEditFromDetail = (budget: BudgetDetailItem | ProjectBudgetItem): void => {
    setSelectedDetailBudget(null);
    setReturnToDetailBudget(budget as BudgetDetailItem);
    setEditingBudget(budget as BudgetModalItem);
    setModalMode("edition");
  };
  const closeModal = (): void => {
    setEditingBudget(null);
    setModalMode(null);
    setReturnToDetailBudget(null);
    if (returnToUnbudgeted) setShowUnbudgeted(true);
    setReturnToUnbudgeted(false);
  };
  const handleBackToDetail = (): void => {
    const b = returnToDetailBudget;
    closeModal();
    if (b) {
      setSelectedDetailBudget(b);
    }
  };
  const handleResetFilters = (): void => {
    const y = today.getFullYear();
    const m = today.getMonth();
    setStartDate(new Date(y, m, 1));
    setEndDate(getLastDayOfMonth(y, m));
  };

  const categoryEntryFromGroup = (group: UnbudgetedGroup): FormCategoryEntry => ({
    category: ((group.category as { _id?: string } | null)?._id) || (group.category as unknown as string) || "",
    subCategory: ((group.subCategory as { _id?: string } | null)?._id) || (group.subCategory as unknown as string) || "",
    name: group.name,
    color: group.color || "#DADADA",
    icon: group.icon || null,
  });

  const openCreateFromUnbudgeted = (group: UnbudgetedGroup): void => {
    setShowUnbudgeted(false);
    setReturnToUnbudgeted(true);
    setReturnToDetailBudget(null);
    setEditingBudget({
      user: (user as UserData)?._id,
      wallet: (wallet as WalletData)?._id,
      draftName: group.name,
      draftCategories: [categoryEntryFromGroup(group)],
      referenceSpent: group.amount || 0,
    });
    setModalMode("creation");
  };

  const openCreateProjectFromUnbudgeted = (group: UnbudgetedGroup): void => {
    const linkedTags = new Map<string, unknown>();
    (group.movements || []).forEach((movement) => ((movement as unknown as { tags?: Array<{ _id?: string; [key: string]: unknown }> }).tags || []).forEach((tag) => {
      if (tag?._id) linkedTags.set(String(tag._id), tag);
    }));
    setShowUnbudgeted(false);
    setReturnToUnbudgeted(true);
    setReturnToDetailBudget(null);
    setEditingBudget({
      user: (user as UserData)?._id,
      wallet: (wallet as WalletData)?._id,
      draftName: group.name,
      draftBudgetType: BUDGET_TYPES.PROJECT,
      draftTransactions: group.movements as BudgetTransactionRef[],
      draftLinkedTags: [...linkedTags.values()] as BudgetModalItem["draftLinkedTags"],
      referenceSpent: group.amount || 0,
    });
    setModalMode("creation");
  };

  const addGroupToProject = async (group: UnbudgetedGroup, project: BudgetData): Promise<void> => {
    try {
      const results = await Promise.all((group.movements || []).map((transaction) =>
        toFetch.post("general-data/transactions/link-budget", { transactionId: transaction._id as string, budgetId: project._id })
      ));
      const failed = results.find((result) => !result.ok);
      if (failed) throw new Error(failed.message || "Could not link all movements");
      results.forEach((result) => result.data && dispatch(updateTransaction(result.data)));
      const count = (group.movements || []).length;
      runNotify("ok", `${count} movement${count === 1 ? "" : "s"} added to ${project.name}`);
    } catch (error: unknown) {
      const err = error as { message?: string };
      runNotify("error", err?.message || String(error));
    }
  };

  const openAddToBudget = (group: UnbudgetedGroup, budget: BudgetData): void => {
    setShowUnbudgeted(false);
    setReturnToUnbudgeted(true);
    setReturnToDetailBudget(null);
    setEditingBudget({ ...budget, pendingCategory: categoryEntryFromGroup(group) } as BudgetModalItem);
    setModalMode("edition");
  };

  return (
    <div className="w-full h-full sm:pr-2 pb-10">
      <div className="w-full profile-img py-4 text-center text-white">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-thin">
          Budgets
        </h1>
      </div>
      <div className="w-full flex items-center justify-center pt-2">
        <Tooltip title="Every amount on this page is shown in this currency unless a budget sets its own.">
          <div>
            <PrimaryCurrencySelector pcsWallet={wallet as PrimaryCurrencySelectorWallet} />
          </div>
        </Tooltip>
      </div>
      <div className="content-profile-cont w-full h-full content-wallet-glass items-center mt-[10px] sm:mt-[20px] rounded-t-[60px] rounded-b-2xl px-4 sm:px-8 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <div
              className="gf-glass-card text-purple-100 font-semibold text-xs px-3.5 py-1.5 rounded-2xl flex items-center gap-1.5 select-none"
              title="Time period currently being considered for budgets"
            >
              <UniversalCategoIcon type="fa/FaCalendarAlt" siz={13} />
              <span>{getBudgetRangeLabel(startDate, endDate)}</span>
            </div>
            <TimeRange rpDate={handleDateChange} rpResponse={""} />
            <Tooltip title="Click to return time to current month 🤓">
              <button
                type="button"
                onClick={handleResetFilters}
                className="flex items-center gap-1 gf-glass-card hover:brightness-110 text-purple-100 font-bold px-3 py-1.5 rounded-full text-xs transition-[filter] cursor-pointer"
              >
                <UniversalCategoIcon type="md/MdRefresh" siz={15} />
                <span>Reset</span>
              </button>
            </Tooltip>
            <Tooltip title="Filter by a preset period or pick a specific range; the left/right arrows jump to the previous/next month. 🤓">
              <div className="text-purple-500">
                <UniversalCategoIcon type={"fa/FaRegQuestionCircle"} siz={15} />
              </div>
            </Tooltip>
          </div>
          <div
            className="flex items-center gap-2 gf-glass-button text-white rounded-full px-4 py-2 cursor-pointer"
            onClick={openCreate}
          >
            <CategoIcon type="MdAddCircleOutline" siz={22} />
            <p>New Budget</p>
          </div>
        </div>

        {loading ? (
          <Skeleton active />
        ) : (
          <>
            <h2 className="text-xl text-purple-300 mb-2">Spending budgets</h2>
            {(spendingBudgets.length > 0 || (coverage as SpendingSummaryCoverage).totalSpent > 0) && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
                <div
                  className="flex-1 bg-gf-accent-soft-bg rounded-2xl p-3 text-center cursor-pointer hover:brightness-110 transition-[filter]"
                  onClick={() => setShowSpendingSummary(true)}
                >
                  <p className="text-xs text-gf-text-muted">Planned</p>
                  <p className="text-lg text-purple-300 font-bold">{usdFormatChanger(spendingTotals.fixed)}</p>
                </div>
                <div
                  className="flex-1 bg-gf-accent-soft-bg rounded-2xl p-3 text-center cursor-pointer hover:brightness-110 transition-[filter]"
                  onClick={() => setShowSpendingSummary(true)}
                >
                  <p className="text-xs text-gf-text-muted">Total spent</p>
                  <p className="text-lg text-purple-300 font-bold">{usdFormatChanger((coverage as SpendingSummaryCoverage).totalSpent)}</p>
                </div>
                <div
                  className="flex-1 gf-glass-warning rounded-2xl p-3 text-center cursor-pointer hover:brightness-110 transition-[filter]"
                  onClick={() => setShowSpendingSummary(true)}
                >
                  <p className="text-xs text-amber-400">Unbudgeted</p>
                  <p className="text-lg text-amber-400 font-bold">
                    {usdFormatChanger((coverage as SpendingSummaryCoverage).unbudgetedSpent)}
                    <span className="text-xs font-normal ml-1">
                      · {Math.round((coverage as SpendingSummaryCoverage).unbudgetedPercentage)}%
                    </span>
                  </p>
                </div>
              </div>
            )}
            {spendingBudgets.length <= 0 ? (
              <EmptyModule emMessage="No spending budgets yet. Create one 🤓" />
            ) : (
              <div className="flex flex-col gap-2 mb-6">
                {spendingBudgets.map((budget) => (
                  <BudgetBarRow
                    key={budget._id}
                    budget={budget as BudgetBarRowBudgetItem}
                    actual={actualByBudgetId[budget._id || ""] || 0}
                    onClick={openDetail}
                  />
                ))}
                <UnbudgetedSpendingCard
                  coverage={coverage}
                  onClick={() => setShowUnbudgeted(true)}
                />
              </div>
            )}

            {spendingBudgets.length <= 0 && (coverage as SpendingSummaryCoverage).totalSpent > 0 && (
              <div className="mb-6">
                <UnbudgetedSpendingCard
                  coverage={coverage}
                  onClick={() => setShowUnbudgeted(true)}
                />
              </div>
            )}

            <h2 className="text-xl text-purple-300 mb-2">Projects</h2>
            <p className="text-xs text-gf-text-muted mb-3">One-time plans made from specific movements. Their dates and details can be changed at any time.</p>
            {projectBudgets.length <= 0 ? (
              <div className="mb-6"><EmptyModule emMessage="No project budgets yet. Create one for a trip, renovation, or event ✈️" /></div>
            ) : (
              <div className="flex flex-col gap-2 mb-6">
                {projectBudgets.map((budget) => (
                  <BudgetBarRow
                    key={budget._id}
                    budget={budget as BudgetBarRowBudgetItem}
                    actual={projectActualById[budget._id || ""] || 0}
                    onClick={openDetail}
                  />
                ))}
              </div>
            )}

            <h2 className="text-xl text-purple-300 mb-2">Savings</h2>
            {savingBudgets.length <= 0 ? (
              <EmptyModule emMessage="No savings budgets yet. Create one 🤓" />
            ) : (
              <div className="flex flex-col gap-2">
                {savingBudgets.map((budget) => (
                  <BudgetBarRow
                    key={budget._id}
                    budget={budget as BudgetBarRowBudgetItem}
                    onClick={openDetail}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {selectedDetailBudget && isProjectBudget(selectedDetailBudget) ? (
          <ProjectBudgetDetailModal
            budget={selectedDetailBudget as ProjectBudgetItem}
            transacciones={transacciones as ProjectBudgetTransactionItem[]}
            onClose={() => setSelectedDetailBudget(null)}
            onEdit={openEditFromDetail}
          />
        ) : selectedDetailBudget && (
          <BudgetDetailModal
            budget={selectedDetailBudget}
            transacciones={transacciones as BudgetDetailTransactionItem[]}
            startDate={startDate}
            endDate={endDate}
            onClose={() => setSelectedDetailBudget(null)}
            onEdit={openEditFromDetail}
          />
        )}

        {modalMode && (
          <BudgetEditModal
            mode={modalMode}
            budget={editingBudget}
            onClose={closeModal}
            onBack={returnToDetailBudget ? handleBackToDetail : null}
          />
        )}

        {showUnbudgeted && (
          <UnbudgetedSpendingModal
            coverage={coverage}
            budgets={spendingBudgets}
            projectBudgets={projectBudgets}
            uncoveredCatalogCategories={uncoveredCatalogCategories}
            rangeLabel={getBudgetRangeLabel(startDate, endDate)}
            onClose={() => setShowUnbudgeted(false)}
            onCreateBudget={openCreateFromUnbudgeted}
            onAddToBudget={openAddToBudget}
            onCreateProject={openCreateProjectFromUnbudgeted}
            onAddToProject={addGroupToProject}
          />
        )}

        {showSpendingSummary && (
          <BasicModal
            close={() => setShowSpendingSummary(false)}
            renderContent={
              <SpendingSummaryDetailModal
                close={() => setShowSpendingSummary(false)}
                spendingBudgets={spendingBudgets as SpendingBudgetSummaryItem[]}
                actualByBudgetId={actualByBudgetId}
                coverage={coverage as SpendingSummaryCoverage}
                spendingTotals={spendingTotals}
              />
            }
          />
        )}
      </div>
    </div>
  );
}

export default BudgetsClient;
