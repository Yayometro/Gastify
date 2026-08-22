"use client";

import { useState, useEffect, useContext } from "react";
import { createPortal } from "react-dom";
import { Switch, ConfigProvider, Space, Spin } from "antd";
import dayjs from "dayjs";
import { DemoContainer, DemoItem } from "@mui/x-date-pickers/internals/demo";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { MobileDateTimePicker } from "@mui/x-date-pickers/MobileDateTimePicker";
import { useDispatch } from "react-redux";
import fetcher from "@/helpers/fetcher";
import runNotify from "@/helpers/gastifyNotifier";
import { updateTransaction } from "@/lib/features/transacctionsSlice";
import SelectCategories from "../categories/SelectCategoryProvider/SelectCategories";
import { SelectCategoryContext } from "../categories/SelectCategoryProvider/SelectCategoryProvider";
import BtnSelectCategoryContext from "../buttons/buttonWrappers/selectBtnCategoryWithContext.jsx/BtnSelectCategoryContext";
import BasicModal from "../modals/basicModal/BasicModal";
import ModalCategoryContent from "../modals/contents/selectCategory/ModalCategoryContent";
import useModal from "@/hooks/useModalBasic";
import useGetDataFromProvider from "@/hooks/getAllInfo/useGetInfoFromProvider";
import CategoIcon from "./CategoIcon";
import { isProjectBudget } from "@/helpers/transformers/budgetTypes";
import "@/components/multiUsedComp/css/muliUsed.css";
import useTransactionAmountEquivalent from "@/hooks/money/useTransactionAmountEquivalent";
import AmountEquivalentPreview from "./AmountEquivalentPreview";

const CURRENCY_STRATEGIES = [
  { value: "convert", label: "Convert", description: "Recalculate the amount to preserve the same reported value." },
  { value: "reinterpret", label: "Keep number", description: "Keep the same number, just relabel the currency." },
  { value: "manual", label: "Enter manually", description: "Type the exact amount in the new currency." },
];

