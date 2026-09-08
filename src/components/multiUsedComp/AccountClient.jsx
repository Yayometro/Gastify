"use client";

import Image from "next/image";
import { useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import EmptyModule from "./EmptyModule";
import UniversalCategoIcon from "./UniversalCategoIcon";
import "@/components/styles/animations.css";
import { Switch, Spin, ConfigProvider, Space, Input, Tooltip, Skeleton } from "antd";
import runNotify from "@/helpers/gastifyNotifier";
import fetcher from "@/helpers/fetcher";
import MultiCreditCard from "./MultiCreditCard";
import CategoIcon from "./CategoIcon";
import TimeRange from "@/components/Filters/timeRange/TimeRange";
import SelecterFilter from "@/components/Filters/selecterFilter/SelecterFilter";
import {
  generate_timeperiod_ranges_array_for_dashboard,
  getLastDayOfMonth,
  getDateInYearMonthDay,
} from "@/helpers/timeFunctions/timeFunctions";
import { getTransactionsFromTimeRange } from "@/helpers/transformers/transactionsChange";
import ResumeTabsTrans from "./ResumeTabsTrans";
import TransDetailsGrandContainer from "./TransDetailsGrandContainer";
import DisplayerCategoryTreemap from "./DisplayerCategoryTreemap";
import EditAccountModal from "./EditAccountModal";
import PrimaryCurrencySelector from "./PrimaryCurrencySelector";
import { fetchUser } from "@/lib/features/userSlice";
import { fetchWallet } from "@/lib/features/walletSlice";
import { fetchCategories } from "@/lib/features/categoriesSlice";
import { fetchSubCat } from "@/lib/features/subCategorySlice";
import { fetchAccounts } from "@/lib/features/accountsSlice";
import { fetchTrans } from "@/lib/features/transacctionsSlice";

function AccountClient({acSession}) {
  const [onEdition, setOnEdition] = useState(false);
  // DATES
  let [selectedDuration, setSelectedDuration] = useState(30);
  let [startDate, setStartDate] = useState(null);
  let [endDate, setEndDate] = useState(null);
  //TRANSACTIONS and TYPES OF
  let [allTransactions, setAllTransacctions] = useState([]);
  let [finalAccounts, setFinalAccounts] = useState([]);
  let [carruselCurrent, setCarruselCurrent] = useState(0);
  // Independent time-period filter for "Account movements details" (the
  // Treemap) - same pattern as ResumeTabsTrans's own local filter, so this
  // section can be scoped to a different range than the page-level filter
  // above without moving it.
  const today = new Date();
  const [treemapTimePeriod, setTreemapTimePeriod] = useState([
    new Date(today.getFullYear(), today.getMonth(), 1),
    getLastDayOfMonth(today.getFullYear(), today.getMonth()),
  ]);
  const treemapTimePeriodsForSelecter = generate_timeperiod_ranges_array_for_dashboard(today.getFullYear());
  const searchParams = useSearchParams();
  const targetAccountId = searchParams.get("accountId");
  // Redux
  const dispatch = useDispatch()
  const ccUser = useSelector((state) => state.userReducer)
  const ccWallet = useSelector((state) => state.walletReducer)
  const ccAccounts = useSelector((state) => state.accountsReducer)
  const ccCategories = useSelector((state) => state.categoriesReducer)
  const ccSubCategories = useSelector((state) => state.subCategoryReducer)
  const ccTransacciones = useSelector((state) => state.transacctionsReducer)

  const userData = ccUser.data;
  const walletData = ccWallet.data;
  const accountData = ccAccounts.data;
  const transactionData = ccTransacciones.data;
  
  let nameGeneral = userData?.fullName;
  
  // FETCHER
  const toFetch = fetcher();
  // START USE EFFECTS
  useEffect(() => {
    // User
    if(ccUser.status == 'idle'){
      dispatch(fetchUser(acSession))
    }
    // Wallet
    if(ccWallet.status == 'idle'){
      dispatch(fetchWallet(acSession))
    }
    // Account
    if(ccAccounts.status == 'idle'){
      dispatch(fetchAccounts(acSession))
    }
    //Transactions
    if(ccTransacciones.status == 'idle'){
      // console.log('first')
      dispatch(fetchTrans(acSession))
    }
  }, []);
  //Use effect for range
  useEffect(() => {
    const today = new Date();
    const start = new Date(today.setDate(today.getDate() - selectedDuration));
    setStartDate(start);
    setEndDate(new Date()); //
  }, []);
  //Use effect for select duration
  useEffect(() => {
    const today = new Date();
    const start = new Date(today.setDate(today.getDate() - selectedDuration));
    setStartDate(start);
  }, [selectedDuration]);
  //Use effect to SET data
  useEffect(() => {
    if (accountData) {
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
      if (transactionData.length > 0 && accountData) {
        let total = transactionData.filter((tra) => {
          const transactionDate = new Date(tra.date || tra.createdAt);
          return (
            transactionDate >= startFilterDate &&
            transactionDate <= endFilterDate
          );
        });
        total = total.sort((a, b) => {
          let dateA = new Date(a.date || a.createdAt);
          let dateB = new Date(b.date || b.createdAt);

          return dateB - dateA;
        });
        const accBills = total.filter((bill) => bill.isBill && !bill.isIncome);
        const accIncomes = total.filter(
          (bill) => bill.isIncome && !bill.isBill
        );
        setAllTransacctions(total);
        //Divide by the number of accounts
        const accToObject = accountData.reduce((obj, acc) => {
          if (!obj[acc._id]) {
            obj[acc._id] = {
              ...acc,
              allTransactionsList: [],
              billsList: [],
              incomesList: [],
            };
          }
          return obj;
        }, {});
        const dividedArr = Object.values(accToObject);
        dividedArr.forEach((acc) => {
          total.forEach((tra) => {
            if (tra?.account?._id === acc._id) {
              acc.allTransactionsList.push(tra);
              if (tra.isBill) {
                acc.billsList.push(tra);
              } else {
                acc.incomesList.push(tra);
              }
            }
          });
        });
        setFinalAccounts(dividedArr);
      }
    }
  }, [accountData, transactionData, selectedDuration, startDate, endDate]);

  function getTreemapValueFromSelecter(v) {
    const [start, end] = v.split("*");
    setTreemapTimePeriod([new Date(start), new Date(end)]);
  }

  function handleTreemapRangeDate(dateStart, dateEnd) {
    if (dateStart && dateEnd) {
      setTreemapTimePeriod([dateStart, dateEnd]);
    }
  }

  const handleChange = (e, tp) => {
    const { name, value } = e.target;
    console.log(name, value);
    setUserInfo({ ...userInfo, [name]: value });
  };
  const handleDurationChange = (event) => {
    setSelectedDuration(parseInt(event.target.value, 10));
  };
  const handleRangeDate = (sDate, eDate) => {
    setStartDate(sDate);
    setEndDate(eDate);
  };

  useEffect(() => {
    if (finalAccounts.length > 0) {
      if (carruselCurrent > finalAccounts.length) {
        setCarruselCurrent(0);
      }
      if (carruselCurrent < 0) {
        setCarruselCurrent(finalAccounts.length - 1);
      }
    }
  }, [carruselCurrent, finalAccounts]);

  // Deep-link support: a CreditCard's title links here as
  // /dashboard/accounts?accountId=<id>, jumping the carousel straight to it.
  useEffect(() => {
    if (targetAccountId && finalAccounts.length > 0) {
      const idx = finalAccounts.findIndex((a) => String(a._id) === String(targetAccountId));
      if (idx >= 0) setCarruselCurrent(idx);
    }
  }, [targetAccountId, finalAccounts]);

  return (
    <div className=" w-full h-full sm:pr-2">
        <div className="w-full h-full relative">
          <div className="w-full profile-img py-4 text-center text-white">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-thin">
              {
                nameGeneral == undefined || nameGeneral == '' ? (<Spin />) : 
                (`${nameGeneral} `)
              }
              {' '}Accounts
            </h1>
          </div>
          <div className="filters flex items-center justify-center gap-2">
            <div className="gf-glass-card text-gf-text w-fit text-[10px] font-light flex items-center justify-center rounded-2xl px-[4px] sm:font-base sm:font-extralight active:border-0 hover:border-0 outline-none active:outline-none ring-offset-0 relative min-[400px]:py-[2px] min-[640px]:py-[4px]">
              <select
                className="bg-transparent appearance-none w-full pr-4"
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
            <TimeRange rpDate={handleRangeDate} startDateValue={startDate} endDateValue={endDate} />
            <Tooltip title="Filter de date by generic filter or selecting a specific range 🤓">
              <div className="text-white w-[10px]">
                <UniversalCategoIcon
                  type={`${"fa/FaRegQuestionCircle"}`}
                  siz={15}
                />
              </div>
            </Tooltip>
          </div>
          <div className="filters flex items-center justify-center pt-2">
            <PrimaryCurrencySelector pcsWallet={walletData} />
          </div>
          <div className="content-profile-cont w-full h-full content-wallet-glass text-center items-center mt-[10px] sm:mt-[20px] rounded-t-[100px] rounded-b-2xl px-2">
            <h1 className="3xl w-full "></h1>
            <div className="account-multi-cc-container w-full py-4">
                <MultiCreditCard
                  acc={accountData}
                  user={userData}
                  trans={transactionData}
                  walletPrimaryCurrency={walletData?.primaryCurrency}
                  mail={acSession}
                />
            </div>
            <div className="ac-dashboard-client w-full-h-full">
              {!finalAccounts.length > 0 ? (
                <div className="w-full h-[500px]">
                  <Skeleton active />
                  <Skeleton active />
                  <Skeleton active />
                </div>
              ) : (
                <div className="general-content-acc-ac w-full">
                    <EditAccountModal eamMode={onEdition} eamAccount={finalAccounts[carruselCurrent] || null} eamWallet={walletData} eamClose={e => setOnEdition(e)}
                    />
                  <div className="w-full flex justify-center items-center gap-3">
                    <button
                      type="button"
                      aria-label="Previous account"
                      className="gf-glass-fab w-[44px] h-[44px] shrink-0"
                      onClick={() => {
                        const prevIndex = carruselCurrent - 1;
                        setCarruselCurrent(
                          prevIndex < 0 ? finalAccounts.length - 1 : prevIndex
                        );
                      }}
                    >
                      <UniversalCategoIcon
                        type={`md/MdChevronLeft`}
                        siz={26}
                      />
                    </button>
                    <h1 className="text-[30px] min-[350px]:text-[40px] sm:text-[60px] font-light">
                      {finalAccounts[carruselCurrent]?.name || "No name data..."}
                    </h1>
                    <button
                      type="button"
                      aria-label="Next account"
                      className="gf-glass-fab w-[44px] h-[44px] shrink-0"
                      onClick={() => {
                        const nextIndex = carruselCurrent + 1;
                        setCarruselCurrent(
                          nextIndex >= finalAccounts.length ? 0 : nextIndex
                        );
                      }}
                    >
                      <UniversalCategoIcon
                        type={`md/MdChevronRight`}
                        siz={26}
                      />
                    </button>
                  </div>
                  <div className="w-full flex justify-center items-center gap-2 mb-6">
                    <div
                        className="w-[200px] flex gap-2 justify-center items-center gf-glass-button rounded-3xl cursor-pointer"
                        onClick={() => setOnEdition('edition')}
                    >
                        <p className="text-white">Edit Account</p>
                        <div className=" flex justify-center items-center">
                          <CategoIcon type={`MdModeEdit`} siz={25} />
                        </div>
                    </div>
                    <div
                        className="w-[200px] flex gap-2 justify-center items-center gf-glass-button rounded-3xl cursor-pointer"
                        onClick={() => setOnEdition('creation')}
                    >
                        <p className="text-white">New Account</p>
                        <div className=" flex justify-center items-center">
                          <CategoIcon type={`MdAddCircleOutline`} siz={25} />
                        </div>
                    </div>
                  </div>
                  <div className="sub-resume-transactions-cont-tabs w-full h-full">
                    {
                      finalAccounts.length <= 0 ? (
                        <Skeleton active />
                      ) : (
                        <ResumeTabsTrans
                          rttTrans={
                            finalAccounts[carruselCurrent]?.allTransactionsList
                          }
                        />
                      )
                    }
                  </div>
                  <div className="ac-TransactionsDetails w-full h-full mt-10">
                    <h1 className=" font-bold text-2xl sm:text-3xl">
                      Account movements details
                    </h1>
                    <div className="filters flex flex-col justify-center items-center mb-2">
                      <span className="text-xs">
                        From:{" "}
                        <b>{treemapTimePeriod[0] ? getDateInYearMonthDay(treemapTimePeriod[0]) : "No time selected"}</b>
                        {" "}to:{" "}
                        <b>{treemapTimePeriod[1] ? getDateInYearMonthDay(treemapTimePeriod[1]) : "No time selected"}</b>
                      </span>
                      <div className="filters w-full h-full flex items-center justify-center flex-wrap gap-2">
                        <Tooltip title="Filter by date using a preset range or selecting a specific range 🤓">
                          <div className="text-gf-text w-[10px]">
                            <UniversalCategoIcon type="fa/FaRegQuestionCircle" siz={15} />
                          </div>
                        </Tooltip>
                        <SelecterFilter
                          getValue={getTreemapValueFromSelecter}
                          periodFromFather={treemapTimePeriodsForSelecter[0]}
                          periodOverride={treemapTimePeriodsForSelecter}
                          styles="gf-glass-card text-gf-text w-fit text-[10px] font-light flex items-center justify-center rounded-2xl px-[4px] sm:font-base sm:font-extralight active:border-0 hover:border-0 outline-none active:outline-none ring-offset-0 relative pulse-animation-short min-[400px]:py-[2px] min-[640px]:py-[4px]"
                        />
                        <TimeRange rpDate={handleTreemapRangeDate} />
                      </div>
                    </div>
                    {!finalAccounts[carruselCurrent]?.billsList ? (
                      <Skeleton active/>
                      ) : !finalAccounts[carruselCurrent]?.incomesList ? (
                      <Skeleton active/>
                    ) : (
                      <div className="w-full h-full">
                        <DisplayerCategoryTreemap
                          dccpIncomes={getTransactionsFromTimeRange(
                            finalAccounts[carruselCurrent]?.incomesList || [],
                            treemapTimePeriod[0],
                            treemapTimePeriod[1]
                          )}
                          dccoBills={getTransactionsFromTimeRange(
                            finalAccounts[carruselCurrent]?.billsList || [],
                            treemapTimePeriod[0],
                            treemapTimePeriod[1]
                          )}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
    </div>
  );
}

export default AccountClient;
