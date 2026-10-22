"use client";

import React, { useContext, useEffect, useState } from "react";
import dayjs, { type Dayjs } from "dayjs";
import { DemoContainer, DemoItem } from "@mui/x-date-pickers/internals/demo";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { MobileDateTimePicker } from "@mui/x-date-pickers/MobileDateTimePicker";
import { Spin } from "antd";
import fetcher from "@/helpers/fetcher";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "@/lib/store";
import runNotify from "@/helpers/gastifyNotifier";
import "@/components/styles/animations.css";
import "@/components/multiUsedComp/css/muliUsed.css";
import { addNewTransacction, type TransactionData } from "@/lib/features/transacctionsSlice";
import ModalCategoryContent from "../modals/contents/selectCategory/ModalCategoryContent";
import BtnSelectCategoryContext from "../buttons/buttonWrappers/selectBtnCategoryWithContext.jsx/BtnSelectCategoryContext";
import { SelectCategoryContext } from "../categories/SelectCategoryProvider/SelectCategoryProvider";
import useGetDataFromProvider from "@/hooks/getAllInfo/useGetInfoFromProvider";
import { isProjectBudget } from "@/helpers/transformers/budgetTypes";
import useTransactionAmountEquivalent from "@/hooks/money/useTransactionAmountEquivalent";
import AmountEquivalentPreview from "./AmountEquivalentPreview";
import ChargedElsewhereSection from "./ChargedElsewhereSection";
import { majorToMinor, minorToMajor } from "@gastify/core/money/currencies";

export interface AddTransactionCompProps {
  initialBudgetId?: string;
  // Starts as an income (the "+" offers Gasto and Ingreso as two choices).
  defaultIncome?: boolean;
  onCreated?: (data?: TransactionData | unknown) => void;
  // Inside a panel that already scrolls (the "+" window): no scroll box and no title of its own.
  inline?: boolean;
}

export interface TransactionFormState {
  name: string;
  amount: string;
  isIncome: boolean;
  isBill: boolean;
  isReadable: boolean;
  isForSaving: boolean;
  date: Date;
  account: string | null;
  category: string;
  subCategory: string;
  tags: string;
  budget: string;
  user: string;
  wallet: string;
  [key: string]: unknown;
}

interface UserData {
  _id?: string;
  wallet?: string;
  [key: string]: unknown;
}

interface WalletData {
  primaryCurrency?: string;
  [key: string]: unknown;
}

interface AccountItem {
  _id?: string;
  name?: string;
  currency?: string;
  [key: string]: unknown;
}

interface BudgetItem {
  _id?: string;
  name?: string;
  archived?: boolean;
  budgetType?: string;
  isSaving?: boolean;
  [key: string]: unknown;
}

interface ProviderData {
  user?: UserData | null;
  wallet?: WalletData | null;
  accounts?: AccountItem[];
  budgets?: BudgetItem[];
  [key: string]: unknown;
}

export interface CategorySelection {
  _id?: string;
  name?: string;
  fatherCategory?: { _id?: string; [key: string]: unknown } | string | null;
  [key: string]: unknown;
}