function EditSingleTransModalInner({ trans, onClose }) {
  const dispatch = useDispatch();
  const toFetch = fetcher();
  const [isLoading, setIsLoading] = useState(false);
  const { close, handleClose } = useModal();
  const { handleClean, setItemSelected } = useContext(SelectCategoryContext);
  const { wallet, accounts, categories, subCategories, budgets = [] } = useGetDataFromProvider();
  const projectBudgets = budgets.filter((budget) => !budget.archived && isProjectBudget(budget));
  const [currencyStrategy, setCurrencyStrategy] = useState(null);

  const [form, setForm] = useState({
    name: "",
    amount: "",
    isIncome: false,
    isBill: true,
    isReadable: false,
    date: new Date(),
    category: "",
    subCategory: "",
    tags: "",
    account: "",
    budget: "",
  });

  useEffect(() => {
    if (trans) {
      setForm({
        name: trans.name || "",
        amount: trans.amount ?? "",
        isIncome: trans.isIncome ?? false,
        isBill: trans.isBill ?? true,
        isReadable: trans.isReadable ?? false,
        date: trans.date ? new Date(trans.date) : new Date(),
        category: trans.category?._id || trans.category || "",
        subCategory: trans.subCategory?._id || trans.subCategory || "",
        tags: trans.tags?.map((t) => (typeof t === "string" ? t : t.name)).join(", ") || "",
        account: trans.account?._id || trans.account || "",
        budget: trans.budget?._id || trans.budget || "",
      });

      const subCatId = trans.subCategory?._id || trans.subCategory;
      const catId = trans.category?._id || trans.category;

      if (subCatId && subCategories?.length) {
        const found = subCategories.find((s) => String(s._id) === String(subCatId));
        if (found) { setItemSelected(found); return; }
      }
      if (catId && categories?.length) {
        const found = categories.find((c) => String(c._id) === String(catId));
        if (found) setItemSelected(found);
      }
    }
  }, [trans, categories, subCategories]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Multi-currency: an Account reassignment that crosses currencies needs an
  // explicit, user-chosen strategy - the server refuses to infer one.
  const originalAccountCurrency = trans?.money?.account?.currency || wallet?.primaryCurrency || "MXN";
  const selectedAccountCurrency =
    accounts?.find((acc) => acc._id === form.account)?.currency || wallet?.primaryCurrency || "MXN";
  const needsCurrencyStrategy = Boolean(form.account) && selectedAccountCurrency !== originalAccountCurrency;

  useEffect(() => {
    setCurrencyStrategy(null);
  }, [form.account]);

  const amountEquivalent = useTransactionAmountEquivalent({
    amount: form.amount,
    accountCurrency: selectedAccountCurrency,
    walletPrimaryCurrency: wallet?.primaryCurrency,
  });

  const onChangeSwitch = (checked, type) => {
    if (type === "income") setForm((p) => ({ ...p, isIncome: checked, isBill: !checked }));
    else if (type === "bill") setForm((p) => ({ ...p, isBill: checked, isIncome: !checked }));
    else if (type === "readable") setForm((p) => ({ ...p, isReadable: checked }));
  };

  const handleCategory = (cat) => {
    if (!cat) return;
    const fatherId = cat?.fatherCategory
      ? (typeof cat.fatherCategory === "object" ? cat.fatherCategory?._id : cat.fatherCategory)
      : null;
    if (fatherId) {
      setForm((p) => ({ ...p, subCategory: cat._id, category: fatherId }));
    } else {
      setForm((p) => ({ ...p, category: cat._id, subCategory: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (needsCurrencyStrategy && !currencyStrategy) {
      runNotify("error", "Choose how to handle the currency change before saving");
      return;
    }
    setIsLoading(true);
    const tagsArr = form.tags
      ? form.tags.split(",").map((t) => t.trim()).filter(Boolean)
      : [];
    const payload = {
      ...form,
      name: form.name.trim(),
      tags: tagsArr,
      ...(needsCurrencyStrategy ? { currencyStrategy } : {}),
    };
    try {
      const response = await toFetch.post(`general-data/transactions/${trans._id}`, payload);
      if (response.data) {
        runNotify("ok", response.message);
        dispatch(updateTransaction(response.data));
        handleClean();
        setIsLoading(false);
        onClose();
      } else {
        runNotify("error", response.message || "Something went wrong");
        setIsLoading(false);
      }
    } catch (e) {
      runNotify("error", String(e));
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed top-0 left-0 w-full h-full z-[10000] bg-white/10 backdrop-blur-sm flex items-center justify-center">
      <div className="content bg-purple-600 border-2 border-purple-600 flex flex-col w-full max-w-[500px] max-h-[90vh] relative rounded-2xl items-center justify-center pt-[40px] overflow-hidden">
        {isLoading && (
          <div className="absolute top-0 left-0 bg-white/70 flex justify-center items-center w-full h-full z-[10001]">
            <Spin size="large" />
          </div>
        )}

        <h1 className="text-center py-[10px] text-2xl text-white">Edit Transaction ✏️</h1>

        <form
          onSubmit={handleSubmit}
          className="form-trans-edit w-full h-full flex flex-col gap-2 items-start justify-start px-10 bg-slate-50 rounded-t-[60px] pt-[30px] pb-20 overflow-y-scroll"
        >
          <p className="label-tfp">Name</p>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Transaction name"
          />

          <p className="label-tfp">Amount ({needsCurrencyStrategy ? selectedAccountCurrency : originalAccountCurrency})</p>
          <input
            type="number"
            name="amount"
            value={form.amount}
            onChange={handleChange}
            placeholder="Amount"
          />
          <AmountEquivalentPreview quote={amountEquivalent} />

          <div className="switchers-cont flex gap-3">
            <ConfigProvider theme={{ token: { colorPrimary: "#9700FF", borderRadius: 2, colorBgContainer: "#9700FF" } }}>
              <Space direction="" size={12}>
                <div className="switch-int-cont">
                  <p className="label-tfp">Is Income:</p>
                  <Switch onChange={(v) => onChangeSwitch(v, "income")} value={form.isIncome} />
                </div>
                <div className="switch-int-cont">
                  <p className="label-tfp">Is Bill:</p>
                  <Switch onChange={(v) => onChangeSwitch(v, "bill")} value={form.isBill} />
                </div>
                <div className="switch-int-cont">
                  <p className="label-tfp">Is Readable:</p>
                  <Switch onChange={(v) => onChangeSwitch(v, "readable")} value={form.isReadable} />
                </div>
              </Space>
            </ConfigProvider>
          </div>

          <p className="label-tfp">Date</p>
          <div className="date-container w-full h-[100px]">
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DemoContainer components={["MobileDateTimePicker"]}>
                <DemoItem label="">
                  <MobileDateTimePicker
                    slotProps={{
                      textField: { size: "small" },
                      dialog: { sx: { zIndex: 35000 } },
                      mobilePaper: { sx: { zIndex: 35000 } },
                    }}
                    value={dayjs(form.date)}
                    onChange={(v) => setForm((p) => ({ ...p, date: new Date(v.format()) }))}
                    sx={{
                      "& .MuiInputBase-root": { width: "100%", padding: "0px", border: "none", borderRadius: "12px" },
                      "& .MuiInputBase-input": { border: "1px solid rgb(176,23,176)", borderRadius: "12px", padding: "8px 12px" },
                      "& .MuiOutlinedInput-notchedOutline": { borderRadius: "12px" },
                    }}
                  />
                </DemoItem>
              </DemoContainer>
            </LocalizationProvider>
          </div>

          <p className="label-tfp">Category</p>
          <BtnSelectCategoryContext onClose={handleClose} />
          {close && (
            <BasicModal
              close={handleClose}
              zIndexClass="z-[20000]"
              renderContent={<ModalCategoryContent close={handleClose} getSelected={handleCategory} />}
            />
          )}

          <p className="label-tfp">Tags</p>
          <input
            type="text"
            name="tags"
            value={form.tags}
            onChange={handleChange}
            placeholder="Tags (separated by comma)"
          />

          <p className="label-tfp">Account</p>
          <div className="etm-selector bg-white text-black w-full flex items-center justify-center px-[4px] py-[2px]">
            <select
              className="bg-transparent appearance-none w-full pr-4"
              value={form.account || ""}
              onChange={(e) => setForm((p) => ({ ...p, account: e.target.value || null }))}
            >
              <option value="">No account</option>
              {accounts?.map((acc) => (
                <option value={acc._id} key={acc._id}>{acc.name}</option>
              ))}
            </select>
          </div>

          {needsCurrencyStrategy && (
            <div className="w-full bg-yellow-50 border border-yellow-300 rounded-xl p-2 flex flex-col gap-1">
              <p className="text-[11px] text-yellow-800">
                This account is in {selectedAccountCurrency}, different from {originalAccountCurrency}. Choose how to handle it:
              </p>
              {CURRENCY_STRATEGIES.map((strategy) => (
                <label key={strategy.value} className="flex items-start gap-2 text-[11px] cursor-pointer">
                  <input
                    type="radio"
                    name="currencyStrategy"
                    value={strategy.value}
                    checked={currencyStrategy === strategy.value}
                    onChange={() => setCurrencyStrategy(strategy.value)}
                    className="mt-0.5"
                  />
                  <span>
                    <b>{strategy.label}</b> — {strategy.description}
                  </span>
                </label>
              ))}
            </div>
          )}

          <p className="label-tfp">Project (optional)</p>
          <div className="etm-selector bg-white text-black w-full flex items-center justify-center px-[4px] py-[2px]">
            <select
              className="bg-transparent appearance-none w-full pr-4"
              value={form.budget || ""}
              onChange={(e) => setForm((p) => ({ ...p, budget: e.target.value || null }))}
            >
              <option value="">No project</option>
              {projectBudgets.map((project) => <option key={project._id} value={project._id}>{project.name}</option>)}
            </select>
          </div>

          <div className="w-full flex gap-2 mt-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 p-2 bg-slate-200 text-slate-700 text-center rounded-full hover:bg-slate-300"
            >
              Cancel
            </button>
            <button
              className={`flex-1 p-2 text-white text-center rounded-full ${
                needsCurrencyStrategy && !currencyStrategy
                  ? "bg-purple-300 cursor-not-allowed"
                  : "bg-purple-600 hover:bg-purple-500"
              }`}
              type="submit"
              disabled={needsCurrencyStrategy && !currencyStrategy}
            >
              {isLoading ? <Spin /> : "Save changes"}
            </button>
          </div>
        </form>

        <button onClick={onClose} className="close-con absolute top-0 right-0 border-2 rounded-full bg-slate-50 text-purple-700 m-1 pulse-animation-short">
          <CategoIcon type="MdClose" siz={20} />
        </button>
      </div>
    </div>
  );
}

function EditSingleTransModal({ trans, onClose }) {
  if (!trans) return null;
  return (
    <SelectCategories>
      <EditSingleTransModalInner trans={trans} onClose={onClose} />
    </SelectCategories>
  );
}

export default EditSingleTransModal;
