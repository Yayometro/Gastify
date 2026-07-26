import { fetchAccounts, setAccounts } from "@/lib/features/accountsSlice";
import { fetchBudget, setBudget } from "@/lib/features/budgetSlice";
import { fetchCategories, setCategories } from "@/lib/features/categoriesSlice";
import { fetchSubCat, setSubCategories } from "@/lib/features/subCategorySlice";
import {
  fetchTrans,
  setTransacctions,
} from "@/lib/features/transacctionsSlice";
import { fetchUser, setUser } from "@/lib/features/userSlice";
import { fetchWallet, setWallet } from "@/lib/features/walletSlice";
import { useDispatch, useSelector } from "react-redux";
import useGetUserSession from "../useGetUserSession";
import { setTags } from "@/lib/features/tagsSlice";
import { useEffect, useState } from "react";

export default function useFetchAndGetAllReduxInfo() {
  const [loading, setLoading] = useState(false);
  // Redux
  const dispatch = useDispatch();
  const ccUser = useSelector((state) => state.userReducer);
  const ccWallet = useSelector((state) => state.walletReducer);
  const ccAccounts = useSelector((state) => state.accountsReducer);
  const ccCategories = useSelector((state) => state.categoriesReducer);
  const ccSubCategories = useSelector((state) => state.subCategoryReducer);
  const ccTransacciones = useSelector((state) => state.transacctionsReducer);
  const ccBudgets = useSelector((state) => state.budgetReducer);
  const ccTags = useSelector((state) => state.tagsReducer);

  // getSession
  const { email } = useGetUserSession();
  //
  useEffect(() => {
    if (email) {
      setLoading(!loading);
      // User
      if (ccUser.status === "idle") {
        dispatch(fetchUser(email));
      }
      // Wallet
      if (ccWallet.status === "idle") {
        dispatch(fetchWallet(email));
      }
      // Account
      if (ccAccounts.status === "idle") {
        dispatch(fetchAccounts(email));
      }
      //Categories
      if (ccCategories.status === "idle") {
        dispatch(fetchCategories(email));
      }
      // //Sub-categories
      if (ccSubCategories.status === "idle") {
        dispatch(fetchSubCat(email));
      }
      //Transactions
      if (ccTransacciones.status === "idle") {
        dispatch(fetchTrans(email));
      }
      //Budget
      if (ccBudgets.status === "idle") {
        dispatch(fetchBudget(email));
      }
      //Tags
      if (ccTags.status === "idle") {
        dispatch(fetchBudget(email));
      }
    }
  }, [email]);

  useEffect(() => {
    // User
    if (ccUser.status == "succeeded") {
      setUser(ccUser.data);
    }
    // Wallet
    if (ccWallet.status == "succeeded") {
      setWallet(ccWallet.data);
    }
    // Account
    if (ccAccounts.status == "succeeded") {
      setAccounts(ccAccounts.data);
    }
    //Categories
    if (ccCategories.status == "succeeded") {
      setCategories(ccCategories.data);
    }
    // //Sub-categories
    if (ccSubCategories.status == "succeeded") {
      setSubCategories(ccSubCategories.data);
    }
    //Transactions
    if (ccTransacciones.status == "succeeded") {
      setTransacctions(ccTransacciones.data);
      setLoading(false);
    }
    //Budgets
    if (ccBudgets.status == "succeeded") {
      setBudget(ccBudgets.data);
    }
    //Tags
    if (ccTags.status == "succeeded") {
      setTags(ccTags.data);
    }
  }, [
    ccUser,
    ccWallet,
    ccAccounts,
    ccCategories,
    ccSubCategories,
    ccTransacciones,
    ccBudgets,
    ccTags,
  ]);
  return {
    user: ccUser.data,
    wallet: ccWallet.data,
    accounts: ccAccounts.data,
    categories: ccCategories.data.user.concat(ccCategories.data.default),
    subCategories: ccSubCategories.data.subCat.concat(
      ccSubCategories.data.default
    ),
    transacciones: ccTransacciones.data,
    budgets: ccBudgets.data,
    tags: ccTags.data,
    loading,
  };
}
