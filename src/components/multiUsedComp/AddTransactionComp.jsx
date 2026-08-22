"use client";

import { useContext, useEffect, useState } from "react";
import dayjs from "dayjs";
import { DemoContainer, DemoItem } from "@mui/x-date-pickers/internals/demo";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { MobileDateTimePicker } from "@mui/x-date-pickers/MobileDateTimePicker";
import { Switch } from "antd";
import {  ConfigProvider, Space, Spin } from "antd";
import fetcher from "@/helpers/fetcher";
import { useDispatch } from "react-redux";
import runNotify from "@/helpers/gastifyNotifier";
import "@/components/styles/animations.css";
import "@/components/multiUsedComp/css/muliUsed.css";
import { addNewTransacction } from "@/lib/features/transacctionsSlice";
import ModalCategoryContent from "../modals/contents/selectCategory/ModalCategoryContent";
import useModal from "@/hooks/useModalBasic";
import BasicModal from "../modals/basicModal/BasicModal";
import BtnSelectCategoryContext from "../buttons/buttonWrappers/selectBtnCategoryWithContext.jsx/BtnSelectCategoryContext";
import { SelectCategoryContext } from "../categories/SelectCategoryProvider/SelectCategoryProvider";
import useGetDataFromProvider from "@/hooks/getAllInfo/useGetInfoFromProvider";
import { isProjectBudget } from "@/helpers/transformers/budgetTypes";
import useTransactionAmountEquivalent from "@/hooks/money/useTransactionAmountEquivalent";
import AmountEquivalentPreview from "./AmountEquivalentPreview";
import ChargedElsewhereSection from "./ChargedElsewhereSection";
import { majorToMinor, minorToMajor } from "@/lib/money/currencies";

