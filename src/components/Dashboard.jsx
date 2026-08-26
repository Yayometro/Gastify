"use client";

import React, { useEffect, useRef, useState } from "react";
import UniversalCategoIcon from "./multiUsedComp/UniversalCategoIcon";

import "@/components/styles/animations.css";
import "@/components/multiUsedComp/css/muliUsed.css";

import MultiCreditCard from "./multiUsedComp/MultiCreditCard";
import Category from "./multiUsedComp/Category";
import Movements from "./multiUsedComp/Movements";
import BudgetCont from "./multiUsedComp/BudgetCont";
//REDUX
import { useDispatch, useSelector } from "react-redux";
import { fetchUser, setUser } from "@/lib/features/userSlice";
import { fetchWallet, setWallet } from "@/lib/features/walletSlice";
import { fetchAccounts, setAccounts } from "@/lib/features/accountsSlice";
import { fetchCategories, setCategories } from "@/lib/features/categoriesSlice";
import { fetchSubCat, setSubCategories } from "@/lib/features/subCategorySlice";
import {
  fetchTrans,
} from "@/lib/features/transacctionsSlice";
//
import ResumeTabsTrans from "./multiUsedComp/ResumeTabsTrans";
import {
  MdKeyboardDoubleArrowUp,
  MdKeyboardDoubleArrowDown,
} from "react-icons/md";
import TransDetailsGrandContainer from "./multiUsedComp/TransDetailsGrandContainer";
import dayjs from "dayjs";
import { Skeleton, Spin, Tooltip } from "antd";
import { formatMoneyMajor } from "@/lib/money/currencies";
import { getPrimaryAmount } from "@/helpers/transformers/transactionsChange";
import { fetchBudget } from "@/lib/features/budgetSlice";
import DashboardLoadingMessage from "./multiUsedComp/loaders/DashboardLoadingMessage";
import SelecterFilter from "./Filters/selecterFilter/SelecterFilter";
import {
  generate_timeperiod_ranges_array_for_dashboard,
  getLastDayOfMonth,
} from "@/helpers/timeFunctions/timeFunctions";
import TimeRange from "./Filters/timeRange/TimeRange";
import TopElementsContainer from "./multiUsedComp/TopElementsContainer";

const today = new Date();

