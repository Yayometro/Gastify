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
import { SelectCategoryContext } from "@/components/categories/SelectCategoryProvider/SelectCategoryProvider";
import BtnSelectCategoryContext from "@/components/buttons/buttonWrappers/selectBtnCategoryWithContext.jsx/BtnSelectCategoryContext";
import BasicModal from "@/components/modals/basicModal/BasicModal";
import ModalCategoryContent from "@/components/modals/contents/selectCategory/ModalCategoryContent";
import useModal from "@/hooks/useModalBasic";
import useGetDataFromProvider from "@/hooks/getAllInfo/useGetInfoFromProvider";
import { addNewBudget, updateBudget, removeBudget } from "@/lib/features/budgetSlice";
import { updateTransaction } from "@/lib/features/transacctionsSlice";
import { usdFormatChanger } from "@/helpers/transformers/transactionsChange";
import { findCoverageConflicts } from "@/helpers/transformers/budgetCoverage";
import { BUDGET_TYPES, getBudgetType } from "@/helpers/transformers/budgetTypes";
import TimeRange from "@/components/Filters/timeRange/TimeRange";
import { SUPPORTED_CURRENCIES, CURRENCY_META, formatMoneyMajor } from "@/lib/money/currencies";
import "@/components/multiUsedComp/css/muliUsed.css";

const typeOptions = [
  { value: BUDGET_TYPES.SPENDING, title: "Spending", copy: "A recurring limit for categories", icon: "md/MdAccountBalanceWallet" },
  { value: BUDGET_TYPES.SAVING, title: "Saving", copy: "Track progress toward a savings goal", icon: "fa/FaPiggyBank" },
  { value: BUDGET_TYPES.PROJECT, title: "Project", copy: "A one-time plan made of specific movements", icon: "md/MdFlightTakeoff" },
];

const DEFAULT_PROJECT_ICON = "md/MdFlightTakeoff";

const dateInputValue = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
};

const localDateFromInput = (value) => {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day, 12, 0, 0);
};

const inputValueFromLocalDate = (value) => {
  if (!value || Number.isNaN(value.getTime())) return "";
  const pad = (part) => String(part).padStart(2, "0");
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
};

