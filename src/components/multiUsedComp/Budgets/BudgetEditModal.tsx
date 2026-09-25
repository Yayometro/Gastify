"use client";

import React, { useContext, useEffect, useMemo, useState } from "react";
import { Spin, Tooltip } from "antd";
import { useDispatch, useSelector } from "react-redux";
import fetcher from "@/helpers/fetcher";
import runNotify from "@/helpers/gastifyNotifier";
import CategoIcon from "../CategoIcon";
import UniversalCategoIcon from "../UniversalCategoIcon";
import IconDisplayerMenu from "../IconDisplayerMenu";
import SelectCategories from "@/components/categories/SelectCategoryProvider/SelectCategories";
import {
  SelectCategoryContext,
  type CategoryItem,
} from "@/components/categories/SelectCategoryProvider/SelectCategoryProvider";
import BtnSelectCategoryContext from "@/components/buttons/buttonWrappers/selectBtnCategoryWithContext.jsx/BtnSelectCategoryContext";
import BasicModal from "@/components/modals/basicModal/BasicModal";
import ModalCategoryContent from "@/components/modals/contents/selectCategory/ModalCategoryContent";
import useModal from "@/hooks/useModalBasic";
import useGetDataFromProvider from "@/hooks/getAllInfo/useGetInfoFromProvider";
import { addNewBudget, updateBudget, removeBudget, type BudgetData } from "@/lib/features/budgetSlice";
import { updateTransaction, type TransactionData } from "@/lib/features/transacctionsSlice";
import { usdFormatChanger } from "@/helpers/transformers/transactionsChange";
import { findCoverageConflicts } from "@/helpers/transformers/budgetCoverage";
import { BUDGET_TYPES, getBudgetType } from "@/helpers/transformers/budgetTypes";
import TimeRange from "@/components/Filters/timeRange/TimeRange";
import { SUPPORTED_CURRENCIES, CURRENCY_META, formatMoneyMajor } from "@/lib/money/currencies";
import type { RootState, AppDispatch } from "@/lib/store";
import type { WalletData } from "@/lib/features/walletSlice";
import type { AccountData } from "@/lib/features/accountsSlice";
import "@/components/multiUsedComp/css/muliUsed.css";

export interface BudgetTypeOption {
  value: string;
  title: string;
  copy: string;
  icon: string;
}

const typeOptions: BudgetTypeOption[] = [
  { value: BUDGET_TYPES.SPENDING, title: "Spending", copy: "A recurring limit for categories", icon: "md/MdAccountBalanceWallet" },
  { value: BUDGET_TYPES.SAVING, title: "Saving", copy: "Track progress toward a savings goal", icon: "fa/FaPiggyBank" },
  { value: BUDGET_TYPES.PROJECT, title: "Project", copy: "A one-time plan made of specific movements", icon: "md/MdFlightTakeoff" },
];

const DEFAULT_PROJECT_ICON = "md/MdFlightTakeoff";

const dateInputValue = (value?: string | Date | null): string => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
};

const localDateFromInput = (value?: string | null): Date | null => {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day, 12, 0, 0);
};

const inputValueFromLocalDate = (value?: Date | null): string => {
  if (!value || Number.isNaN(value.getTime())) return "";
  const pad = (part: number): string => String(part).padStart(2, "0");
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
};

export interface FormCategoryEntry {
  category: string;
  subCategory: string;
  name?: string;
  color?: string;
  icon?: string | null;
}

export interface BudgetCategoryRef {
  _id?: string;
  name?: string;
  color?: string;
  icon?: string | null;
  isSub?: boolean;
  fatherCategory?: string | BudgetCategoryRef | null;
  [key: string]: unknown;
}

export interface BudgetEditCategoryItem {
  category?: string | BudgetCategoryRef | null;
  subCategory?: string | BudgetCategoryRef | null;
  name?: string;
  color?: string;
  icon?: string | null;
  [key: string]: unknown;
}