function AddTransactionComp({ initialBudgetId = "", onCreated }) {
  const [isLoading, setIsLoading] = useState(false);
  const toFetch = fetcher();
  let [transactionInfo, setTransactionInfo] = useState({
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
    user: "",
    wallet: "",
  });
  let [isShort, setIsShort] = useState(false);
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

  const { close, handleClose } = useModal();
  //REDUX
  const {user, wallet, accounts, budgets = []} = useGetDataFromProvider();
  const projectBudgets = budgets.filter((budget) => !budget.archived && isProjectBudget(budget));
  const dispatch = useDispatch();
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
    const {handleClean} = useContext(SelectCategoryContext)

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
      } catch (e) {
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
        user: user._id,
        wallet: user.wallet,
        budget: initialBudgetId || "",
      }));
    }
  }, [user, initialBudgetId]);
  //Handlers:
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "amount") setAmountTouchedManually(true);
    setTransactionInfo({ ...transactionInfo, [name]: value });
  };

  const onChangeSwitch = (checked, typeBoolean) => {
    if (typeBoolean === "income") {
      setTransactionInfo({
        ...transactionInfo,
        isIncome: checked,
        isBill: !checked,
      });
    } else if (typeBoolean === "bill") {
      setTransactionInfo({
        ...transactionInfo,
        isBill: checked,
        isIncome: !checked,
      });
    } else if (typeBoolean === "readable") {
      setTransactionInfo({
        ...transactionInfo,
        isReadable: checked,
      });
    }
  };
  const handleDefAccount = (event) => {
    if (event.target.value === "No account") {
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
  const handleSubmit = async (e) => {
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
        handleClean()
      }
    } catch (e) {
      runNotify("error", String(e));
      clearForm();
      handleClean()
      throw new Error(e);
    }
  };
  //DATE
  function hanleDatePickerChange(newDate) {
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
      user: user._id,
      wallet: user.wallet,
    });
    setChargedElsewhere(false);
    setMerchantAmount("");
    setMerchantCurrency("USD");
    setAmountTouchedManually(false);
  };


  function handleCategory(cat) {
    if (!cat) return;
    const fatherId = cat?.fatherCategory
      ? (typeof cat.fatherCategory === "object" ? cat.fatherCategory?._id : cat.fatherCategory)
      : null;
    if (fatherId) {
      setTransactionInfo({
        ...transactionInfo,
        subCategory: cat._id,
        category: fatherId
      });
    } else {
      setTransactionInfo({
        ...transactionInfo,
        category: cat._id,
        subCategory: ""
      });
    }
  }

  const projectSelector = (
    <>
      <p className="label-tfp">Project (optional)</p>
      <div className="etm-selector bg-white text-black w-full flex items-center justify-center px-[4px] py-[2px]">
        <select
          className="bg-transparent appearance-none w-full pr-4"
          name="budget"
          value={transactionInfo.budget || ""}
          onChange={handleChange}
        >
          <option value="">No project</option>
          {projectBudgets.map((project) => <option key={project._id} value={project._id}>{project.name}</option>)}
        </select>
      </div>
    </>
  );

  return (
    <div className="w-full h-full overflow-y-scroll relative bg-slate-50">
      <div
        className={`loader-add-trans absolute w-full h-full bg-white/90  items-center justify-center z-[100] rounded-t-2xl ${
          isLoading ? "flex" : "hidden"
        }`}
      >
        <Spin size="large" />
      </div>
      <div className="shortToggle w-full bg-purple-600 sticky top-0 flex justify-center items-center">
        <ConfigProvider
          theme={{
            token: {
              // Seed Token
              colorPrimary: "#9700FF",
              borderRadius: 2,

              // Alias Token
              colorBgContainer: "#9700FF",
            },
          }}
        >
          <Space direction="" size={12} className=" text-slate-200 pb-1 ">
            <p className=" text-sm ">Short transacction:</p>
            <Switch
              onChange={(value) => setIsShort(!isShort)}
              value={isShort}
              className="bg-purple-200"
            />
          </Space>
        </ConfigProvider>
      </div>
      {isShort ? (
        <div className="w-full h-full flex justify-center items-center ">
          <form
            onSubmit={handleSubmit}
            className={`form-trans-edit w-[100%] h-full flex flex-col gap-2 items-start justify-start px-10 bg-slate-50 rounded-[60px] pt-[30px] pb-10 min-[600px]:w-[500px] min-[820px]:w-[770px] min-[1200px]:w-[800px]`}
          >
            <h1 className=" text-xl min-[450px]:text-2xl font-light text-center w-full">
              Add Short Transaction
            </h1>
            <p className="label-tfp ">Name</p>
            <input
              type="text"
              name="name"
              value={transactionInfo.name}
              onChange={handleChange}
              placeholder="Transaction Name"
            />
            <p className="label-tfp ">Amount ({accountCurrency})</p>
            <input
              type="number"
              name="amount"
              value={transactionInfo.amount}
              onChange={handleChange}
              placeholder="Amount"
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
            <div className="switchers-cont flex gap-3">
              <label>
                <ConfigProvider
                  theme={{
                    token: {
                      // Seed Token
                      colorPrimary: "#9700FF",
                      borderRadius: 2,

                      // Alias Token
                      colorBgContainer: "#9700FF",
                    },
                  }}
                >
                  <Space direction="" size={12}>
                    <div className="switch-int-cont">
                      <p className="label-tfp ">Is Income:</p>
                      <Switch
                        onChange={(value) => onChangeSwitch(value, "income")}
                        value={transactionInfo?.isIncome}
                      />
                    </div>
                    <div className="switch-int-cont">
                      <p className="label-tfp ">Is Bill:</p>
                      <Switch
                        onChange={(value) => onChangeSwitch(value, "bill")}
                        value={transactionInfo?.isBill}
                      />
                    </div>
                    <div className="switch-int-cont">
                      <p className="label-tfp ">Is Readable:</p>
                      <Switch
                        onChange={(value) => onChangeSwitch(value, "readable")}
                        value={transactionInfo?.isReadable}
                      />
                    </div>
                  </Space>
                </ConfigProvider>
              </label>
            </div>
            <p className="label-tfp ">Date</p>
            <div className="date-container w-full h-[100px] ">
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DemoContainer components={["MobileDateTimePicker"]}>
                  <DemoItem label="">
                    <MobileDateTimePicker
                      className="text-center flex items-center justify-between border-2"
                      slotProps={{ textField: { size: "small" } }}
                      onChange={(newValue) =>
                        hanleDatePickerChange(newValue.format())
                      }
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
                          border: "1px solid rgb(176, 23, 176)",
                        },
                      }}
                    />
                  </DemoItem>
                </DemoContainer>
              </LocalizationProvider>
            </div>
            {projectSelector}
            <button
              className="w-full p-2 bg-purple-600 text-white text-center rounded-full mt-3 hover:bg-purple-500"
              type="submit"
            >
              {isLoading ? <Spin /> : "Submit"}
            </button>
            <div
              className="clearForm underline text-red-400 cursor-pointer"
              onClick={clearForm}
            >
              Clear Form
            </div>
          </form>
        </div>
      ) : (
        <div className="w-full h-full flex justify-center items-center">
          <form
            onSubmit={handleSubmit}
            className={`form-trans-edit w-[100%] h-full flex flex-col gap-2 items-start justify-start px-10 bg-slate-50 rounded-[60px] pt-[30px] pb-20 min-[600px]:w-[500px] min-[820px]:w-[770px] min-[1200px]:w-[800px]`}
          >
            <h1 className=" text-xl min-[450px]:text-2xl font-light text-center w-full">
              Add New Transaction
            </h1>
            <p className="label-tfp ">Name</p>
            <input
              type="text"
              name="name"
              value={transactionInfo.name}
              onChange={handleChange}
              placeholder="Transaction Name"
            />
            <p className="label-tfp ">Amount ({accountCurrency})</p>
            <input
              type="number"
              name="amount"
              value={transactionInfo.amount}
              onChange={handleChange}
              placeholder="Amount"
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
            <div className="switchers-cont flex gap-3">
              <label>
                <ConfigProvider
                  theme={{
                    token: {
                      // Seed Token
                      colorPrimary: "#9700FF",
                      borderRadius: 2,

                      // Alias Token
                      colorBgContainer: "#9700FF",
                    },
                  }}
                >
                  <Space direction="" size={12}>
                    <div className="switch-int-cont">
                      <p className="label-tfp ">Is Income:</p>
                      <Switch
                        onChange={(value) => onChangeSwitch(value, "income")}
                        value={transactionInfo?.isIncome}
                      />
                    </div>
                    <div className="switch-int-cont">
                      <p className="label-tfp ">Is Bill:</p>
                      <Switch
                        onChange={(value) => onChangeSwitch(value, "bill")}
                        value={transactionInfo?.isBill}
                      />
                    </div>
                    <div className="switch-int-cont">
                      <p className="label-tfp ">Is Readable:</p>
                      <Switch
                        onChange={(value) => onChangeSwitch(value, "readable")}
                        value={transactionInfo?.isReadable}
                      />
                    </div>
                  </Space>
                </ConfigProvider>
              </label>
            </div>
            <p className="label-tfp ">Date</p>
            <div className="date-container w-full h-[100px] ">
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DemoContainer components={["MobileDateTimePicker"]}>
                  <DemoItem label="">
                    <MobileDateTimePicker
                      className="text-center flex items-center justify-between border-2"
                      slotProps={{ textField: { size: "small" } }}
                      onChange={(newValue) =>
                        hanleDatePickerChange(newValue.format())
                      }
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
                          border: "1px solid rgb(176, 23, 176)",
                        },
                      }}
                    />
                  </DemoItem>
                </DemoContainer>
              </LocalizationProvider>
            </div>
            <p className="label-tfp ">Category</p>
              <BtnSelectCategoryContext onClose={handleClose} />
              {close && (
                <BasicModal
                  close={handleClose}
                  renderContent={
                    <ModalCategoryContent
                      close={handleClose}
                      getSelected={handleCategory}
                    />
                  }
                />
              )}
            <p className="label-tfp ">Tags</p>
            <input
              type="text"
              name="tags"
              value={transactionInfo.tags || null}
              onChange={handleChange}
              placeholder="Tags (separated by comma)"
            />
            <p className="label-tfp ">Account</p>
            <div className="etm-selector bg-white text-black w-full flex items-center justify-center px-[4px] py-[2px]text-center">
              <select
                className=" bg-transparent appearance-none w-full pr-4"
                name="DateSelector"
                value={transactionInfo?.account || null}
                onChange={handleDefAccount}
              >
                <option value={null}>No account</option>
                {accounts.length > 0 ? (
                  accounts.map((acc) => (
                    <option value={acc._id} key={`option-acc-${acc._id}`}>
                      {acc.name}{" "}
                    </option>
                  ))
                ) : (
                  <div>No accounts loaded...</div>
                )}
              </select>
            </div>
            {projectSelector}
            <button
              className="w-full p-2 bg-purple-600 text-white text-center rounded-full mt-3 hover:bg-purple-500"
              type="submit"
            >
              {isLoading ? <Spin /> : "Submit"}
            </button>
            <div
              className="clearForm underline text-red-400 cursor-pointer pb-4"
              onClick={clearForm}
            >
              Clear Form
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default AddTransactionComp;
