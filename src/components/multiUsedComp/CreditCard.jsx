"use client";
import React, { useEffect, useState } from "react";
import "@/components/styles/animations.css";
import Image from "next/image";
import randomColor from "randomcolor";

import {
  MdKeyboardDoubleArrowUp,
  MdKeyboardDoubleArrowDown,
} from "react-icons/md";
import "animate.css";
import CategoIcon from "./CategoIcon";
import { IoColorPalette } from "react-icons/io5";
import { FaRegQuestionCircle } from "react-icons/fa";
import { Tooltip } from "antd";
import { TbLetterCaseToggle } from "react-icons/tb";

function CreditCard({ acc, user, trans, cardColor, current }) {
  let [userName, setUserName] = useState("");
  let [allTransactions, setAllTransacctions] = useState([]);
  let [account, setAccount] = useState([]);
  let [totalReadTransactions, setTotalReadTransactions] = useState([]);
  let [billTransactions, setBillTransactions] = useState([]);
  let [incomeTransactions, setIncomeTransactions] = useState([]);
  let [totalAmount, setTotalAmount] = useState(0);
  let [totalBill, setTotalBill] = useState(0);
  let [totalIncome, setTotalIncome] = useState(0);
  let [selectedDuration, setSelectedDuration] = useState(30);
  let [lastDayRange, setLastDayRange] = useState(new Date());
  let [cardColore, setCardColore] = useState("");
  let [manualColor, setManualColor] = useState(false);

  useEffect(() => {
    if (acc && user && trans) {
      // console.log(acc)
      // console.log(user)
      // console.log(trans)
      setUserName(user);
      setAllTransacctions(trans);
      setAccount(acc);
      setCardColore(cardColor);
    }
  }, [acc, user, trans]);

  useEffect(() => {
    const today = new Date();
    const dayRange = new Date();
    dayRange.setDate(today.getDate() - selectedDuration);
    if (allTransactions.length > 0 && account) {
      let total = allTransactions.filter(
        (tra) => tra.account?._id === account._id && tra.isReadable
      );
      total = total.filter((tra) => {
        const transactionDate = new Date(tra.date || tra.createdAt);
        return transactionDate >= dayRange;
      });
      const accBills = total.filter((bill) => bill.isBill);
      const accIncomes = total.filter((bill) => bill.isIncome);
      const finalAmount = total.reduce(
        (current, tra) => current + tra.amount,
        0
      );
      const finalBill = accBills.reduce(
        (current, bill) => current + bill.amount,
        0
      );
      const finalIncome = accIncomes.reduce(
        (current, income) => current + income.amount,
        0
      );
      setTotalReadTransactions(total);
      setBillTransactions(accBills);
      setIncomeTransactions(accIncomes);
      setTotalAmount(finalAmount);
      setTotalBill(finalBill);
      setTotalIncome(finalIncome);
      //
      // console.log(allTransactions);
      // console.log(account);
      // console.log(selectedDuration);
    }
  }, [allTransactions, account, selectedDuration]);

  const handleDurationChange = (event) => {
    setSelectedDuration(parseInt(event.target.value, 10));
  };

  const generateRandomColor = () => {
    const color1 = randomColor();
    const color2 = randomColor();

    return `linear-gradient(90deg, ${color1} 0%, ${color2} 100%)`;
  };
  const changeColor = () => {
    setCardColore(generateRandomColor());
  };
  const changeColorHandler = () => {
    // Solo cambia el color si no ha sido cambiado manualmente
    if (!manualColor) {
      changeColor();
    }
  };

  return (
    <div className="pulse-animation-short ">
      <div
        style={{
          background:
            cardColore ||
            "linear-gradient(90deg, rgba(131,58,180,1) 0%, rgba(18,127,205,1) 100%)",
        }}
        className=" shadow-2xl flex flex-col px-4 py-4 rounded-3xl w-[300px] max-w-[300px] sm:min-w-[450px] sm:max-h-[330px] md:min-w-[500px] sm:px-5 sm:py-5 m-1"
      >
        <div className="flex justify-between items-stretch my-auto">
          <div
            className="text-white w-[5px] sm:font-base sm:w-[20px] pulse-animation-short"
            onClick={changeColorHandler}
          >
            <IoColorPalette size={17} />
          </div>
          <div className="filters flex items-center justify-center">
            <div className="text-white w-fit text-sm font-thin flex items-center justify-center sm:font-base sm:font-extralight active:border-0 hover:border-0 outline-none active:outline-none ring-offset-0 relative pulse-animation-short">
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
              <div className="filterIconContainer absolute right-[0px] pointer-events-none">
                <CategoIcon type={"MdOutlineArrowDownward"} siz={12} />
              </div>
            </div>
            <Tooltip title="Select the color palette to change the color gradient of your credit card. Or select the time period to see the balance for the time you want 🤓">
              <div className="text-white pl-4">
                <FaRegQuestionCircle size={15} />
              </div>
            </Tooltip>
          </div>
        </div>
        <div className="flex items-center justify-between gap-5 max-md:max-w-full max-md:flex-nowrap relative">
          <Tooltip title={!account.name ? "Generic account" : account.name}>
            <div className="flex my-auto truncate">
              <p className="max-w-fit text-white text-2xl font-bold mt-1 sm:text-4xl break-word text-ellipsis overflow-hidden group">
                {!account.name ? "Generic account" : account.name}
              </p>
            </div>
          </Tooltip>
          <Image
            src="/creditcard/chipSim.png"
            width="100"
            height="100"
            alt="chip"
            className="aspect-square object-contain object-center max-w-[50px] sm:min-w-[70px]"
          />
        </div>
        {!current ? (
          ""
        ) : (
          <div className="z-[1] flex gap-2.5 mt-3 self-end items-start sm:mt-5">
            <div className="text-white text-sm font-thin sm:font-base sm:font-extralight ">
              Current:
            </div>
            <div className="text-white text-xl font-extralight self-stretch grow whitespace-nowrap sm:text-4xl pulse-animation-short">
              $ {account.amount ? account.amount.toFixed(2) : 0}
            </div>
          </div>
        )}
        <div className="z-[1] flex gap-2.5 mt-3 self-end items-start sm:mt-5">
          <MdKeyboardDoubleArrowUp className=" w-4 h-4 text-green-400 mt-1.5 overflow-hidden shrink-0 sm:w-7 sm:h-7 sm:mt-1 md:w-8 md:h-8 md:mt-1 " />
          <div className="text-white text-xl font-extralight self-stretch grow whitespace-nowrap sm:text-4xl pulse-animation-short">
            $ {!totalIncome ? "No incomes... 🤕" : totalIncome.toFixed(2)}
          </div>
        </div>
        <div className="flex gap-2.5 self-end items-start sm:mt-2">
          <MdKeyboardDoubleArrowDown className=" w-4 h-4 text-red-400 mt-1.5 overflow-hidden shrink-0 sm:w-7 sm:h-7 sm:mt-1 md:w-8 md:h-8 md:mt-1" />
          <div className="text-white text-xl font-extralight self-stretch grow whitespace-nowrap sm:text-4xl pulse-animation-short">
            $ {!totalBill ? "No bills..." : totalBill.toFixed(2)}
          </div>
        </div>
        <div className="w-full flex justify-between items-center gap-3 mt-3 sm:mt-5">
          <div className="text-white text-[10px] whitespace-nowrap mt-1.5 sm:text-lg">
            Balance:
          </div>
          <div className="flex gap-2.5 self-end items-start sm:mt-2">
            {totalIncome - totalBill < 0 ? (
              <MdKeyboardDoubleArrowDown className=" w-4 h-4 text-red-400 mt-1.5 overflow-hidden shrink-0 sm:w-7 sm:h-7 sm:mt-1 md:w-8 md:h-8 md:mt-1" />
            ) : (
              <MdKeyboardDoubleArrowUp className=" w-4 h-4 text-green-400 mt-1.5 overflow-hidden shrink-0 sm:w-7 sm:h-7 sm:mt-1 md:w-8 md:h-8 md:mt-1" />
            )}

            <div className="text-white text-2xl font-base whitespace-nowrap sm:text-5xl pulse-animation-short">
              {!totalAmount ? (
                <p className="text-xl sm:text-xl">No transactions... 🤕</p>
              ) : (
                `$ ${(totalIncome - totalBill).toFixed(2)}`
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CreditCard;