function AddTransactionComp({ initialBudgetId = "", defaultIncome = false, onCreated, inline = false }: AddTransactionCompProps): React.JSX.Element {
  const [isLoading, setIsLoading] = useState(false);
  const toFetch = fetcher();
  const [transactionInfo, setTransactionInfo] = useState<TransactionFormState>({
    name: "",
    amount: "",
    isIncome: defaultIncome,
    isBill: !defaultIncome,
    isReadable: true,
    isForSaving: false,
    date: new Date(),
    account: "",
    category: "",
    subCategory: "",
    tags: "",
    budget: initialBudgetId || "",
    user: "",
    wallet: "",
  });
  // Advanced "Charged in another currency" disclosure (plan section 12.2):
  // the Amount field above stays in the Account's own currency (what
  // actually left the account); this optionally records what the merchant
  // charged in a different currency, and auto-suggests the Account Amount
  // via a live FX estimate so the user doesn't have to compute it by hand.
  const [chargedElsewhere, setChargedElsewhere] = useState(false);
  const [merchantAmount, setMerchantAmount] = useState("");
  const [merchantCurrency, setMerchantCurrency] = useState("USD");
  const [amountTouchedManually, setAmountTouchedManually] = useState(false);
  const [merchantQuoting, setMerchantQuoting] = useState(false);

  // The category list opens in place, under its button (no window of its own).
  const [isCategoryPickerOpen, setIsCategoryPickerOpen] = useState(false);
  //REDUX
  const { user, wallet, accounts, budgets = [] } = useGetDataFromProvider() as ProviderData;
  const projectBudgets = budgets.filter((budget) => !budget.archived && isProjectBudget(budget));
  const dispatch = useDispatch<AppDispatch>();
  // Multi-currency: the Amount field is always in the selected Account's
  // native currency (or the Wallet's primary currency when no Account is
  // chosen) - never a second, separately-tracked currency.
  const accountCurrency =
    accounts?.find((acc) => acc._id === transactionInfo.account)?.currency ||
    wallet?.primaryCurrency ||
    "MXN";
  const amountEquivalent = useTransactionAmountEquivalent({
    amount: transactionInfo.amount,
    accountCurrency,
    walletPrimaryCurrency: wallet?.primaryCurrency || "MXN",
  });
  const { handleClean } = useContext(SelectCategoryContext);

  // Auto-suggest the Account Amount from the merchant amount whenever they
  // differ in currency - debounced, and only while the user hasn't typed
  // into the Amount field directly (so their manual correction always wins).
  useEffect(() => {
    if (!chargedElsewhere) return;
    const numericMerchant = Number(merchantAmount);
    if (!Number.isFinite(numericMerchant) || numericMerchant <= 0) return;

    if (merchantCurrency === accountCurrency) {
      if (!amountTouchedManually) setTransactionInfo((t) => ({ ...t, amount: merchantAmount }));
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        setMerchantQuoting(true);
        const amountMinor = majorToMinor(numericMerchant, merchantCurrency);
        const res = await toFetch.post("general-data/fx/quote", {
          amountMinor,
          fromCurrency: merchantCurrency,
          toCurrency: accountCurrency,
        });
        if (!cancelled && res.ok && !amountTouchedManually) {
          setTransactionInfo((t) => ({ ...t, amount: String(minorToMajor(res.data.amountMinor, accountCurrency)) }));
        }
      } catch {
        // Silently unavailable - the user can still enter the Account Amount manually.
      } finally {
        if (!cancelled) setMerchantQuoting(false);
      }
    }, 500);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chargedElsewhere, merchantAmount, merchantCurrency, accountCurrency]);

  //EFFECTS
  useEffect(() => {
    if (user) {
      setTransactionInfo((current) => ({
        ...current,
        user: (user._id as string) || "",
        wallet: (user.wallet as string) || "",
        budget: initialBudgetId || "",
      }));
    }
  }, [user, initialBudgetId]);
  //Handlers:
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === "amount") setAmountTouchedManually(true);
    setTransactionInfo({ ...transactionInfo, [name]: value });
  };

  // Gasto or Ingreso, as in the app: the two flags the API receives always agree with the choice.
  const setType = (income: boolean) => {
    setTransactionInfo((current) => ({ ...current, isIncome: income, isBill: !income }));
  };
  const handleDefAccount = (event: React.ChangeEvent<HTMLSelectElement>) => {
    // The "No account" option has an empty value (a null value made React warn, bug 164).
    if (event.target.value === "") {
      setTransactionInfo({
        ...transactionInfo,
        account: null,
      });
    } else {
      setTransactionInfo({
        ...transactionInfo,
        account: event.target.value,
      });
    }
  };
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const trimmedName = transactionInfo.name.trim();
    const tagsArray = transactionInfo.tags.split(",");
    const tagsArrCleaned = tagsArray.map((tag) => tag.trim());
    const newTrans = {
      ...transactionInfo,
      name: trimmedName,
      tags: tagsArrCleaned,
      ...(chargedElsewhere && merchantAmount !== "" ? { merchantAmount, merchantCurrency } : {}),
    };
    try {
      const response = await toFetch.post(
        `general-data/transactions/new-transaction`,
        newTrans
      );
      if (response.data) {
        runNotify("ok", response.message);
        //UPDATE FRON END
        dispatch(addNewTransacction(response.data));
        onCreated?.(response.data);
        setIsLoading(false);
        clearForm();
        handleClean?.();
      }
    } catch (e) {
      runNotify("error", String(e));
      clearForm();
      handleClean?.();
      throw new Error(String(e));
    }
  };
  //DATE
  function hanleDatePickerChange(newDate: string) {
    setTransactionInfo({ ...transactionInfo, date: new Date(newDate) });
  }
  // Clear FORM
  const clearForm = () => {
    setTransactionInfo({
      name: "",
      amount: "",
      isIncome: false,
      isBill: false,
      isReadable: true,
      isForSaving: false,
      date: new Date(),
      account: "",
      category: "",
      subCategory: "",
      tags: "",
      budget: initialBudgetId || "",
      user: (user?._id as string) || "",
      wallet: (user?.wallet as string) || "",
    });
    setChargedElsewhere(false);
    setMerchantAmount("");
    setMerchantCurrency("USD");
    setAmountTouchedManually(false);
  };

  function handleCategory(cat?: CategorySelection | null) {
    if (!cat) return;
    const fatherId = cat?.fatherCategory
      ? (typeof cat.fatherCategory === "object" ? cat.fatherCategory?._id : cat.fatherCategory)
      : null;
    if (fatherId) {
      setTransactionInfo({
        ...transactionInfo,
        subCategory: (cat._id as string) || "",
        category: (fatherId as string) || "",
      });
    } else {
      setTransactionInfo({
        ...transactionInfo,
        category: (cat._id as string) || "",
        subCategory: "",
      });
    }
  }

  const projectSelector = (
    <>
      <p className="label-tfp">Proyecto (opcional)</p>
      <div className="etm-selector bg-gf-surface text-gf-text w-full flex items-center justify-center px-[4px] py-[2px]">
        <select
          className="bg-transparent appearance-none w-full pr-4"
          name="budget"
          value={transactionInfo.budget || ""}
          onChange={handleChange}
        >
          <option value="">Sin proyecto</option>
          {projectBudgets.map((project) => <option key={project._id} value={project._id}>{project.name}</option>)}
        </select>
      </div>
    </>
  );

  return (
    <div className={inline ? "relative w-full" : "relative h-full w-full overflow-y-scroll"}>
      <div
        className={`loader-add-trans absolute w-full h-full bg-gf-surface/90  items-center justify-center z-[100] rounded-t-2xl ${
          isLoading ? "flex" : "hidden"
        }`}
      >
        <Spin size="large" />
      </div>
      <div className="w-full h-full flex justify-center items-center">
          <form
            onSubmit={handleSubmit}
            className={inline
              ? "form-trans-edit flex w-full max-w-[800px] flex-col gap-2 items-start justify-start pb-4"
              : "form-trans-edit w-[100%] h-full flex flex-col gap-2 items-start justify-start px-10 rounded-[60px] pt-[30px] pb-20 min-[600px]:w-[500px] min-[820px]:w-[770px] min-[1200px]:w-[800px]"}
          >
            {!inline && (
              <h1 className=" text-xl min-[450px]:text-2xl font-light text-center w-full">
                Nueva transacción
              </h1>
            )}
            <p className="label-tfp ">Nombre (opcional)</p>
            <input
              type="text"
              name="name"
              value={transactionInfo.name}
              onChange={handleChange}
              placeholder="Si lo dejas vacío usamos la categoría"
            />
            <p className="label-tfp ">Monto ({accountCurrency})</p>
            <input
              type="number"
              name="amount"
              value={transactionInfo.amount}
              onChange={handleChange}
              placeholder="0.00"
            />
            <AmountEquivalentPreview quote={amountEquivalent} />
            <ChargedElsewhereSection
              enabled={chargedElsewhere}
              onToggle={setChargedElsewhere}
              merchantAmount={merchantAmount}
              merchantCurrency={merchantCurrency}
              onMerchantAmountChange={setMerchantAmount}
              onMerchantCurrencyChange={setMerchantCurrency}
              quoting={merchantQuoting}
            />
            <p className="label-tfp ">Tipo</p>
            <div className="flex w-full gap-2" role="group" aria-label="Tipo de movimiento">
              {[
                { income: false, label: "Gasto" },
                { income: true, label: "Ingreso" },
              ].map((option) => {
                const selected = transactionInfo.isIncome === option.income;
                return (
                  <button
                    key={option.label}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setType(option.income)}
                    className={`flex-1 rounded-full py-2 text-sm font-semibold transition-colors ${
                      selected ? "gf-glass-button text-white" : "gf-glass-button-neutral text-purple-200"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
            <p className="label-tfp ">Fecha</p>
            <div className="date-container w-full h-[100px] ">
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DemoContainer components={["MobileDateTimePicker"]}>
                  <DemoItem label="">
                    <MobileDateTimePicker
                      className="text-center flex items-center justify-between border-2"
                      slotProps={{ textField: { size: "small" } }}
                      onChange={(newValue: Dayjs | null) => {
                        if (newValue) {
                          hanleDatePickerChange(newValue.format());
                        }
                      }}
                      value={dayjs(transactionInfo?.date)}
                      sx={{
                        "& .MuiInputBase-root": {
                          width: "100%",
                          height: "100%",
                          padding: "0px",
                          border: "none",
                        },
                        "& .MuiInputBase-input": {
                          width: "100%",
                          height: "100%",
                          border: "none",
                        },
                      }}
                    />
                  </DemoItem>
                </DemoContainer>
              </LocalizationProvider>
            </div>
            <p className="label-tfp ">Categoría</p>
              <BtnSelectCategoryContext onClose={() => setIsCategoryPickerOpen((open) => !open)} />
              {isCategoryPickerOpen && (
                <ModalCategoryContent
                  inline
                  close={() => setIsCategoryPickerOpen(false)}
                  getSelected={handleCategory}
                />
              )}
            <p className="label-tfp ">Etiquetas (separadas por comas)</p>
            <input
              type="text"
              name="tags"
              value={transactionInfo.tags || ""}
              onChange={handleChange}
              placeholder="viaje, trabajo"
            />
            <p className="label-tfp ">Cuenta</p>
            <div className="etm-selector bg-gf-surface text-gf-text w-full flex items-center justify-center px-[4px] py-[2px]text-center">
              <select
                className=" bg-transparent appearance-none w-full pr-4"
                name="DateSelector"
                value={transactionInfo?.account || ""}
                onChange={handleDefAccount}
              >
                <option value="">Sin cuenta</option>
                {accounts && accounts.length > 0 ? (
                  accounts.map((acc) => (
                    <option value={acc._id} key={`option-acc-${acc._id}`}>
                      {acc.name}{" "}
                    </option>
                  ))
                ) : (
                  <option value="" disabled>Primero crea una cuenta</option>
                )}
              </select>
            </div>
            {projectSelector}
            <button
              className="w-full p-2 gf-glass-button text-white text-center rounded-full mt-3"
              type="submit"
            >
              {isLoading ? <Spin /> : "Guardar movimiento"}
            </button>
            <button
              type="button"
              className="clearForm w-full p-2 gf-glass-button-neutral text-red-300 text-center rounded-full cursor-pointer mb-4"
              onClick={clearForm}
            >
              Limpiar formulario
            </button>
          </form>
      </div>
    </div>
  );
}

export default AddTransactionComp;
