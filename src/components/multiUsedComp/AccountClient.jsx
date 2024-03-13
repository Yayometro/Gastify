"use client";

import Image from "next/image";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import EmptyModule from "./EmptyModule";
import UniversalCategoIcon from "./UniversalCategoIcon";
import "@/components/animations.css";
import { Switch, Spin, ConfigProvider, Space, Input, Tooltip, Skeleton } from "antd";
import runNotify from "@/helpers/gastifyNotifier";
import fetcher from "@/helpers/fetcher";
import MultiCreditCard from "./MultiCreditCard";
import CategoIcon from "./CategoIcon";
import RangePicker from "./RangePicker";
import ResumeTabsTrans from "./ResumeTabsTrans";
import TransDetailsGrandContainer from "./TransDetailsGrandContainer";
import DisplayerCategoryCirclePacking from "./DisplayerCategoryCirclePacking";
import EditAccountModal from "./EditAccountModal";
import { fetchUser } from "@/lib/features/userSlice";
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
  // Redux
  const dispatch = useDispatch()
  const ccUser = useSelector((state) => state.userReducer)
  const ccAccounts = useSelector((state) => state.accountsReducer)
  const ccCategories = useSelector((state) => state.categoriesReducer)
  const ccSubCategories = useSelector((state) => state.subCategoryReducer)
  const ccTransacciones = useSelector((state) => state.transacctionsReducer)

  const userData = ccUser.data;
  const accountData = ccAccounts.data;
  const transactionData = ccTransacciones.data;
  // const categoriesData = ccCategories.data.user.concat(ccCategories.data.default)
  // const subCatData = ccSubCategories.data.subCat.concat(ccCategories.data.default)
  let nameGeneral = userData?.fullName;
  // console.log(nameGeneral)
  //
  // console.log(userData)
  // console.log(accountData)
  // console.log(transactionData)
  // console.log(categoriesData)
  // console.log(subCatData)
  // console.log(nameGeneral)
  // FETCHER
  const toFetch = fetcher();
  // START USE EFFECTS
  useEffect(() => {
    // User
    if(ccUser.status == 'idle'){
      console.log('first')
      dispatch(fetchUser(acSession))
    }
    // Account
    if(ccAccounts.status == 'idle'){
      console.log('first') 
      dispatch(fetchAccounts(acSession))
    }
    // //Categories
    // if(ccCategories.status == 'idle'){
    //   console.log('first')
    //   dispatch(fetchCategories(acSession))
    // }
    // //Sub-categories
    // if(ccSubCategories.status == 'idle'){
    //   console.log('first')
    //   dispatch(fetchSubCat(acSession))
    // }
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
        // console.log(startDate);
        // console.log(endDate);
        startFilterDate = startDate;
        endFilterDate = endDate;
      } else {
        // console.log(selectedDuration);
        const today = new Date();
        startFilterDate = new Date(
          today.setDate(today.getDate() - selectedDuration)
        );
        endFilterDate = new Date();
      }
      // console.log(startFilterDate);
      // console.log(endFilterDate);
      //TRANS
      if (transactionData.length > 0 && accountData) {
        // console.log(transactionData)
        // console.log(accountData)
        let total = transactionData.filter((tra) => {
          const transactionDate = new Date(tra.date || tra.createdAt);
          return (
            transactionDate >= startFilterDate &&
            transactionDate <= endFilterDate
          );
        });
        // console.log(total)
        total = total.sort((a, b) => {
          let dateA = new Date(a.date || a.createdAt);
          let dateB = new Date(b.date || b.createdAt);

          return dateB - dateA;
        });
        // console.log(total)
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
        // console.log(accToObject)
        const dividedArr = Object.values(accToObject);
        // console.log(dividedArr)
        dividedArr.forEach((acc) => {
          // console.log(acc)
          total.forEach((tra) => {
            // console.log(tra)
            if (tra?.account?._id === acc._id) {
              // console.log(acc)
              acc.allTransactionsList.push(tra);
              if (tra.isBill) {
                acc.billsList.push(tra);
              } else {
                acc.incomesList.push(tra);
              }
            }
          });
        });
        // console.log(dividedArr)
        setFinalAccounts(dividedArr);
      }
    }
  }, [accountData, transactionData, selectedDuration, startDate, endDate]);

  const handleChange = (e, tp) => {
    const { name, value } = e.target;
    console.log(name, value);
    setUserInfo({ ...userInfo, [name]: value });
  };
  const handleDurationChange = (event) => {
    setSelectedDuration(parseInt(event.target.value, 10));
  };
  const handleRangeDate = (sDate, eDate) => {
    // console.log(sDate);
    // console.log(eDate);
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


  // console.log(carruselCurrent);
  return (
    <div className=" w-full h-full sm:pr-2">
        <div className="w-full h-full relative">
          <div className="w-full profile-img py-[40px] text-center text-white">
            <h1 className="text-3xl min-[400px]:text-[40px] sm:text-[40px] md:text-[60px] font-thin">
              {
                nameGeneral == undefined || nameGeneral == '' ? (<Spin />) : 
                (`${nameGeneral} `)
              }
              {' '}Accounts
            </h1>
          </div>
          <div className="filters flex items-center justify-center gap-2">
            <div className=" bg-slate-100 text-black w-fit text-[10px] font-light flex items-center justify-center rounded-2xl px-[4px] sm:font-base sm:font-extralight active:border-0 hover:border-0 outline-none active:outline-none ring-offset-0 relative pulse-animation-short min-[400px]:py-[2px] min-[640px]:py-[4px]">
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
          <div className="content-profile-cont w-full h-full bg-slate-100 text-center items-center mt-[10px] sm:mt-[20px] rounded-t-[100px] rounded-b-2xl shadow-sm px-2">
            <h1 className="3xl w-full "></h1>
            <div className="account-multi-cc-container w-full py-4">
                <MultiCreditCard
                  acc={accountData}
                  user={userData}
                  trans={transactionData}
                />
            </div>
            <div className="bg-purple-100 w-full flex justify-between items-center border-2 border-purple-400 rounded-3xl">
              <div
                className="ac-leftArrowSelector cursor-pointer p-1 flex justify-center items-center"
                onClick={() => {
                  const prevIndex = carruselCurrent - 1;
                  setCarruselCurrent(
                    prevIndex < 0 ? finalAccounts.length - 1 : prevIndex
                  );
                }}
              >
                <UniversalCategoIcon
                  type={`fa/FaArrowAltCircleLeft`}
                  siz={30}
                />
              </div>
              <div className="ac-current-acc text-purple-500">
                {finalAccounts[carruselCurrent]?.name}
              </div>
              <div
                className="ac-rightArrowSelector cursor-pointer p-1 flex justify-center items-center first-letter"
                onClick={() => {
                  const nextIndex = carruselCurrent + 1;
                  setCarruselCurrent(
                    nextIndex >= finalAccounts.length ? 0 : nextIndex
                  );
                }}
              >
                <UniversalCategoIcon
                  type={`fa/FaArrowAltCircleRight`}
                  siz={30}
                />
              </div>
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
                    <EditAccountModal eamMode={onEdition} eamAccount={finalAccounts[carruselCurrent] || null}  eamClose={e => setOnEdition(e)}
                    />
                  <h1 className="text-[30px] min-[350px]:text-[40px] sm:text-[60px] font-light">
                    {finalAccounts[carruselCurrent]?.name || "No name data..."}
                  </h1>
                  <div className="w-full flex justify-center items-center gap-2">
                    <div 
                        className="w-[200px] flex gap-2 justify-center items-center border-2 border-purple-400 bg-purple-100 hover:bg-purple-300 rounded-3xl cursor-pointer"
                        onClick={() => setOnEdition('edition')}
                    >
                        <p className=" text-purple-600">Edit Account</p>
                        <div className=" flex justify-center items-center">
                          <CategoIcon type={`MdModeEdit`} siz={25} />
                        </div>
                    </div>
                    <div 
                        className="w-[200px] flex gap-2 justify-center items-center border-2 border-purple-400 bg-purple-100 hover:bg-purple-300 rounded-3xl cursor-pointer"
                        onClick={() => setOnEdition('creation')}
                    >
                        <p className=" text-purple-600">New Account</p>
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
                  <div className="ac-TransactionsDetails w-full h-full">
                    <h1 className=" font-bold text-2xl sm:text-3xl">
                      Account movements details
                    </h1>
                    {!finalAccounts[carruselCurrent]?.billsList ? (
                      <Skeleton active/>
                      ) : !finalAccounts[carruselCurrent]?.incomesList ? (
                      <Skeleton active/>
                    ) : (
                      <div className="w-full h-full">
                        <DisplayerCategoryCirclePacking
                          dccpIncomes={
                            finalAccounts[carruselCurrent]?.incomesList
                          }
                          dccoBills={finalAccounts[carruselCurrent]?.billsList}
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
