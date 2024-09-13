"use client";

import React, { useEffect, useState } from "react";
import CategoIcon from "./multiUsedComp/CategoIcon";
import UniversalCategoIcon from "./multiUsedComp/UniversalCategoIcon";

import "@/components/styles/animations.css";
import "@/components/multiUsedComp/css/muliUsed.css";

import MultiCreditCard from "./multiUsedComp/MultiCreditCard";
import Category from "./multiUsedComp/Category";
import Movements from "./multiUsedComp/Movements";
import BudgetCont from "./multiUsedComp/BudgetCont";
//REDUX
import { useDispatch, useSelector } from "react-redux";
import { setGeneralData } from "@/lib/features/loadGeneralDataSlice";
import { fetchUser, setUser } from "@/lib/features/userSlice";
import { fetchWallet, setWallet } from "@/lib/features/walletSlice";
import { fetchAccounts, setAccounts } from "@/lib/features/accountsSlice";
import { fetchCategories, setCategories } from "@/lib/features/categoriesSlice";
import { fetchSubCat, setSubCategories } from "@/lib/features/subCategorySlice";
import { setTags } from "@/lib/features/tagsSlice";
import {
  fetchTrans,
  setTransacctions,
} from "@/lib/features/transacctionsSlice";
//
import ResumeTabsTrans from "./multiUsedComp/ResumeTabsTrans";
import {
  MdKeyboardDoubleArrowUp,
  MdKeyboardDoubleArrowDown,
} from "react-icons/md";
import TransDetailsGrandContainer from "./multiUsedComp/TransDetailsGrandContainer";
import RangePicker from "./multiUsedComp/RangePicker";
import dayjs from "dayjs";
import { Skeleton, Spin, Tooltip } from "antd";
import Top3 from "./multiUsedComp/Top3";
import currencyFormatter from "currency-formatter";
import Top3ContComp from "./multiUsedComp/Top3ContComp";
import { fetchBudget } from "@/lib/features/budgetSlice";
import { quantum } from "ldrs";
import { IoIosCloseCircleOutline } from "react-icons/io";

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
  let [startDate, setStartDate] = useState(null);
  let [endDate, setEndDate] = useState(null);
  //TRANSACTIONS and TYPES OF
  let [allTransactions, setAllTransacctions] = useState([]);
  let [allBills, setAllBills] = useState([]);
  let [allIncomes, setAllIncomes] = useState([]);
  let [totalAmountBalance, setTotalAmountBalance] = useState(0);
  let [totalBill, setTotalBill] = useState(0);
  let [totalIncome, setTotalIncome] = useState(0);
  //LOADER
  const [loading, setLoading] = useState(true);
  //Loader
  quantum.register();
  // Redux
  const dispatch = useDispatch();
  const ccUser = useSelector((state) => state.userReducer);
  const ccWallet = useSelector((state) => state.walletReducer);
  const ccAccounts = useSelector((state) => state.accountsReducer);
  const ccCategories = useSelector((state) => state.categoriesReducer);
  // const ccSubCategories = useSelector((state) => state.subCategoryReducer);
  const ccTransacciones = useSelector((state) => state.transacctionsReducer);
  const ccBudgets = useSelector((state) => state.budgetReducer);

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
    //Transactions
    if (ccTransacciones.status == "idle" && session) {
      dispatch(fetchTrans(session));
    }
    //Budget
    if (ccBudgets.status == "idle" && session) {
      dispatch(fetchBudget(session));
    }
    //
    const today = new Date();
    const start = new Date(today.setDate(today.getDate() - selectedDuration));
    setStartDate(start);
    setEndDate(new Date()); //
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
    // ccSubCategories,
    ccTransacciones,
    ccBudgets,
  ]);

  useEffect(() => {
    const today = new Date();
    const start = new Date(today.setDate(today.getDate() - selectedDuration));
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
        (current, bill) => current + bill.amount,
        0
      );
      const finalIncome = accIncomes.reduce(
        (current, income) => current + income.amount,
        0
      );
      let finalAmount = finalIncome - finalBill;
      setAllTransacctions(total);
      setAllBills(accBills);
      setAllIncomes(accIncomes);
      setTotalAmountBalance(finalAmount);
      setTotalBill(finalBill);
      setTotalIncome(finalIncome);
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

  return (
    <div className="wallet h-full md:pl-[85px] md:pr-[5px] md:pb-[20px] relative">
      <div className="loader">
        {!loading ? (
          ""
        ) : (
          <div className=" fixed w-full h-full left-0 top-0 flex justify-center items-center z-[1009]">
            <div className="w-[90%] h-[70%] sm:w-[50%] bg-white/90 flex flex-col justify-center items-center text-center p-4 gap-4 rounded-2xl z-[1010] shadow-2xl relative">
              <div
                className="close absolute right-0 top-0 cursor-pointer"
                onClick={() => setLoading(!loading)}
              >
                <IoIosCloseCircleOutline size={40} />
              </div>
              <l-quantum size="150" speed="3.1" color="purple"></l-quantum>
              <p className=" text-xl text-purple-800">
                We are building up your dashboard and data
              </p>
              <p className=" text-xl text-purple-800">
                Please wait a moment 🤓
              </p>
            </div>
          </div>
        )}
      </div>
      {user && wallet ? (
        <div className="walllet-header ">
          <div className="wallet-header pt-5 pb-2 px-3 flex flex-col gap-4 justify-between sm:rounded-t-2xl sm:flex-col sm:mx-2 sm:items-center">
            <div className="w-credentials max-w-[620px]">
              <h2 className="text-white text-3xl sm:text-6xl font-thin text-center sm:text-start">
                {!user.fullName ? <Spin size="large" /> : `${user.fullName} `}{" "}
                Wallet
              </h2>
              <div
                className={`text-white flex flex-col text-center items-center justify-center sm:justify-between pt-4 sm:pt-6`}
              >
                <div className="expense-header-cont w-full flex flex-row text-center items-center justify-between px-4">
                  <p className="current-money text-lg font-thin">Incomes:</p>
                  <div className="flex flex-row gap-4">
                    <MdKeyboardDoubleArrowUp className=" w-4 h-4 text-green-400 mt-1.5 overflow-hidden shrink-0 sm:w-6 sm:h-6 sm:mt-1" />
                    <p className={`text-xl flash text-green-400`}>
                      {!totalIncome
                        ? "No amount..."
                        : currencyFormatter.format(totalIncome, {
                            locale: "en-US",
                          })}
                    </p>
                  </div>
                </div>
                <div className="expense-header-cont w-full flex flex-row text-center items-center justify-between px-4">
                  <p className="current-money text-lg font-thin">Expenses:</p>
                  <div className="flex flex-row gap-4">
                    <MdKeyboardDoubleArrowDown className=" w-4 h-4 text-red-400 mt-1.5 overflow-hidden shrink-0 sm:w-6 sm:h-6 sm:mt-1" />
                    <p className={`text-xl flash text-red-400`}>
                      {!totalBill
                        ? "No amount..."
                        : currencyFormatter.format(totalBill, {
                            locale: "en-US",
                          })}
                    </p>
                  </div>
                </div>
                <div className="balance-header-cont w-full flex flex-row text-center items-center justify-between px-4">
                  <p className="current-money text-lg font-thin">Balance:</p>
                  <div className="flex flex-col items-end">
                    <div className="flex gap-2 ">
                      {totalAmountBalance < 0 ? (
                        <MdKeyboardDoubleArrowDown className=" w-4 h-4 text-red-400 mt-1.5 overflow-hidden shrink-0 sm:w-6 sm:h-6" />
                      ) : (
                        <MdKeyboardDoubleArrowUp className=" w-4 h-4 text-green-400 mt-1.5 overflow-hidden shrink-0 sm:w-7 sm:h-7" />
                      )}
                      <p
                        className={`text-2xl flash ${
                          totalAmountBalance < 0
                            ? "text-red-400"
                            : "text-green-400"
                        }`}
                      >
                        {!totalAmountBalance
                          ? "No amount..."
                          : currencyFormatter.format(totalAmountBalance, {
                              locale: "en-US",
                            })}
                      </p>
                    </div>
                    <p className="text-[10px]  pt-1">
                      From {dayjs(startDate).format("DD-MM-YYYY")} to{" "}
                      {dayjs(endDate).format("DD-MM-YYYY")}.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="filters flex items-center justify-center gap-2">
              <div className=" bg-slate-100 text-black w-fit text-[10px] font-light flex items-center justify-center rounded-2xl px-[4px] sm:font-base sm:font-extralight active:border-0 hover:border-0 outline-none active:outline-none ring-offset-0 relative pulse-animation-short min-[400px]:py-[2px] min-[640px]:py-[4px]">
                <select
                  className="bg-transparent w-full pr-4 appearance-none"
                  name="DateSelector"
                  value={selectedDuration}
                  onChange={handleDurationChange}
                >
                  <option value={2}>Yesterday </option>
                  <option value={7}>Las week</option>
                  <option value={15}>Las 15 days</option>
                  <option value={30}>Last 30 days</option>
                  <option value={60}>Last 60 days</option>
                  <option value={90}>Last 90 days</option>
                </select>
                <div className="filterIconContainer absolute right-[3px] pointer-events-none">
                  <CategoIcon type={"MdOutlineArrowDownward"} siz={12} />
                </div>
              </div>
              <RangePicker rpDate={handleRangeDate} rpResponse={""} />
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
              />
            </div>
            <div className="resume-transactions-cont-tabs w-full h-full">
              {allTransactions.length <= 0 ? (
                <div className="w-full py-[20px]">
                  <Skeleton active />
                </div>
              ) : (
                <ResumeTabsTrans rttTrans={allTransactions} />
              )}
            </div>
            <div className="top-3-general-container w-full">
              <h1 className="text-center text-black text-2xl font-bold py-4">
                Top 6 resume
              </h1>
              <div className="w-full top-3-modules-cont flex flex-col justify-center items-center gap-2 lg:flex-col">
                <div className="w-full ">
                  {allTransactions.length <= 0 ? (
                    <div className="w-full py-[20px]">
                      <Skeleton active />
                    </div>
                  ) : (
                    <Top3ContComp t3ccTransactions={allTransactions} />
                  )}
                </div>
                <div className="w-full ">
                  {allTransactions.length <= 0 ? (
                    <div className="w-full py-[20px]">
                      <Skeleton active />
                    </div>
                  ) : (
                    <Top3ContComp
                      t3ccTransactions={allTransactions}
                      ist3ccCategory={true}
                    />
                  )}
                </div>
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
                    movements={allTransactions}
                    incomes={allIncomes}
                    bills={allBills}
                    period={selectedDuration}
                  />
                </div>
                <div className="budget">
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