function Wallet({ dataServ, session }) {
  const [sed, setSed] = useState([]);
  const [totalDataFromServer, setTotalDataFromServer] = useState({});
  const [user, setUser] = useState([]);
  const [wallet, setWallet] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [transactions, setTransacctions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  // DATES
  let [selectedDuration, setSelectedDuration] = useState(30);
  let [startDate, setStartDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  let [endDate, setEndDate] = useState(getLastDayOfMonth(today.getFullYear(), today.getMonth()));
  //TRANSACTIONS and TYPES OF
  let [allTransactions, setAllTransacctions] = useState([]);
  let [allBills, setAllBills] = useState([]);
  let [allIncomes, setAllIncomes] = useState([]);
  let [totalAmountBalance, setTotalAmountBalance] = useState(0);
  let [totalBill, setTotalBill] = useState(0);
  let [totalIncome, setTotalIncome] = useState(0);
  let [prevTotalBill, setPrevTotalBill] = useState(0);
  let [prevTotalIncome, setPrevTotalIncome] = useState(0);
  // Mobile header carousel: accounts / summary / vs-last-month, one at a
  // time. Starts centered on the summary panel (today's default view).
  const headerCarouselRef = useRef(null);
  const [headerActiveSlide, setHeaderActiveSlide] = useState(1);
  useEffect(() => {
    if (headerCarouselRef.current) {
      headerCarouselRef.current.scrollLeft = headerCarouselRef.current.clientWidth;
    }
  }, []);
  const handleHeaderCarouselScroll = (e) => {
    const el = e.target;
    if (!el.clientWidth) return;
    setHeaderActiveSlide(Math.round(el.scrollLeft / el.clientWidth));
  };
  //LOADER
  const [loading, setLoading] = useState(true);
  //Loader
  useEffect(() => {
    import("ldrs").then(({ quantum }) => quantum.register());
  }, []);
  // Redux
  const dispatch = useDispatch();
  const ccUser = useSelector((state) => state.userReducer);
  const ccWallet = useSelector((state) => state.walletReducer);
  const ccAccounts = useSelector((state) => state.accountsReducer);
  const ccCategories = useSelector((state) => state.categoriesReducer);
  const ccSubCategories = useSelector((state) => state.subCategoryReducer);
  const ccTransacciones = useSelector((state) => state.transacctionsReducer);
  const ccBudgets = useSelector((state) => state.budgetReducer);
  const walletPrimaryCurrency = useSelector((state) => state.walletReducer?.data?.primaryCurrency) || "MXN";

  //
  useEffect(() => {
    // User
    if (ccUser.status == "idle") {
      dispatch(fetchUser(session));
    }
    // Wallet
    if (ccWallet.status == "idle") {
      dispatch(fetchWallet(session));
    }
    // Account
    if (ccAccounts.status == "idle") {
      dispatch(fetchAccounts(session));
    }
    //Categories
    if (ccCategories.status == "idle") {
      dispatch(fetchCategories(session));
    }
    // //Sub-categories
    if (ccSubCategories.status == "idle") {
      dispatch(fetchSubCat(session));
    }
    //Transactions
    if (ccTransacciones.status == "idle" && session) {
      dispatch(fetchTrans(session));
    }
    //Budget
    if (ccBudgets.status == "idle" && session) {
      dispatch(fetchBudget(session));
    }
    //
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    const end = getLastDayOfMonth(today.getFullYear(), today.getMonth());
    setStartDate(start);
    setEndDate(end); //
  }, []);

  useEffect(() => {
    // User
    if (ccUser.status == "succeeded") {
      setUser(ccUser.data);
    }
    if (ccWallet.status == "succeeded") {
      setWallet(ccWallet.data);
    }
    // Account
    if (ccAccounts.status == "succeeded") {
      setAccounts(ccAccounts.data);
    }
    //Categories
    if (ccCategories.status == "succeeded") {
      setCategories(ccCategories.data.user.concat(ccCategories.data.default));
    }
    // //Sub-categories
    if (ccSubCategories.status == "succeeded") {
      setSubCategories(
        ccSubCategories.data.subCat.concat(ccCategories.data.default)
      );
    }
    //Transactions
    if (ccTransacciones.status == "succeeded") {
      setTransacctions(ccTransacciones.data);
      setLoading(false);
    }
    //Budgets
    if (ccBudgets.status == "succeeded") {
      setBudgets(ccBudgets.data);
    }
  }, [
    ccUser,
    ccWallet,
    ccAccounts,
    ccCategories,
    ccSubCategories,
    ccTransacciones,
    ccBudgets,
  ]);

  useEffect(() => {
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    setStartDate(start);
  }, [selectedDuration]);

  useEffect(() => {
    //DATE
    let startFilterDate;
    let endFilterDate;
    if (startDate && endDate) {
      startFilterDate = startDate;
      endFilterDate = endDate;
    } else {
      const today = new Date();
      startFilterDate = new Date(
        today.setDate(today.getDate() - selectedDuration)
      );
      endFilterDate = new Date();
    }
    //TRANS
    if (transactions.length > 0 && wallet) {
      let total = transactions.filter((tra) => {
        const transactionDate = new Date(tra.date || tra.createdAt);
        return (
          transactionDate >= startFilterDate && transactionDate <= endFilterDate
        );
      });
      total = total.sort((a, b) => {
        let dateA = new Date(a.date || a.createdAt);
        let dateB = new Date(b.date || b.createdAt);

        return dateB - dateA;
      });
      const accBills = total.filter((bill) => bill.isBill && !bill.isIncome);
      const accIncomes = total.filter((bill) => bill.isIncome && !bill.isBill);
      const finalBill = accBills.reduce(
        (current, bill) => current + getPrimaryAmount(bill),
        0
      );
      const finalIncome = accIncomes.reduce(
        (current, income) => current + getPrimaryAmount(income),
        0
      );
      let finalAmount = finalIncome - finalBill;
      setAllTransacctions(total);
      setAllBills(accBills);
      setAllIncomes(accIncomes);
      setTotalAmountBalance(finalAmount);
      setTotalBill(finalBill);
      setTotalIncome(finalIncome);

      // "Vs. last month" comparison - always the calendar month right
      // before the current view's start date, regardless of what range is
      // currently selected. Same conversion (getPrimaryAmount) as the
      // current-period totals above, so the comparison is apples-to-apples.
      const prevMonthDate = new Date(startFilterDate.getFullYear(), startFilterDate.getMonth() - 1, 1);
      const prevMonthStart = new Date(prevMonthDate.getFullYear(), prevMonthDate.getMonth(), 1);
      const prevMonthEnd = getLastDayOfMonth(prevMonthDate.getFullYear(), prevMonthDate.getMonth());
      const prevMonthTx = transactions.filter((tra) => {
        const transactionDate = new Date(tra.date || tra.createdAt);
        return transactionDate >= prevMonthStart && transactionDate <= prevMonthEnd;
      });
      const prevBills = prevMonthTx.filter((bill) => bill.isBill && !bill.isIncome);
      const prevIncomes = prevMonthTx.filter((bill) => bill.isIncome && !bill.isBill);
      setPrevTotalBill(prevBills.reduce((current, bill) => current + getPrimaryAmount(bill), 0));
      setPrevTotalIncome(prevIncomes.reduce((current, income) => current + getPrimaryAmount(income), 0));
      //
      setLoading(false);
    }
  }, [
    user,
    wallet,
    accounts,
    transactions,
    categories,
    selectedDuration,
    endDate,
    startDate,
  ]);

  const handleDurationChange = (event) => {
    setSelectedDuration(parseInt(event.target.value, 10));
  };
  const handleRangeDate = (sDate, eDate) => {
    setStartDate(sDate);
    setEndDate(eDate);
  };

  const toggleIsLoading = React.useCallback(() => {
    setLoading((prev) => !prev);
  }, []);

  function getValueFromSelecter(v) {
    if (!v || !v.includes("*")) return; // Seguridad para evitar errores si el valor no es el esperado

    const [start, end] = v.split("*");
    setStartDate(new Date(start));
    setEndDate(new Date(end));
    // Clear the onther input
    
  }

  // Category color (not sign-based): Incomes always green-tinted,
  // Expenses always red-tinted, Balance always blue-tinted - very light,
  // near-white tones so they stay legible on the purple gradient without
  // competing with it.
  const INCOME_COLOR = "#E3F7EC";
  const EXPENSE_COLOR = "#FCEBEB";
  const BALANCE_COLOR = "#E6F1FB";

  function renderDeltaRow(label, current, previous, colorHex) {
    const delta = current - previous;
    const pct = previous ? (delta / Math.abs(previous)) * 100 : null;
    const sign = delta > 0 ? "+" : delta < 0 ? "-" : "";
    const arrow = delta > 0 ? "▲" : delta < 0 ? "▼" : "";
    return (
      <div key={label} className="flex flex-col bg-black/15 rounded-lg px-2.5 py-1.5 w-full">
        <span className="text-white/70 text-[10px]">{label}</span>
        <span className="text-xs font-medium" style={{ color: colorHex }}>
          {sign}
          {formatMoneyMajor(Math.abs(delta), walletPrimaryCurrency, { showCode: false })}
          {pct !== null ? ` (${arrow} ${Math.abs(Math.round(pct))}%)` : ""}
        </span>
      </div>
    );
  }

  const accountsPanel = (
    <div className="bg-white/10 rounded-2xl p-3 flex flex-col gap-1.5 w-full max-h-[170px] overflow-y-auto">
      <span className="text-white/70 text-[10px] uppercase tracking-wide">Tus cuentas</span>
      {!accounts || accounts.length === 0 ? (
        <span className="text-white/60 text-xs">No accounts yet</span>
      ) : (
        [...accounts]
          .sort((a, b) => (Number(b.amount) || 0) - (Number(a.amount) || 0))
          .map((acc) => (
            <div
              key={acc._id}
              className="flex justify-between items-center gap-2 bg-black/15 rounded-lg px-2.5 py-1.5 text-white text-xs"
            >
              <span className="truncate">{acc.name || "Account"}</span>
              <span className="shrink-0 font-medium">
                {formatMoneyMajor(acc.amount || 0, acc.currency || walletPrimaryCurrency, { showCode: false })}
                {acc.currency && acc.currency !== walletPrimaryCurrency ? ` ${acc.currency}` : ""}
              </span>
            </div>
          ))
      )}
    </div>
  );

  const summaryPanel = (
    <div className="flex flex-col gap-2 items-center w-full">
      <div className="flex items-center gap-3 w-full justify-center">
        <span className="text-white text-sm w-20 text-right shrink-0">Incomes:</span>
        <MdKeyboardDoubleArrowUp className="w-4 h-4 text-green-400 shrink-0" />
        {!totalIncome ? (
          <span className="text-green-400 text-sm">No amount...</span>
        ) : (
          <span className="text-sm font-medium rounded-full px-3 py-1 bg-black/30" style={{ color: INCOME_COLOR }}>
            {formatMoneyMajor(totalIncome, walletPrimaryCurrency)}
          </span>
        )}
      </div>
      <div className="flex items-center gap-3 w-full justify-center">
        <span className="text-white text-sm w-20 text-right shrink-0">Expenses:</span>
        <MdKeyboardDoubleArrowDown className="w-4 h-4 text-red-400 shrink-0" />
        {!totalBill ? (
          <span className="text-red-400 text-sm">No amount...</span>
        ) : (
          <span className="text-sm font-medium rounded-full px-3 py-1 bg-black/30" style={{ color: EXPENSE_COLOR }}>
            {formatMoneyMajor(totalBill, walletPrimaryCurrency)}
          </span>
        )}
      </div>
      <div className="flex items-center gap-3 w-full justify-center">
        <span className="text-white text-sm w-20 text-right shrink-0">Balance:</span>
        {totalAmountBalance < 0 ? (
          <MdKeyboardDoubleArrowDown className="w-4 h-4 text-red-400 shrink-0" />
        ) : (
          <MdKeyboardDoubleArrowUp className="w-4 h-4 text-green-400 shrink-0" />
        )}
        {!totalAmountBalance ? (
          <span className="text-green-400 text-sm">No amount...</span>
        ) : (
          <span className="text-sm font-medium rounded-full px-3 py-1 bg-black/30" style={{ color: BALANCE_COLOR }}>
            {formatMoneyMajor(totalAmountBalance, walletPrimaryCurrency)}
          </span>
        )}
      </div>
      <p className="text-white/70 text-[10px] pt-1">
        From {dayjs(startDate).format("DD-MM-YYYY")} to {dayjs(endDate).format("DD-MM-YYYY")}.
      </p>
    </div>
  );

  const comparisonPanel = (
    <div className="bg-white/10 rounded-2xl p-3 flex flex-col gap-1.5 w-full">
      <span className="text-white/70 text-[10px] uppercase tracking-wide text-right">Vs. mes anterior</span>
      {renderDeltaRow("Ingresos", totalIncome, prevTotalIncome, INCOME_COLOR)}
      {renderDeltaRow("Gastos", totalBill, prevTotalBill, EXPENSE_COLOR)}
      {renderDeltaRow("Balance", totalAmountBalance, prevTotalIncome - prevTotalBill, BALANCE_COLOR)}
    </div>
  );

  return (
    <div className="wallet h-full md:pl-[85px] md:pr-[5px] md:pb-[20px] relative">
      <div className="loader">
        {!loading ? (
          ""
        ) : (
          <DashboardLoadingMessage
            message={`We are building up your dashboard and data`}
            subMessage={`Please wait a moment 🤓`}
            setLoading={toggleIsLoading}
          />
        )}
      </div>
      {user && wallet ? (
        <div className="walllet-header ">
          <div className="wallet-header pt-5 pb-2 px-3 flex flex-col gap-4 justify-between sm:rounded-t-2xl sm:flex-col sm:mx-2 sm:items-center">
            <div className="w-full max-w-[900px]">
              <h2 className="text-white text-3xl sm:text-6xl font-thin text-center">
                {!user.fullName ? <Spin size="large" /> : `${user.fullName} `}{" "}
                Wallet
              </h2>

              <div className="hidden sm:grid sm:grid-cols-[1fr_1.6fr_1fr] sm:gap-4 sm:items-start pt-6">
                {accountsPanel}
                {summaryPanel}
                {comparisonPanel}
              </div>

              <div className="sm:hidden pt-4">
                <div
                  ref={headerCarouselRef}
                  onScroll={handleHeaderCarouselScroll}
                  className="flex overflow-x-auto snap-x snap-mandatory"
                >
                  <div className="snap-center shrink-0 w-full px-1">{accountsPanel}</div>
                  <div className="snap-center shrink-0 w-full px-1">{summaryPanel}</div>
                  <div className="snap-center shrink-0 w-full px-1">{comparisonPanel}</div>
                </div>
                <div className="flex justify-center gap-1.5 mt-2">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className={`w-1.5 h-1.5 rounded-full ${headerActiveSlide === i ? "bg-white" : "bg-white/40"}`}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="filters flex items-center justify-center gap-2">
              <SelecterFilter
                getValue={getValueFromSelecter}
                periodOverride={generate_timeperiod_ranges_array_for_dashboard(
                  new Date().getFullYear()
                )}
                styles={
                  "bg-white text-black w-fit text-[10px] font-light flex items-center justify-center rounded-2xl px-[4px] sm:font-base sm:font-extralight active:border-0 hover:border-0 outline-none active:outline-none ring-offset-0 relative pulse-animation-short min-[400px]:py-[2px] min-[640px]:py-[4px]"
                }
              />
              <TimeRange
                rpDate={handleRangeDate}
                rpResponse={""}
              />
              <Tooltip title="Filter de date by generic filter or selecting a specific range 🤓">
                <div className="text-white w-[10px]">
                  <UniversalCategoIcon
                    type={`${"fa/FaRegQuestionCircle"}`}
                    siz={15}
                  />
                </div>
              </Tooltip>
            </div>
          </div>
          <div className="content-wallet px-2 bg-stone-100 rounded-t-[50px] rounded-b-[20px] pt-5 pb-[70px]">
            <div className="multi-container lg:flex lg:item">
              <MultiCreditCard
                acc={accounts}
                user={user.fullName}
                trans={transactions}
                mail={session}
              />
            </div>
            <div className="resume-transactions-cont-tabs w-full h-full">
              {allTransactions.length <= 0 ? (
                <div className="w-full py-[20px]">
                  <Skeleton active />
                </div>
              ) : (
                <ResumeTabsTrans timePeriodFromFather={startDate && endDate ? [new Date(startDate), new Date(endDate)] : undefined} />
              )}
            </div>
            <div className="top-3-general-container w-full">
              <div className="w-full top-3-modules-cont flex flex-col justify-center items-center gap-2 lg:flex-col">
                <TopElementsContainer timePeriodFromFather={[new Date(startDate), new Date(endDate)]}/>
              </div>
            </div>
            <div className="wallet-left-col-container w-full h-full">
              <div className="TransactionsDetails w-full h-full">
                {allTransactions.length <= 0 ? (
                  <div className="w-full py-[20px]">
                    <Skeleton active />
                  </div>
                ) : (
                  <TransDetailsGrandContainer
                    tdgcBills={allBills}
                    tdgcInc={allIncomes}
                  />
                )}
              </div>
              <div>
                <div className="asociatedCategories py-3 px-1 flex gap-1 justify-center items-center flex-wrap">
                  {!categories.length > 0 ? (
                    <div className="w-full py-[20px]">
                      <Skeleton active />
                    </div>
                  ) : (
                    categories.map((category) => (
                      <Category
                        category={category}
                        key={`dashboard-categories-min-circle${category._id}`}
                      />
                    ))
                  )}
                </div>
              </div>
            </div>
            <div className="wallet-total-col-container flex flex-col items-center justify-center lg:flex-row lg:gap-2 lg:items-start ">
              {/* <div className="wallet-left-col-container w-full lg:max-w-[50%]">
                <div className="TransactionsDetails w-full h-full">
                  {allTransactions.length <= 0 ? (
                    <div className="w-full py-[20px]">
                      <Skeleton active />
                    </div>
                  ) : (
                    <TransDetailsGrandContainer
                      tdgcBills={allBills}
                      tdgcInc={allIncomes}
                    />
                  )}
                </div>
                <div>
                  <div className="asociatedCategories py-3 px-1 flex gap-1 justify-center items-center flex-wrap">
                    {!categories.length > 0 ? (
                      <div className="w-full py-[20px]">
                        <Skeleton active />
                      </div>
                    ) : (
                      categories.map((category) => (
                        <Category
                          category={category}
                          key={`dashboard-categories-min-circle${category._id}`}
                        />
                      ))
                    )}
                  </div>
                </div>
              </div> */}
              <div className="wallet-right-col-container w-full h-full lg:max-w-[50%]s lg:flex lg:flex-col justify-center items-center">
                <div className="movements w-full h-full max-h-[500px] lg:max-w-[800px] lg:max-h-[1000px] overflow-scroll flex flex-row justify-center items-center">
                  <Movements
                    timePeriodFromFather={startDate && endDate ? [new Date(startDate), new Date(endDate)] : undefined}
                  />
                   
                </div>
                <div className="budget w-full">
                  <BudgetCont bcSession={session} />
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="w-full h-[500px]">
          <Skeleton active />
          <Skeleton active />
          <Skeleton active />
          <Skeleton active />
          <Skeleton active />
          <Skeleton active />
        </div>
      )}
    </div>
  );
}
export default Wallet;
