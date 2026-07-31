"use client";

import React, { useContext, useEffect, useState } from "react";
import { Spin, Switch, Tooltip } from "antd";
import { useDispatch, useSelector } from "react-redux";
import fetcher from "@/helpers/fetcher";
import runNotify from "@/helpers/gastifyNotifier";
import CategoIcon from "../CategoIcon";
import UniversalCategoIcon from "../UniversalCategoIcon";
import SelectCategories from "@/components/categories/SelectCategoryProvider/SelectCategories";
import { SelectCategoryContext } from "@/components/categories/SelectCategoryProvider/SelectCategoryProvider";
import BtnSelectCategoryContext from "@/components/buttons/buttonWrappers/selectBtnCategoryWithContext.jsx/BtnSelectCategoryContext";
import BasicModal from "@/components/modals/basicModal/BasicModal";
import ModalCategoryContent from "@/components/modals/contents/selectCategory/ModalCategoryContent";
import useModal from "@/hooks/useModalBasic";
import { addNewBudget, updateBudget, removeBudget } from "@/lib/features/budgetSlice";
import { usdFormatChanger } from "@/helpers/transformers/transactionsChange";

function BudgetEditForm({ mode, budget, onClose, onBack }) {
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    goalAmount: "",
    savingAmount: "",
    isSaving: false,
    category: "",
    subCategory: "",
    period: "monthly",
    categories: [],
    linkedAccounts: [],
  });
  const toFetch = fetcher();
  const dispatch = useDispatch();
  const { close, handleClose } = useModal();
  const { setItemSelected } = useContext(SelectCategoryContext);
  const ccAccounts = useSelector((state) => state.accountsReducer?.data || []);

  useEffect(() => {
    if (mode === "edition" && budget) {
      let initialCategories = [];
      if (budget.categories && Array.isArray(budget.categories) && budget.categories.length > 0) {
        initialCategories = budget.categories.map((c) => ({
          category: c.category?._id || c.category || "",
          subCategory: c.subCategory?._id || c.subCategory || "",
          name: (c.subCategory || c.category)?.name || "Category",
          color: (c.subCategory || c.category)?.color || "#DADADA",
          icon: (c.subCategory || c.category)?.icon || null,
        }));
      } else if (budget.subCategory || budget.category) {
        const catObj = budget.subCategory || budget.category;
        initialCategories = [
          {
            category: budget.category?._id || budget.category || "",
            subCategory: budget.subCategory?._id || budget.subCategory || "",
            name: catObj?.name || "Category",
            color: catObj?.color || "#DADADA",
            icon: catObj?.icon || null,
          },
        ];
      }
      setForm({
        name: budget.name || "",
        goalAmount: budget.goalAmount || "",
        savingAmount: budget.savingAmount || "",
        isSaving: budget.isSaving || false,
        category: typeof budget.category === "object" ? budget.category?._id : budget.category || "",
        subCategory: typeof budget.subCategory === "object" ? budget.subCategory?._id : budget.subCategory || "",
        period: budget.period || "monthly",
        categories: initialCategories,
        linkedAccounts: budget.linkedAccounts
          ? budget.linkedAccounts.map((a) => String(typeof a === "object" && a !== null ? a._id || a : a))
          : [],
      });
      setItemSelected(budget.subCategory || budget.category || null);
    }
  }, [mode, budget, setItemSelected]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleIsSavingToggle = (checked) => {
    setForm((prev) => ({ ...prev, isSaving: checked }));
  };

  const toggleLinkedAccount = (accId) => {
    const targetId = String(accId);
    setForm((prev) => {
      const exists = prev.linkedAccounts.some((id) => String(id) === targetId);
      const updated = exists
        ? prev.linkedAccounts.filter((id) => String(id) !== targetId)
        : [...prev.linkedAccounts, targetId];
      return { ...prev, linkedAccounts: updated };
    });
  };

  const handleCategory = (cat) => {
    const fatherId = cat.isSub
      ? typeof cat.fatherCategory === "object"
        ? cat.fatherCategory?._id
        : cat.fatherCategory
      : null;
    const newEntry = fatherId
      ? { subCategory: cat._id, category: fatherId, name: cat.name, color: cat.color, icon: cat.icon }
      : { category: cat._id, subCategory: "", name: cat.name, color: cat.color, icon: cat.icon };

    const exists = form.categories.some((c) =>
      fatherId
        ? String(c.subCategory) === String(cat._id)
        : String(c.category) === String(cat._id) && !c.subCategory
    );
    const nextCategories = exists ? form.categories : [...form.categories, newEntry];

    setForm((prev) => ({
      ...prev,
      categories: nextCategories,
      category: nextCategories[0]?.category || "",
      subCategory: nextCategories[0]?.subCategory || "",
    }));
  };

  const handleRemoveCategoryChip = (index) => {
    const nextCategories = form.categories.filter((_, idx) => idx !== index);
    setForm((prev) => ({
      ...prev,
      categories: nextCategories,
      category: nextCategories[0]?.category || "",
      subCategory: nextCategories[0]?.subCategory || "",
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      const payload = {
        name: form.name,
        goalAmount: Number(form.goalAmount),
        savingAmount: Number(form.savingAmount) || 0,
        isSaving: form.isSaving,
        category: form.categories[0]?.category || null,
        subCategory: form.categories[0]?.subCategory || null,
        categories: form.categories.map((c) => ({
          category: c.category || null,
          subCategory: c.subCategory || null,
        })),
        period: form.period || "monthly",
        linkedAccounts: form.linkedAccounts || [],
      };
      let res;
      if (mode === "edition") {
        res = await toFetch.post("general-data/budget/update", {
          ...payload,
          id: budget._id,
        });
      } else {
        res = await toFetch.post("general-data/budget/new", {
          ...payload,
          user: budget?.user,
          wallet: budget?.wallet,
        });
      }

      if (res.ok && res.data) {
        runNotify("ok", res.message);
        if (mode === "edition") {
          dispatch(updateBudget(res.data));
        } else {
          dispatch(addNewBudget(res.data));
        }
        onClose();
      } else {
        runNotify("error", res.message || "Operation failed 🤕");
      }
    } catch (err) {
      runNotify("error", String(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsLoading(true);
      const res = await toFetch.post("general-data/budget/remove", { id: budget._id });
      if (res.ok) {
        runNotify("ok", res.message);
        dispatch(removeBudget(budget._id));
        onClose();
      }
    } catch (err) {
      runNotify("error", String(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <BasicModal
      close={onClose}
      renderContent={
        <div className="content absolute bg-purple-600 border-2 border-purple-600 flex flex-col w-[380px] max-h-[90vh] overflow-hidden rounded-3xl z-[1001] shadow-2xl">
          <div
            className={`${isLoading ? "absolute" : "hidden"} top-0 left-0 bg-white/70 backdrop-blur-sm flex justify-center items-center w-full h-full z-[1001]`}
          >
            <Spin size="large" />
          </div>
          {/* Header (purple background, no scroll) */}
          <div className="w-full relative pt-6 pb-5 px-4 flex flex-col items-center justify-center shrink-0">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="absolute top-4 left-4 text-purple-700 hover:bg-purple-100 rounded-full py-1 px-3 transition-colors cursor-pointer flex items-center gap-1 text-xs font-semibold border border-purple-200 bg-white shadow-xs z-10"
                title="Back to budget details"
              >
                <span>← Back</span>
              </button>
            )}
            <div
              className="absolute top-4 right-4 border-2 rounded-full bg-slate-50 text-purple-700 p-1 cursor-pointer hover:bg-white transition-colors"
              onClick={onClose}
            >
              <CategoIcon type={"MdClose"} siz={18} />
            </div>
            <h1 className="text-center text-2xl font-bold text-white mt-1">
              {mode === "edition" ? "Edit" : "Create"} Budget 🪄
            </h1>
          </div>

          {/* Form wrapper (white/slate-50 background, scrollbar inside, no purple footer) */}
          <div className="w-full bg-slate-50 rounded-t-[40px] flex-1 overflow-y-auto px-8 pt-6 pb-8">
            <form
              onSubmit={handleSubmit}
              className="w-full flex flex-col gap-3 items-start justify-start"
            >
              <p className="label-tfp">Name</p>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Budget name"
                required
                className="w-full"
              />
              <div className="flex items-center gap-2 w-full mt-1">
                <Switch checked={form.isSaving} onChange={handleIsSavingToggle} />
                <p className="label-tfp">This is a savings goal</p>
              </div>
              <p className="label-tfp mt-1">
                {form.isSaving ? "Savings target" : "Spending limit"}
              </p>
              <input
                type="number"
                name="goalAmount"
                value={form.goalAmount}
                onChange={handleChange}
                required
                className="w-full"
              />
              {form.isSaving && (
                <>
                  <p className="label-tfp mt-1">Current amount saved (manual)</p>
                  <input
                    type="number"
                    name="savingAmount"
                    value={form.savingAmount}
                    onChange={handleChange}
                    placeholder="0"
                    className="w-full"
                  />
                  <div className="w-full mt-2">
                    <div className="flex items-center gap-1.5 mb-1">
                      <p className="label-tfp mb-0">🔗 Or link Account(s) balance:</p>
                      <Tooltip
                        title={
                          <div className="text-xs leading-relaxed">
                            <p className="font-bold mb-1">How Linking Accounts Works:</p>
                            <p className="mb-1">
                              • <strong>What it does:</strong> Automatically sums the current balances of the selected account(s) and uses that total as your saved amount for this goal.
                            </p>
                            <p className="mb-1">
                              • <strong>What it does NOT do:</strong> It does not withdraw money, lock funds, or create transactions. It only reads the balance to track your progress in real time.
                            </p>
                            <p>
                              • <strong>Manual mode:</strong> If no account is linked, you can manually enter your saved amount above.
                            </p>
                          </div>
                        }
                      >
                        <div className="text-purple-500 hover:text-purple-700 cursor-pointer transition-colors">
                          <UniversalCategoIcon type="fa/FaRegQuestionCircle" siz={15} />
                        </div>
                      </Tooltip>
                    </div>
                    {ccAccounts.length === 0 ? (
                      <p className="text-xs text-gray-400 italic">No accounts available</p>
                    ) : (
                      <div className="flex flex-col gap-2 w-full mt-1.5">
                        {ccAccounts.map((acc) => {
                          const isSelected = form.linkedAccounts.some(
                            (id) => String(id) === String(acc._id)
                          );
                          return (
                            <div
                              key={acc._id}
                              onClick={() => toggleLinkedAccount(acc._id)}
                              title={`${acc.name || "Account"} • ${usdFormatChanger(acc.amount || 0)}`}
                              className={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl text-xs font-medium border transition-all cursor-pointer select-none overflow-hidden ${
                                isSelected
                                  ? "bg-blue-600 text-white border-blue-600 shadow-sm hover:bg-blue-700"
                                  : "bg-white text-gray-700 border-gray-200 hover:bg-gray-100"
                              }`}
                            >
                              <span className="truncate min-w-0 flex-1 text-left">
                                {acc.name || "Account"}
                              </span>
                              <div className="flex items-center gap-2 shrink-0">
                                <span
                                  className={`font-bold ${
                                    isSelected ? "text-white" : "text-purple-700"
                                  }`}
                                >
                                  {usdFormatChanger(acc.amount || 0)}
                                </span>
                                {isSelected && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleLinkedAccount(acc._id);
                                    }}
                                    className="w-5 h-5 rounded-full bg-blue-800 text-white hover:bg-red-600 hover:text-white flex items-center justify-center font-bold text-xs transition-colors shrink-0 ml-0.5"
                                    title="Unlink this account"
                                  >
                                    ×
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {form.linkedAccounts.length > 0 && (
                      <p className="text-xs text-blue-700 font-semibold mt-1.5">
                        Total synced balance:{" "}
                        {usdFormatChanger(
                          ccAccounts
                            .filter((a) =>
                              form.linkedAccounts.some((id) => String(id) === String(a._id))
                            )
                            .reduce((sum, a) => sum + (Number(a.amount) || 0), 0)
                        )}
                      </p>
                    )}
                  </div>
                </>
              )}
              <p className="label-tfp mt-1">Time Period</p>
              <select
                name="period"
                value={form.period}
                onChange={handleChange}
                className="w-full p-2 rounded-xl border border-gray-300 bg-white"
              >
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly (3 months)</option>
                <option value="biannual">Biannual (6 months)</option>
                <option value="yearly">Yearly (12 months)</option>
              </select>

              <p className="label-tfp mt-1">Categories ({form.categories.length})</p>
              {form.categories.length > 0 && (
                <div className="flex flex-wrap gap-1.5 w-full mb-1">
                  {form.categories.map((c, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-1 bg-purple-100 text-purple-800 rounded-full px-2.5 py-1 text-xs font-medium"
                    >
                      <span>{c.name}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveCategoryChip(idx)}
                        className="hover:text-red-600 font-bold ml-1"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <BtnSelectCategoryContext onClose={handleClose} />
              {close && (
                <BasicModal
                  close={handleClose}
                  renderContent={
                    <ModalCategoryContent close={handleClose} getSelected={handleCategory} />
                  }
                />
              )}
              {mode === "edition" && (
                <div
                  className="w-full text-red-500 flex justify-center items-center p-1 underline cursor-pointer hover:text-red-800 mt-2"
                  onClick={handleDelete}
                >
                  Delete this budget
                </div>
              )}
              <input
                type="submit"
                value={mode === "edition" ? "Update Budget" : "Create Budget"}
                className="mt-4 cursor-pointer w-full"
              />
            </form>
          </div>
        </div>
      }
    />
  );
}

function BudgetEditModal(props) {
  return (
    <SelectCategories>
      <BudgetEditForm {...props} />
    </SelectCategories>
  );
}

export default BudgetEditModal;