function BudgetEditForm({ mode, budget, onClose, onBack }) {
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
    name: "", goalAmount: "", savingAmount: "", budgetType: BUDGET_TYPES.SPENDING,
    category: "", subCategory: "", period: "monthly", categories: [], linkedAccounts: [],
    eventStartDate: "", eventEndDate: "", linkedTags: [],
    icon: DEFAULT_PROJECT_ICON, currency: "MXN",
  });
  const [isIconMenuOpen, setIsIconMenuOpen] = useState(false);
  const toFetch = fetcher();
  const dispatch = useDispatch();
  const { close, handleClose } = useModal();
  const { setItemSelected } = useContext(SelectCategoryContext);
  const { transacciones = [], wallet } = useGetDataFromProvider();
  const ccAccounts = useSelector((state) => state.accountsReducer?.data || []);
  const walletPrimaryCurrency = useSelector((state) => state.walletReducer?.data?.primaryCurrency) || "MXN";
  const ccBudgets = useSelector((state) => state.budgetReducer?.data || []);

  const availableTags = useMemo(() => {
    const tags = new Map();
    transacciones.forEach((transaction) => (transaction.tags || []).forEach((tag) => {
      if (tag?._id) tags.set(String(tag._id), tag);
    }));
    return [...tags.values()]
      .filter((tag) => tag.name?.trim())
      .sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  }, [transacciones]);

  useEffect(() => {
    if (mode === "edition" && budget) {
      let initialCategories = [];
      if (Array.isArray(budget.categories) && budget.categories.length) {
        initialCategories = budget.categories.map((c) => ({
          category: c.category?._id || c.category || "",
          subCategory: c.subCategory?._id || c.subCategory || "",
          name: (c.subCategory || c.category)?.name || "Category",
          color: (c.subCategory || c.category)?.color || "#DADADA",
          icon: (c.subCategory || c.category)?.icon || null,
        }));
      } else if (budget.subCategory || budget.category) {
        const catObj = budget.subCategory || budget.category;
        initialCategories = [{
          category: budget.category?._id || budget.category || "",
          subCategory: budget.subCategory?._id || budget.subCategory || "",
          name: catObj?.name || "Category", color: catObj?.color || "#DADADA", icon: catObj?.icon || null,
        }];
      }
      if (budget.pendingCategory) initialCategories.push(budget.pendingCategory);
      setForm({
        name: budget.name || "", goalAmount: budget.goalAmount || "", savingAmount: budget.savingAmount || "",
        budgetType: getBudgetType(budget), category: budget.category?._id || budget.category || "",
        subCategory: budget.subCategory?._id || budget.subCategory || "", period: budget.period || "monthly",
        categories: initialCategories,
        linkedAccounts: (budget.linkedAccounts || []).map((a) => String(a?._id || a)),
        eventStartDate: dateInputValue(budget.eventStartDate), eventEndDate: dateInputValue(budget.eventEndDate),
        linkedTags: (budget.linkedTags || []).map((tag) => String(tag?._id || tag)),
        icon: budget.icon || DEFAULT_PROJECT_ICON,
        currency: budget.currency || wallet?.primaryCurrency || "MXN",
      });
      setItemSelected(budget.subCategory || budget.category || null);
    } else if (mode === "creation") {
      const draftCategories = Array.isArray(budget?.draftCategories) ? budget.draftCategories : [];
      setForm({
        name: budget?.draftName || "", goalAmount: "", savingAmount: "",
        budgetType: budget?.draftBudgetType || BUDGET_TYPES.SPENDING,
        category: draftCategories[0]?.category || "", subCategory: draftCategories[0]?.subCategory || "",
        period: "monthly", categories: draftCategories, linkedAccounts: [], eventStartDate: "", eventEndDate: "",
        linkedTags: (budget?.draftLinkedTags || []).map((tag) => String(tag?._id || tag)),
        icon: budget?.draftIcon || DEFAULT_PROJECT_ICON,
        currency: wallet?.primaryCurrency || "MXN",
      });
      setItemSelected(null);
    }
  }, [mode, budget, setItemSelected, wallet]);

  const categoryConflicts = useMemo(() => form.budgetType === BUDGET_TYPES.SPENDING
    ? findCoverageConflicts(form.categories, ccBudgets, mode === "edition" ? budget?._id : null)
    : [], [form.budgetType, form.categories, ccBudgets, mode, budget?._id]);

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  const toggleListValue = (field, value) => setForm((prev) => ({
    ...prev,
    [field]: prev[field].some((id) => String(id) === String(value))
      ? prev[field].filter((id) => String(id) !== String(value))
      : [...prev[field], String(value)],
  }));

  const handleCategory = (cat) => {
    const fatherId = cat.isSub ? cat.fatherCategory?._id || cat.fatherCategory : null;
    const entry = fatherId
      ? { subCategory: cat._id, category: fatherId, name: cat.name, color: cat.color, icon: cat.icon }
      : { category: cat._id, subCategory: "", name: cat.name, color: cat.color, icon: cat.icon };
    setForm((prev) => {
      const exists = prev.categories.some((c) => fatherId
        ? String(c.subCategory) === String(cat._id)
        : String(c.category) === String(cat._id) && !c.subCategory);
      const categories = exists ? prev.categories : [...prev.categories, entry];
      return { ...prev, categories, category: categories[0]?.category || "", subCategory: categories[0]?.subCategory || "" };
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      setIsLoading(true);
      const isSpending = form.budgetType === BUDGET_TYPES.SPENDING;
      const isSaving = form.budgetType === BUDGET_TYPES.SAVING;
      const isProject = form.budgetType === BUDGET_TYPES.PROJECT;
      const payload = {
        name: form.name, goalAmount: Number(form.goalAmount), savingAmount: isSaving ? Number(form.savingAmount) || 0 : 0,
        budgetType: form.budgetType, isSaving, period: isSpending ? form.period : "monthly",
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
        ? await toFetch.post("general-data/budget/update", { ...payload, id: budget._id })
        : await toFetch.post("general-data/budget/new", { ...payload, user: budget?.user, wallet: budget?.wallet });

      if (!res.ok || !res.data) throw new Error(res.message || "Operation failed 🤕");
      if (mode === "edition") dispatch(updateBudget(res.data));
      else dispatch(addNewBudget(res.data));

      if (mode === "creation" && isProject && budget?.draftTransactions?.length) {
        const linked = await Promise.all(budget.draftTransactions.map((transaction) =>
          toFetch.post("general-data/transactions/link-budget", { transactionId: transaction._id, budgetId: res.data._id })
        ));
        linked.filter((item) => item.ok && item.data).forEach((item) => dispatch(updateTransaction(item.data)));
      }
      runNotify("ok", res.message);
      onClose();
    } catch (err) {
      runNotify("error", err?.message || String(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsLoading(true);
      const res = await toFetch.post("general-data/budget/remove", { id: budget._id });
      if (!res.ok) throw new Error(res.message || "Could not delete budget");
      dispatch(removeBudget(budget._id));
      if (getBudgetType(budget) === BUDGET_TYPES.PROJECT) {
        transacciones
          .filter((transaction) => String(transaction.budget?._id || transaction.budget || "") === String(budget._id))
          .forEach((transaction) => dispatch(updateTransaction({ ...transaction, budget: null })));
      }
      runNotify("ok", res.message);
      onClose();
    } catch (err) {
      runNotify("error", err?.message || String(err));
    } finally { setIsLoading(false); }
  };

  const isProject = form.budgetType === BUDGET_TYPES.PROJECT;
  const isSaving = form.budgetType === BUDGET_TYPES.SAVING;
  const isSpending = form.budgetType === BUDGET_TYPES.SPENDING;

  return <BasicModal close={onClose} renderContent={
    <div className="content absolute bg-purple-600 border-2 border-purple-600 flex flex-col w-[94vw] max-w-[500px] max-h-[92vh] overflow-hidden rounded-3xl z-[1001] shadow-2xl">
      {isLoading && <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex justify-center items-center z-[1002]"><Spin size="large" /></div>}
      <div className="relative pt-6 pb-5 px-4 text-center text-white shrink-0">
        {onBack && <button type="button" onClick={onBack} className="absolute top-4 left-4 text-purple-700 bg-white rounded-full py-1 px-3 text-xs font-semibold">← Back</button>}
        <button type="button" onClick={onClose} className="absolute top-4 right-4 rounded-full bg-white text-purple-700 p-1"><CategoIcon type="MdClose" siz={18} /></button>
        <h1 className="text-2xl font-bold">{mode === "edition" ? "Edit" : "Create"} {isProject ? "Project" : "Budget"} 🪄</h1>
      </div>
      <div className="bg-slate-50 rounded-t-[40px] flex-1 overflow-y-auto px-6 sm:px-8 pt-6 pb-8">
        <form onSubmit={handleSubmit} className="form-trans-edit flex flex-col gap-3">
          <p className="label-tfp">Name</p>
          <input type="text" name="name" value={form.name} onChange={handleChange} placeholder={isProject ? "e.g. Japan 2027" : "Budget name"} required className="w-full" />
          {mode === "creation" && Number(budget?.referenceSpent) > 0 && <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">You already spent <strong>{usdFormatChanger(budget.referenceSpent)}</strong>. The linked movements will count toward this project.</p>}

          <p className="label-tfp mt-1">Type</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {typeOptions.map((option) => <button key={option.value} type="button" onClick={() => setForm((prev) => ({ ...prev, budgetType: option.value }))} className={`text-left rounded-2xl border p-3 transition-colors ${form.budgetType === option.value ? "border-purple-500 bg-purple-50 text-purple-900" : "border-gray-200 bg-white text-gray-600 hover:border-purple-200"}`}>
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
                className="h-10 shrink-0 bg-purple-50 border border-purple-300 text-purple-800 text-xs font-semibold rounded-full px-3 cursor-pointer outline-none"
              >
                {SUPPORTED_CURRENCIES.map((code) => (
                  <option key={code} value={code}>
                    {code} ({CURRENCY_META[code].symbol})
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
              return <button key={acc._id} type="button" onClick={() => toggleListValue("linkedAccounts", acc._id)} className={`flex justify-between rounded-xl border px-3 py-2 text-xs ${selected ? "bg-blue-600 border-blue-600 text-white" : "bg-white border-gray-200"}`}><span>{acc.name}</span><strong>{formatMoneyMajor(acc.amount || 0, acc.currency || walletPrimaryCurrency, { showCode: true })}</strong></button>;
            }) : <p className="text-xs text-gray-400 italic">No accounts available</p>}</div>
          </>}

          {isProject && <div className="flex flex-col gap-3 bg-white border border-purple-100 rounded-2xl p-4 mt-1">
            <div>
              <p className="label-tfp mb-1">Project icon</p>
              <button
                type="button"
                onClick={() => setIsIconMenuOpen(true)}
                className="w-full flex items-center gap-3 rounded-2xl border-2 border-purple-300 bg-purple-50 px-3 py-2 text-left hover:border-purple-500 transition-colors"
              >
                <span className="w-10 h-10 rounded-full bg-white text-purple-700 flex items-center justify-center shadow-sm shrink-0">
                  <UniversalCategoIcon type={form.icon || DEFAULT_PROJECT_ICON} siz={24} />
                </span>
                <span><span className="block text-xs font-bold text-purple-900">Selected icon</span><span className="block text-[10px] text-gray-500">Click to choose another icon</span></span>
              </button>
              <IconDisplayerMenu
                idmActive={isIconMenuOpen}
                idmIcon={(icon) => setForm((prev) => ({ ...prev, icon }))}
                idmClose={setIsIconMenuOpen}
              />
            </div>
            <div><p className="font-bold text-sm text-purple-900">Project window</p><p className="text-[11px] text-gray-500">Informational and fully editable. Linked expenses count even if their purchase date falls outside this window.</p></div>
            <TimeRange
              startDateValue={localDateFromInput(form.eventStartDate)}
              endDateValue={localDateFromInput(form.eventEndDate)}
              rpDate={(start, end) => setForm((prev) => ({
                ...prev,
                eventStartDate: inputValueFromLocalDate(start),
                eventEndDate: inputValueFromLocalDate(end),
              }))}
              rpResponse=""
              styles="w-full flex items-center justify-center gap-1 bg-slate-100 border border-purple-100 px-2 py-2 rounded-full"
            />
            <div><p className="label-tfp">Related tags (suggestions only)</p><p className="text-[10px] text-gray-400 mb-2">Tags help find candidate movements. They never add spending automatically.</p>
              {availableTags.length ? <div className="flex flex-wrap gap-1.5">{availableTags.map((tag) => {
                const selected = form.linkedTags.includes(String(tag._id));
                return <button key={tag._id} type="button" onClick={() => toggleListValue("linkedTags", tag._id)} className={`rounded-full px-2.5 py-1 text-xs border ${selected ? "bg-purple-600 border-purple-600 text-white" : "bg-slate-50 border-gray-200 text-gray-600"}`}>#{tag.name}</button>;
              })}</div> : <p className="text-xs text-gray-400 italic">No tags found in your movements yet.</p>}
            </div>
          </div>}

          {isSpending && <>
            <p className="label-tfp mt-1">Time Period</p>
            <select name="period" value={form.period} onChange={handleChange} className="etm-selector bg-white"><option value="monthly">Monthly</option><option value="quarterly">Quarterly (3 months)</option><option value="biannual">Biannual (6 months)</option><option value="yearly">Yearly (12 months)</option></select>
            <p className="label-tfp mt-1">Categories ({form.categories.length})</p>
            {!!form.categories.length && <div className="flex flex-wrap gap-1.5">{form.categories.map((c, index) => <div key={`${c.category}:${c.subCategory}:${index}`} className="flex items-center gap-1 bg-purple-100 text-purple-800 rounded-full px-2.5 py-1 text-xs"><span>{c.name}</span><button type="button" onClick={() => setForm((prev) => ({ ...prev, categories: prev.categories.filter((_, i) => i !== index) }))}>×</button></div>)}</div>}
            {!!categoryConflicts.length && <div className="bg-amber-50 border border-amber-300 text-amber-900 rounded-2xl px-3 py-2 text-xs"><p className="font-bold">This coverage already exists</p><p>Also covered by {categoryConflicts.map((item) => item.name || "Unnamed budget").join(", ")}.</p></div>}
            <BtnSelectCategoryContext onClose={handleClose} />
            {close && <BasicModal close={handleClose} renderContent={<ModalCategoryContent close={handleClose} getSelected={handleCategory} />} />}
          </>}

          {mode === "edition" && <button type="button" onClick={handleDelete} className="text-red-500 underline hover:text-red-800 mt-2">Delete this {isProject ? "project" : "budget"}</button>}
          <input type="submit" value={`${mode === "edition" ? "Update" : "Create"} ${isProject ? "Project" : "Budget"}`} className="mt-3 cursor-pointer w-full" />
        </form>
      </div>
    </div>
  } />;
}

export default function BudgetEditModal(props) {
  return <SelectCategories><BudgetEditForm {...props} /></SelectCategories>;
}