export interface BudgetTagRef {
  _id?: string;
  name?: string;
  [key: string]: unknown;
}

export interface BudgetAccountRef {
  _id?: string;
  name?: string;
  amount?: number;
  currency?: string;
  [key: string]: unknown;
}

export interface BudgetTransactionRef {
  _id?: string;
  isBill?: boolean;
  tags?: BudgetTagRef[];
  budget?: string | { _id?: string } | null;
  [key: string]: unknown;
}

export interface BudgetModalItem {
  _id?: string;
  name?: string;
  goalAmount?: number | string;
  savingAmount?: number | string;
  budgetType?: string;
  isSaving?: boolean;
  period?: "monthly" | "quarterly" | "biannual" | "yearly" | string;
  category?: string | BudgetCategoryRef | null;
  subCategory?: string | BudgetCategoryRef | null;
  categories?: BudgetEditCategoryItem[];
  linkedAccounts?: (string | BudgetAccountRef)[];
  eventStartDate?: Date | string | null;
  eventEndDate?: Date | string | null;
  linkedTags?: (string | BudgetTagRef)[];
  icon?: string;
  currency?: string;
  pendingCategory?: FormCategoryEntry;
  draftCategories?: FormCategoryEntry[];
  draftName?: string;
  draftBudgetType?: string;
  draftLinkedTags?: (string | BudgetTagRef)[];
  draftIcon?: string;
  draftTransactions?: BudgetTransactionRef[];
  user?: string | unknown;
  wallet?: string | unknown;
  referenceSpent?: number | string;
  [key: string]: unknown;
}

export interface BudgetEditFormState {
  name: string;
  goalAmount: number | string;
  savingAmount: number | string;
  budgetType: string;
  category: string;
  subCategory: string;
  period: "monthly" | "quarterly" | "biannual" | "yearly" | string;
  categories: FormCategoryEntry[];
  linkedAccounts: string[];
  eventStartDate: string;
  eventEndDate: string;
  linkedTags: string[];
  icon: string;
  currency: string;
}

export type BudgetEditModalMode = "creation" | "edition" | string;

export interface BudgetEditFormProps {
  mode: BudgetEditModalMode;
  budget?: BudgetModalItem | null;
  onClose: () => void;
  onBack?: (() => void) | null;
}

export type BudgetEditModalProps = BudgetEditFormProps;

interface ProviderData {
  transacciones?: BudgetTransactionRef[];
  wallet?: { primaryCurrency?: string; [key: string]: unknown };
  [key: string]: unknown;
}

