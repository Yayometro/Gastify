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
import CategorySuggestionsSection from "./CategorySuggestions/CategorySuggestionsSection";

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
  const user = ccUser.data; //
  const reduxAllTransactions = ccTransactions?.data;
  const categories = ccategories.data.user;
  const defCategories = ccategories.data.default;
  const allCat = categories.concat(defCategories); //
  const subCat = ccSubCategories.data.subCat; //
  const defSubCat = ccSubCategories.data?.default || [];
  const allSubCat = subCat.concat(defSubCat);
  const accounts = ccAccounts.data; //

  useEffect(() => {
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
  
  

  return (
    <div className=" w-full h-full sm:pr-2">
      <div className="w-full h-full relative">
        <div className="w-full profile-img py-4 text-center text-white">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-thin">
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
        <div className="content-profile-cont w-full h-full content-wallet-glass text-center items-center mt-[10px] sm:mt-[20px] rounded-t-[100px] rounded-b-2xl px-2 pt-6 pb-[80px]">
          <h1 className="3xl w-full "></h1>
          <div className="cc-categoryList-cont w-full flex flex-col justify-center items-center">
            <h1 className="text-3xl min-[text-[45px]]: py-2">
              Movements details
            </h1>
          </div>
          <div className="movements-panels-cont w-full grid grid-cols-1 md:grid-cols-2 gap-4 justify-items-center">
            <div className="add-file-trans w-full h-full flex justify-center items-center">
              <ReadFileComp />
            </div>
            <div className="category-suggestions w-full h-full flex justify-center items-center">
              <CategorySuggestionsSection mail={mcSession} />
            </div>
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
