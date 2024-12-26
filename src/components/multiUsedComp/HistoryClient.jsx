"use client";
import { fetchUser, setUser } from "@/lib/features/userSlice";
import { Spin } from "antd";
import React, { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import DashboardLoadingMessage from "./loaders/DashboardLoadingMessage";
import TabsToggler from "./TabsComponents/TabsToggler";
import TabsTogglerMontlyController from "./TabsComponents/tabsMontlyTransactions/TabsTogglerMontlyController";

function HistoryClient({ email }) {
  const [isLoading, setIsLoading] = useState(false);

  const dispatch = useDispatch();
  const ccUser = useSelector((state) => state.userReducer);
  const user = ccUser.data;

  const toggleIsLoading = useCallback(() => {
    setIsLoading((prev) => !prev);
  }, []);

  useEffect(() => {
    // User
    if (ccUser.status == "idle" && email) {
        setIsLoading(true)
        dispatch(fetchUser(email));
    }
    if (ccUser.status == "succeeded") {
        setUser(ccUser.data);
        setIsLoading(false)
    }
  }, [ccUser.status, email]);
  return (
    <div className=" w-full h-screen sm:pr-2 overflow-y-scroll">
      <div className="w-full h-full relative">
        <div className="loader">
          {(isLoading && 
            <DashboardLoadingMessage
              message={`We are building up your dashboard and data`}
              subMessage={`Please wait a moment 🤓`}
              setLoading={toggleIsLoading}
            />
          )}
        </div>
        <div className="w-full profile-img py-[40px] text-center text-white">
          <h1 className="text-3xl min-[400px]:text-[40px] sm:text-[40px] md:text-[60px] font-thin">
            Transactions History
          </h1>
        </div>
        <div className="content-profile-cont w-full h-full bg-slate-100 text-center items-center mt-[10px] sm:mt-[20px] rounded-t-[100px] rounded-b-2xl shadow-sm px-2 pt-6 pb-[80px]">
          <div className="history-client-cont w-full flex flex-col justify-center items-center">
            <h1 className="text-3xl min-[text-[45px]]: py-2">
              History details
            </h1>
            {/*  */}
            <TabsTogglerMontlyController />
          </div>
        </div>
      </div>
    </div>
  );
}

export default HistoryClient;