function BudgetEditForm({ mode, budget, onClose, onBack }: BudgetEditFormProps): React.JSX.Element {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [form, setForm] = useState<BudgetEditFormState>({
    name: "",
    goalAmount: "",
    savingAmount: "",
    budgetType: BUDGET_TYPES.SPENDING,
    category: "",
    subCategory: "",
    period: "monthly",
    categories: [],
    linkedAccounts: [],
    eventStartDate: "",
    eventEndDate: "",
    linkedTags: [],
    icon: DEFAULT_PROJECT_ICON,
    currency: "MXN",
  });
  const [isIconMenuOpen, setIsIconMenuOpen] = useState<boolean>(false);
  const toFetch = fetcher();
  const dispatch = useDispatch<AppDispatch>();
  const { close, handleClose } = useModal();
  const { setItemSelected } = useContext(SelectCategoryContext);
  const { transacciones = [], wallet } = useGetDataFromProvider() as ProviderData;
  const ccAccounts = useSelector((state: RootState) => (state.accountsReducer?.data || []) as AccountData[]);
  const walletPrimaryCurrency = useSelector((state: RootState) => (state.walletReducer?.data as WalletData)?.primaryCurrency) || "MXN";
  const ccBudgets = useSelector((state: RootState) => (state.budgetReducer?.data || []) as BudgetData[]);

  const availableTags = useMemo(() => {
    const tags = new Map<string, BudgetTagRef>();
    transacciones.forEach((transaction) => (transaction.tags || []).forEach((tag) => {
      if (tag?._id) tags.set(String(tag._id), tag);
    }));
    return [...tags.values()]
      .filter((tag) => tag.name?.trim())
      .sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  }, [transacciones]);

  useEffect(() => {
    if (mode === "edition" && budget) {
      let initialCategories: FormCategoryEntry[] = [];
      if (Array.isArray(budget.categories) && budget.categories.length) {
        initialCategories = budget.categories.map((c) => {
          const categoryRef = typeof c.category === "object" && c.category !== null ? (c.category as BudgetCategoryRef) : null;
          const subCategoryRef = typeof c.subCategory === "object" && c.subCategory !== null ? (c.subCategory as BudgetCategoryRef) : null;
          const categoryId = categoryRef?._id || (typeof c.category === "string" ? c.category : "") || "";
          const subCategoryId = subCategoryRef?._id || (typeof c.subCategory === "string" ? c.subCategory : "") || "";
          const catObj = subCategoryRef || categoryRef;
          return {
            category: categoryId,
            subCategory: subCategoryId,
            name: catObj?.name || (c.name as string) || "Category",
            color: catObj?.color || (c.color as string) || "#DADADA",
            icon: catObj?.icon || null,
          };
        });
      } else if (budget.subCategory || budget.category) {
        const subCategoryRef = typeof budget.subCategory === "object" && budget.subCategory !== null ? (budget.subCategory as BudgetCategoryRef) : null;
        const categoryRef = typeof budget.category === "object" && budget.category !== null ? (budget.category as BudgetCategoryRef) : null;
        const catObj = subCategoryRef || categoryRef;
        initialCategories = [{
          category: categoryRef?._id || (typeof budget.category === "string" ? budget.category : "") || "",
          subCategory: subCategoryRef?._id || (typeof budget.subCategory === "string" ? budget.subCategory : "") || "",
          name: catObj?.name || "Category",
          color: catObj?.color || "#DADADA",
          icon: catObj?.icon || null,
        }];
      }
      if (budget.pendingCategory) initialCategories.push(budget.pendingCategory);

      const categoryId = typeof budget.category === "string"
        ? budget.category
        : (budget.category && typeof budget.category === "object" && "_id" in budget.category ? String(budget.category._id || "") : "");
      const subCategoryId = typeof budget.subCategory === "string"
        ? budget.subCategory
        : (budget.subCategory && typeof budget.subCategory === "object" && "_id" in budget.subCategory ? String(budget.subCategory._id || "") : "");

      setForm({
        name: budget.name || "",
        goalAmount: budget.goalAmount || "",
        savingAmount: budget.savingAmount || "",
        budgetType: getBudgetType(budget),
        category: categoryId,
        subCategory: subCategoryId,
        period: budget.period || "monthly",
        categories: initialCategories,
        linkedAccounts: (budget.linkedAccounts || []).map((a) => String((typeof a === "object" && a !== null && "_id" in a ? a._id : a) || "")),
        eventStartDate: dateInputValue(budget.eventStartDate),
        eventEndDate: dateInputValue(budget.eventEndDate),
        linkedTags: (budget.linkedTags || []).map((tag) => String((typeof tag === "object" && tag !== null && "_id" in tag ? tag._id : tag) || "")),
        icon: budget.icon || DEFAULT_PROJECT_ICON,
        currency: budget.currency || wallet?.primaryCurrency || "MXN",
      });
      if (setItemSelected) {
        setItemSelected(budget.subCategory || budget.category || null);
      }
    } else if (mode === "creation") {
      const draftCategories = Array.isArray(budget?.draftCategories) ? budget.draftCategories : [];
      setForm({
        name: budget?.draftName || "",
        goalAmount: "",
        savingAmount: "",
        budgetType: budget?.draftBudgetType || BUDGET_TYPES.SPENDING,
        category: draftCategories[0]?.category || "",
        subCategory: draftCategories[0]?.subCategory || "",
        period: "monthly",
        categories: draftCategories,
        linkedAccounts: [],
        eventStartDate: "",
        eventEndDate: "",
        linkedTags: (budget?.draftLinkedTags || []).map((tag) => String((typeof tag === "object" && tag !== null && "_id" in tag ? tag._id : tag) || "")),
        icon: budget?.draftIcon || DEFAULT_PROJECT_ICON,
        currency: wallet?.primaryCurrency || "MXN",
      });
      if (setItemSelected) {
        setItemSelected(null);
      }
    }
  }, [mode, budget, setItemSelected, wallet]);

  const categoryConflicts = useMemo(() => form.budgetType === BUDGET_TYPES.SPENDING
    ? findCoverageConflicts(form.categories, ccBudgets, mode === "edition" ? budget?._id : null)
    : [], [form.budgetType, form.categories, ccBudgets, mode, budget?._id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  const toggleListValue = (field: "linkedAccounts" | "linkedTags", value: string | unknown) => setForm((prev) => ({
    ...prev,
    [field]: prev[field].some((id) => String(id) === String(value))
      ? prev[field].filter((id) => String(id) !== String(value))
      : [...prev[field], String(value)],
  }));

  const handleCategory = (cat: CategoryItem | BudgetCategoryRef | unknown) => {
    const categoryItem = cat as (CategoryItem & BudgetCategoryRef) | null | undefined;
    if (!categoryItem) return;
    const fatherId = categoryItem.isSub
      ? (typeof categoryItem.fatherCategory === "object" && categoryItem.fatherCategory !== null && "_id" in categoryItem.fatherCategory
          ? (categoryItem.fatherCategory as BudgetCategoryRef)._id
          : categoryItem.fatherCategory) || null
      : null;
    const entry: FormCategoryEntry = fatherId
      ? { subCategory: String(categoryItem._id || ""), category: String(fatherId), name: categoryItem.name, color: categoryItem.color, icon: categoryItem.icon }
      : { category: String(categoryItem._id || ""), subCategory: "", name: categoryItem.name, color: categoryItem.color, icon: categoryItem.icon };
    setForm((prev) => {
      const exists = prev.categories.some((c) => fatherId
        ? String(c.subCategory) === String(categoryItem._id)
        : String(c.category) === String(categoryItem._id) && !c.subCategory);
      const categories = exists ? prev.categories : [...prev.categories, entry];
      return { ...prev, categories, category: categories[0]?.category || "", subCategory: categories[0]?.subCategory || "" };
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      setIsLoading(true);
      const isSpending = form.budgetType === BUDGET_TYPES.SPENDING;
      const isSaving = form.budgetType === BUDGET_TYPES.SAVING;
      const isProject = form.budgetType === BUDGET_TYPES.PROJECT;
      const payload = {
        name: form.name,
        goalAmount: Number(form.goalAmount),
        savingAmount: isSaving ? Number(form.savingAmount) || 0 : 0,
        budgetType: form.budgetType,
        isSaving,
        period: isSpending ? form.period : "monthly",
        category: isSpending ? form.categories[0]?.category || null : null,
        subCategory: isSpending ? form.categories[0]?.subCategory || null : null,
        categories: isSpending ? form.categories.map((c) => ({ category: c.category || null, subCategory: c.subCategory || null })) : [],
        linkedAccounts: isSaving ? form.linkedAccounts : [],
        eventStartDate: isProject ? form.eventStartDate || null : null,
        eventEndDate: isProject ? form.eventEndDate || null : null,
        linkedTags: isProject ? form.linkedTags : [],
        icon: isProject ? form.icon || DEFAULT_PROJECT_ICON : undefined,
        currency: form.currency || "MXN",
      };
      const res = mode === "edition"
        ? await toFetch.post("general-data/budget/update", { ...payload, id: budget?._id })
        : await toFetch.post("general-data/budget/new", { ...payload, user: budget?.user, wallet: budget?.wallet });

      if (!res.ok || !res.data) throw new Error(res.message || "Operation failed 🤕");
      if (mode === "edition") dispatch(updateBudget(res.data));
      else dispatch(addNewBudget(res.data));

      if (mode === "creation" && isProject && budget?.draftTransactions?.length) {
        const linked = await Promise.all(budget.draftTransactions.map((transaction) =>
          toFetch.post("general-data/transactions/link-budget", { transactionId: transaction._id, budgetId: res.data._id })
        ));
        linked.filter((item: { ok?: boolean; data?: TransactionData }) => item.ok && item.data).forEach((item: { data?: TransactionData }) => dispatch(updateTransaction(item.data as TransactionData)));
      }
      runNotify("ok", res.message);
      onClose();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : typeof err === "object" && err !== null && "message" in err ? String((err as { message: unknown }).message) : String(err);
      runNotify("error", errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsLoading(true);
      const res = await toFetch.post("general-data/budget/remove", { id: budget?._id });
      if (!res.ok) throw new Error(res.message || "Could not delete budget");
      if (budget?._id) dispatch(removeBudget(budget._id));
      if (getBudgetType(budget) === BUDGET_TYPES.PROJECT) {
        transacciones
          .filter((transaction) => {
            const transBudgetId = typeof transaction.budget === "object" && transaction.budget !== null && "_id" in transaction.budget
              ? (transaction.budget as { _id?: string })._id
              : transaction.budget;
            return String(transBudgetId || "") === String(budget?._id);
          })
          .forEach((transaction) => dispatch(updateTransaction({ ...transaction, budget: null })));
      }
      runNotify("ok", res.message);
      onClose();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : typeof err === "object" && err !== null && "message" in err ? String((err as { message: unknown }).message) : String(err);
      runNotify("error", errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const isProject = form.budgetType === BUDGET_TYPES.PROJECT;
  const isSaving = form.budgetType === BUDGET_TYPES.SAVING;
  const isSpending = form.budgetType === BUDGET_TYPES.SPENDING;

  return <BasicModal close={onClose} renderContent={
    <div className="content absolute gf-glass-violet flex flex-col w-[94vw] max-w-[500px] max-h-[92vh] overflow-hidden rounded-3xl z-[1001] shadow-2xl">
      {isLoading && <div className="absolute inset-0 bg-gf-surface/70 backdrop-blur-sm flex justify-center items-center z-[1002]"><Spin size="large" /></div>}
      <div className="relative pt-6 pb-5 px-4 text-center text-white shrink-0">
        {onBack && <button type="button" onClick={onBack} className="absolute top-4 left-4 rounded-full gf-glass-card p-1.5 text-purple-100 hover:text-white transition-colors text-xs font-semibold">← Back</button>}
        <button type="button" onClick={onClose} className="absolute top-4 right-4 rounded-full gf-glass-card p-1.5 text-purple-100 hover:text-white transition-colors"><CategoIcon type="MdClose" siz={18} /></button>
        <h1 className="text-2xl font-bold">{mode === "edition" ? "Edit" : "Create"} {isProject ? "Project" : "Budget"} 🪄</h1>
      </div>
      <div className="flex-1 overflow-y-auto px-6 sm:px-8 pt-6 pb-8">
        <form onSubmit={handleSubmit} className="form-trans-edit flex flex-col gap-3">
          <p className="label-tfp">Name</p>
          <input type="text" name="name" value={form.name} onChange={handleChange} placeholder={isProject ? "e.g. Japan 2027" : "Budget name"} required className="w-full" />
          {mode === "creation" && Number(budget?.referenceSpent) > 0 && <p className="text-xs text-amber-400 bg-amber-500/15 border border-amber-200 rounded-xl px-3 py-2">You already spent <strong>{usdFormatChanger(budget?.referenceSpent)}</strong>. The linked movements will count toward this project.</p>}

          <p className="label-tfp mt-1">Type</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {typeOptions.map((option) => <button key={option.value} type="button" onClick={() => setForm((prev) => ({ ...prev, budgetType: option.value }))} className={`text-left rounded-2xl border p-3 transition-colors ${form.budgetType === option.value ? "border-purple-500 bg-gf-accent-soft-bg text-purple-300" : "border-gf-border bg-gf-surface text-gf-text-muted hover:border-purple-200"}`}>
              <UniversalCategoIcon type={option.icon} siz={18} />
              <p className="font-bold text-xs mt-1">{option.title}</p><p className="text-[10px] leading-tight mt-0.5">{option.copy}</p>
            </button>)}
          </div>

          <p className="label-tfp mt-1">{isSaving ? "Savings target" : isProject ? "Project spending limit" : "Spending limit"}</p>
          <div className="flex items-stretch gap-2">
            <input type="number" min="0" name="goalAmount" value={form.goalAmount} onChange={handleChange} required className="flex-1 min-w-0" />
            <Tooltip title="Which currency this budget's numbers are shown in. Doesn't convert or move any money.">
              <select
                name="currency"
                value={form.currency}
                onChange={handleChange}
                className="h-10 shrink-0 bg-gf-accent-soft-bg border border-purple-300 text-purple-300 text-xs font-semibold rounded-full px-3 cursor-pointer outline-none"
              >
                {SUPPORTED_CURRENCIES.map((code: string) => (
                  <option key={code} value={code}>
                    {code} ({(CURRENCY_META as Record<string, { symbol: string }>)[code]?.symbol || "$"})
                  </option>
                ))}
              </select>
            </Tooltip>
          </div>

          {isSaving && <>
            <p className="label-tfp mt-1">Current amount saved (manual)</p>
            <input type="number" min="0" name="savingAmount" value={form.savingAmount} onChange={handleChange} placeholder="0" className="w-full" />
            <div className="flex items-center gap-1"><p className="label-tfp">🔗 Or link account balances</p><Tooltip title="The selected balances track progress; no money is moved."><span className="text-purple-500"><UniversalCategoIcon type="fa/FaRegQuestionCircle" siz={15} /></span></Tooltip></div>
            <div className="flex flex-col gap-2">{ccAccounts.length ? ccAccounts.map((acc) => {
              const selected = form.linkedAccounts.includes(String(acc._id));
              return <button key={acc._id} type="button" onClick={() => toggleListValue("linkedAccounts", acc._id)} className={`flex justify-between rounded-xl border px-3 py-2 text-xs ${selected ? "bg-blue-600 border-blue-600 text-white" : "bg-gf-surface border-gf-border"}`}><span>{acc.name}</span><strong>{formatMoneyMajor(acc.amount || 0, acc.currency || walletPrimaryCurrency, { showCode: true })}</strong></button>;
            }) : <p className="text-xs text-gf-text-muted italic">No accounts available</p>}</div>
          </>}

          {isProject && <div className="flex flex-col gap-3 bg-gf-surface border border-gf-border rounded-2xl p-4 mt-1">
            <div>
              <p className="label-tfp mb-1">Project icon</p>
              <button
                type="button"
                onClick={() => setIsIconMenuOpen(true)}
                className="w-full flex items-center gap-3 rounded-2xl border-2 border-purple-300 bg-gf-accent-soft-bg px-3 py-2 text-left hover:border-purple-500 transition-colors"
              >
                <span className="w-10 h-10 rounded-full bg-gf-surface text-purple-300 flex items-center justify-center shadow-sm shrink-0">
                  <UniversalCategoIcon type={form.icon || DEFAULT_PROJECT_ICON} siz={24} />
                </span>
                <span><span className="block text-xs font-bold text-purple-300">Selected icon</span><span className="block text-[10px] text-gf-text-muted">Click to choose another icon</span></span>
              </button>
              <IconDisplayerMenu
                idmActive={isIconMenuOpen}
                idmIcon={(icon: string) => setForm((prev) => ({ ...prev, icon }))}
                idmClose={setIsIconMenuOpen}
              />
            </div>
            <div><p className="font-bold text-sm text-purple-300">Project window</p><p className="text-[11px] text-gf-text-muted">Informational and fully editable. Linked expenses count even if their purchase date falls outside this window.</p></div>
            <TimeRange
              startDateValue={localDateFromInput(form.eventStartDate)}
              endDateValue={localDateFromInput(form.eventEndDate)}
              rpDate={(start, end) => setForm((prev) => ({
                ...prev,
                eventStartDate: inputValueFromLocalDate(start),
                eventEndDate: inputValueFromLocalDate(end),
              }))}
              rpResponse=""
              styles="w-full flex items-center justify-center gap-1 bg-gf-surface-2 border border-gf-border px-2 py-2 rounded-full"
            />
            <div><p className="label-tfp">Related tags (suggestions only)</p><p className="text-[10px] text-gf-text-muted mb-2">Tags help find candidate movements. They never add spending automatically.</p>
              {availableTags.length ? <div className="flex flex-wrap gap-1.5">{availableTags.map((tag) => {
                const selected = form.linkedTags.includes(String(tag._id));
                return <button key={tag._id} type="button" onClick={() => toggleListValue("linkedTags", tag._id)} className={`rounded-full px-2.5 py-1 text-xs border ${selected ? "bg-purple-600 border-purple-600 text-white" : "bg-gf-surface-2 border-gf-border text-gf-text-muted"}`}>#{tag.name}</button>;
              })}</div> : <p className="text-xs text-gf-text-muted italic">No tags found in your movements yet.</p>}
            </div>
          </div>}

          {isSpending && <>
            <p className="label-tfp mt-1">Time Period</p>
            <select name="period" value={form.period} onChange={handleChange} className="etm-selector bg-gf-surface"><option value="monthly">Monthly</option><option value="quarterly">Quarterly (3 months)</option><option value="biannual">Biannual (6 months)</option><option value="yearly">Yearly (12 months)</option></select>
            <p className="label-tfp mt-1">Categories ({form.categories.length})</p>
            {!!form.categories.length && <div className="flex flex-wrap gap-1.5">{form.categories.map((c, index) => <div key={`${c.category}:${c.subCategory}:${index}`} className="flex items-center gap-1 bg-gf-accent-soft-bg text-purple-300 rounded-full px-2.5 py-1 text-xs"><span>{c.name}</span><button type="button" onClick={() => setForm((prev) => ({ ...prev, categories: prev.categories.filter((_, i) => i !== index) }))}>×</button></div>)}</div>}
            {!!categoryConflicts.length && <div className="bg-amber-500/15 border border-amber-300 text-amber-400 rounded-2xl px-3 py-2 text-xs"><p className="font-bold">This coverage already exists</p><p>Also covered by {(categoryConflicts as BudgetData[]).map((item) => item.name || "Unnamed budget").join(", ")}.</p></div>}
            <BtnSelectCategoryContext onClose={handleClose} />
            {close && <BasicModal close={handleClose} renderContent={<ModalCategoryContent close={handleClose} getSelected={handleCategory} />} />}
          </>}

          {mode === "edition" && <button type="button" onClick={handleDelete} className="mt-2 w-full cursor-pointer gf-glass-button-danger text-white text-center rounded-full p-2">Delete this {isProject ? "project" : "budget"}</button>}
          <button type="submit" className="mt-3 cursor-pointer w-full gf-glass-button text-white text-center rounded-full p-2">{mode === "edition" ? "Update" : "Create"} {isProject ? "Project" : "Budget"}</button>
        </form>
      </div>
    </div>
  } />;
}

export default function BudgetEditModal(props: BudgetEditModalProps): React.JSX.Element {
  return <SelectCategories><BudgetEditForm {...props} /></SelectCategories>;
}
