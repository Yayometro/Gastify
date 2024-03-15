import React, { useEffect, useState } from "react";
import TabsTrans from "./TabsTrans";
import { Skeleton, Tooltip } from "antd";
import UniversalCategoIcon from "./UniversalCategoIcon";
import EmptyModule from "./EmptyModule";

function ResumeTabsTrans({ rttIncomes, rttBills, rttTrans }) {
  let [isBillTab, setIsBillTab] = useState(true);
  const [allBills, setAllBills] = useState([]);
  const [allIncomes, setAllIncomes] = useState([]);
  const [timePeriod, setTimePeriod] = useState(30);
  let [today, setToday] = useState(new Date());
  useEffect(() => {
    const today = new Date();
    const dayRange = new Date();
    //DATE
    dayRange.setDate(today.getDate() - timePeriod);
    //
    //if trans don't exist
    if(rttTrans.length > 0){
      let total = rttTrans.filter((mov) => {
        const transactionDate = new Date(mov.date || mov.createdAt);
        return transactionDate >= dayRange;
      });
      total = total.sort((a, b) => {
        let dateA = new Date(a.date || a.createdAt);
        let dateB = new Date(b.date || b.createdAt);
  
        return dateB - dateA;
      });
      const accBills = total.filter((bill) => bill.isBill && !bill.isIncome);
      const accIncomes = total.filter((bill) => bill.isIncome && !bill.isBill);
  
      setAllBills(accBills);
      setAllIncomes(accIncomes);
    }
  }, [rttTrans, timePeriod]);

  const handleDurationChange = (event) => {
    setTimePeriod(parseInt(event.target.value, 10));
  };

  const handleTab = (budType) => {
    if (budType === "bill") {
      setIsBillTab(true);
    } else {
      setIsBillTab(false);
    }
  };
  return (
    <div className="rtt-cont w-full h-full">
      <h1 className="text-2xl text-center font-semibold pt-3">
        Transactions Resume
      </h1>
      <div className="filters flex items-center justify-center">
        <div className="w-fit text-[10px] font-light flex items-center justify-center sm:font-base sm:font-extralight active:border-0 hover:border-0 outline-none active:outline-none ring-offset-0 relative pulse-animation-short">
          <select
            className="bg-transparent appearance-none w-full pr-4"
            name="DateSelector"
            value={timePeriod}
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
            <UniversalCategoIcon type={"md/MdOutlineArrowDownward"} siz={12} />
          </div>
        </div>
      </div>
      <div className="bc-tab-headers-cont w-full text-center flex justify-center items-center gap-2">
        <div
          onClick={() => handleTab("bill")}
          className={`tab-rtt-bill p-4 cursor-pointer hover:text-purple-400 ${
            isBillTab ? "border-b-2 border-purple-600 text-purple-600 " : ""
          }`}
        >
          Bills Resume
        </div>
        <div
          onClick={() => handleTab("")}
          className={`tab-rtt-inc p-4 cursor-pointer hover:text-purple-400 ${
            !isBillTab ? "border-b-2 border-purple-600 text-purple-600 " : ""
          }`}
        >
          Income Resume
        </div>
        <Tooltip title="This module is affected by the general time selection of the dashboard. So if the dashboard filters at last 30 days. Even if you in this module are using the filter of *Last 60 days* it won't work. So first review the time selection on the general dashboard and then filter at the module level.
        If you want more details about the charts, just hover over the chart and column you're interested in 😎">
          <div className="">
            <UniversalCategoIcon
              type={`${"fa/FaRegQuestionCircle"}`}
              siz={15}
            />
          </div>
        </Tooltip>
      </div>
      <div className="rtt-content-cont">
        <div
          className={`rtt-sub-cont w-full h-full ${isBillTab ? "" : "hidden"}`}
        >
          {allBills.length <= 0 ? (
            <div className="w-full py-[20px]">
              <EmptyModule
                emMessage={`Ups... Nothing here 🤔. 
                If this module is empty, maybe you do not have data (transactions) enough or there is no data in this time-period.
                Try with a time-period older, like 3 months or 6 months to check. Or add new transactions to display data 😉`}
              />
            </div>
          ) : (
            <TabsTrans
              ttTrans={allBills}
              ttIsbill={true}
              ttHorizontal={false}
            />
          )}
        </div>
        <div
          className={`rtt-sub-cont w-full h-full ${isBillTab ? "hidden" : ""}`}
        >
          {allIncomes.length <= 0 ? (
            <div className="w-full py-[20px]">
            <EmptyModule
              emMessage={`Ups... Nothing here 🤔. 
              If this module is empty, maybe you do not have data (transactions) enough or there is no data in this time-period.
              Try with a time-period older, like 3 months or 6 months to check. Or add new transactions to display data 😉`}
            />
          </div>
          ) : (
            <TabsTrans
              ttTrans={allIncomes}
              ttIsbill={false}
              ttHorizontal={false}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default ResumeTabsTrans;
