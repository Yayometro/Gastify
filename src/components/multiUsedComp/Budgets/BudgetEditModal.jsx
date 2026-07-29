"use client";

import React, { useContext, useEffect, useState } from "react";
import { Spin, Switch } from "antd";
import { useDispatch } from "react-redux";
import fetcher from "@/helpers/fetcher";
import runNotify from "@/helpers/gastifyNotifier";
import CategoIcon from "../CategoIcon";
import SelectCategories from "@/components/categories/SelectCategoryProvider/SelectCategories";
import { SelectCategoryContext } from "@/components/categories/SelectCategoryProvider/SelectCategoryProvider";
import BtnSelectCategoryContext from "@/components/buttons/buttonWrappers/selectBtnCategoryWithContext.jsx/BtnSelectCategoryContext";
import BasicModal from "@/components/modals/basicModal/BasicModal";
import ModalCategoryContent from "@/components/modals/contents/selectCategory/ModalCategoryContent";
import useModal from "@/hooks/useModalBasic";
import { addNewBudget, updateBudget, removeBudget } from "@/lib/features/budgetSlice";

function BudgetEditForm({ mode, budget, onClose }) {
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    goalAmount: "",
    savingAmount: "",
    isSaving: false,
    category: "",
    subCategory: "",
  });
  const toFetch = fetcher();
  const dispatch = useDispatch();
  const { close, handleClose } = useModal();
  const { setItemSelected } = useContext(SelectCategoryContext);

  useEffect(() => {
    if (mode === "edition" && budget) {
      setForm({
        name: budget.name || "",
        goalAmount: budget.goalAmount || "",
        savingAmount: budget.savingAmount || "",
        isSaving: budget.isSaving === true,
        category: budget.category?._id || "",
        subCategory: budget.subCategory?._id || "",
      });
      const preselected = budget.subCategory
        ? { ...budget.subCategory, isSub: true }
        : budget.category || null;
      if (preselected) setItemSelected(preselected);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, budget]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleIsSavingToggle = (checked) => {
    setForm({ ...form, isSaving: checked });
  };

  const handleCategory = (cat) => {
    if (!cat) return;
    const fatherId = cat?.fatherCategory
      ? typeof cat.fatherCategory === "object"
        ? cat.fatherCategory?._id
        : cat.fatherCategory
      : null;
    if (fatherId) {
      setForm({ ...form, subCategory: cat._id, category: fatherId });
    } else {
      setForm({ ...form, category: cat._id, subCategory: "" });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      let res;
      if (mode === "edition") {
        res = await toFetch.post("general-data/budget/update", {
          id: budget._id,
          name: form.name,
          goalAmount: Number(form.goalAmount),
          savingAmount: Number(form.savingAmount) || 0,
          isSaving: form.isSaving,
          category: form.category || null,
          subCategory: form.subCategory || null,
        });
      } else {
        res = await toFetch.post("general-data/budget/new", {
          user: budget?.user,
          wallet: budget?.wallet,
          name: form.name,
          goalAmount: Number(form.goalAmount),
          savingAmount: Number(form.savingAmount) || 0,
          isSaving: form.isSaving,
          category: form.category || null,
          subCategory: form.subCategory || null,
        });
      }
      if (res.ok) {
        runNotify("ok", res.message);
        dispatch(mode === "edition" ? updateBudget(res.data) : addNewBudget([res.data]));
        onClose();
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
    <div className="fixed top-0 left-0 w-full h-full z-[1000] bg-white/10 backdrop-blur-sm flex items-center justify-center">
      <div className="content bg-purple-600 border-2 border-purple-600 flex flex-col w-[350px] max-h-[90vh] overflow-y-auto relative rounded-2xl items-center justify-center pt-[40px] pb-6">
        <div
          className={`${isLoading ? "absolute" : "hidden"} top-0 left-0 bg-white/70 backdrop-blur-sm flex justify-center items-center w-full h-full z-[1001]`}
        >
          <Spin size="large" />
        </div>
        <h1 className="text-center py-[20px] text-2xl text-white">
          {mode === "edition" ? "Edit" : "Create"} Budget 🪄
        </h1>
        <form
          onSubmit={handleSubmit}
          className="form-trans-edit w-[100%] h-full flex flex-col gap-2 items-start justify-start px-10 bg-slate-50 rounded-t-[60px] pt-[30px] pb-10"
        >
          <div
            className="close-con absolute top-[0%] right-[0%] border-2 rounded-full bg-slate-50 text-purple-700 m-1 pulse-animation-short cursor-pointer"
            onClick={onClose}
          >
            <CategoIcon type={"MdClose"} siz={20} />
          </div>
          <p className="label-tfp">Name</p>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Budget name"
            required
          />
          <div className="flex items-center gap-2 w-full">
            <Switch checked={form.isSaving} onChange={handleIsSavingToggle} />
            <p className="label-tfp">This is a savings goal</p>
          </div>
          <p className="label-tfp">
            {form.isSaving ? "Savings target" : "Spending limit"}
          </p>
          <input
            type="number"
            name="goalAmount"
            value={form.goalAmount}
            onChange={handleChange}
            required
          />
          {form.isSaving && (
            <>
              <p className="label-tfp">Current amount saved</p>
              <input
                type="number"
                name="savingAmount"
                value={form.savingAmount}
                onChange={handleChange}
              />
            </>
          )}
          <p className="label-tfp">Category</p>
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
              className="w-full text-red-500 flex justify-center items-center p-1 underline cursor-pointer hover:text-red-800"
              onClick={handleDelete}
            >
              Remove budget
            </div>
          )}
          <button
            className="w-full p-2 bg-purple-600 text-white text-center rounded-full mt-3 hover:bg-purple-500"
            type="submit"
          >
            {isLoading ? <Spin /> : "Submit"}
          </button>
        </form>
      </div>
    </div>
  );
}

function BudgetEditModal({ mode, budget, onClose }) {
  return (
    <SelectCategories>
      <BudgetEditForm mode={mode} budget={budget} onClose={onClose} />
    </SelectCategories>
  );
}

export default BudgetEditModal;
