"use client";

import React, { useEffect, useState } from "react";
import Movements from "./Movements";
import { Spin } from "antd";
import AddTransactionComp from "./AddTransactionComp";
import { useDispatch, useSelector } from "react-redux";
import { fetchCategories } from "@/lib/features/categoriesSlice";
import { fetchSubCat } from "@/lib/features/subCategorySlice";
import { fetchUser } from "@/lib/features/userSlice";
import { fetchAccounts } from "@/lib/features/accountsSlice";
import { fetchTrans } from "@/lib/features/transacctionsSlice";
import ReadFileComp from "./ReadFileComp";

function MovementsClient({ mcData, mcSession }) {
  // Redux
  const dispatch = useDispatch();
  const ccUser = useSelector((state) => state.userReducer);
  const ccTransactions = useSelector((state) => state.transacctionsReducer);
  const ccategories = useSelector((state) => state.categoriesReducer);
  const ccSubCategories = useSelector((state) => state.subCategoryReducer);
  const ccAccounts = useSelector((state) => state.accountsReducer);
  //
  // console.log(ccSubCategories)
  // console.log(mcData);
  const user = ccUser.data;
  const reduxAllTransactions = ccTransactions?.data;
  const categories = ccategories.data.user;
  const defCategories = ccategories.data.default;
  const allCat = categories.concat(defCategories);
  const subCat = ccSubCategories.data.subCat;
  const defSubCat = ccSubCategories.data?.default || [];
  const allSubCat = subCat.concat(defSubCat);
  const accounts = ccAccounts.data;

  useEffect(() => {
    // console.log(ccategories)
    // User
    if (ccUser.status == "idle") {
      dispatch(fetchUser(mcSession));
    }
    //Categories
    if (ccategories.status == "idle") {
      dispatch(fetchCategories(mcSession));
    }
    //Sub-categories
    if (ccSubCategories.status == "idle") {
      dispatch(fetchSubCat(mcSession));
    }
    if (ccAccounts.status == "idle") {
      dispatch(fetchAccounts(mcSession));
    }
  }, []);
  // console.log(ccUser)
  // console.log(ccategories)
  // console.log(ccSubCategories)
  // console.log(ccAccounts)

  return (
    <div className=" w-full h-full sm:pr-2">
      <div className="w-full h-full relative">
        <div className="w-full profile-img py-[40px] text-center text-white">
          <h1 className="text-3xl min-[400px]:text-[40px] sm:text-[40px] md:text-[60px] font-thin">
            {user.fullName ? (
              `${user.fullName} Movements`
            ) : (
              <div className="flex justify-center">
                <Spin size="large" />
                <div>Movements</div>
              </div>
            )}
          </h1>
        </div>
        <div className="content-profile-cont w-full h-full bg-slate-100 text-center items-center mt-[10px] sm:mt-[20px] rounded-t-[100px] rounded-b-2xl shadow-sm px-2 pt-6 pb-[80px]">
          <h1 className="3xl w-full "></h1>
          <div className="cc-categoryList-cont w-full flex flex-col justify-center items-center">
            <h1 className="text-3xl min-[text-[45px]]: py-2">
              Movements details
            </h1>
          </div>
          <div className="add-trans-gen-cont w-full h-full">
            <AddTransactionComp
              atcUser={user}
              atcCategories={allCat}
              atcSubCategories={subCat}
              atcAccounts={accounts}
            />
          </div>
          <div className="add-file-trans w-full h-full flex justify-center items-center">
            <ReadFileComp />
          </div>
          <div className="mov-grans-cont w-full flex justify-center items-center ">
            <div className="w-full h-full min-[810px]:w-[800px] max-h-[1000px]  px-1 relative">
              <Movements mail={mcSession} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MovementsClient;
