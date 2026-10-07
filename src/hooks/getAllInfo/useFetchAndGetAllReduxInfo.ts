import { fetchAccounts, type AccountData } from "@/lib/features/accountsSlice";
import { fetchBudget, type BudgetData } from "@/lib/features/budgetSlice";
import { fetchCategories, type CategoryData } from "@/lib/features/categoriesSlice";
import { fetchSubCat, type SubCategoryData } from "@/lib/features/subCategorySlice";
import {
  fetchTrans,
  type TransactionData,
} from "@/lib/features/transacctionsSlice";
import { fetchUser, type UserData } from "@/lib/features/userSlice";
import { fetchWallet, type WalletData } from "@/lib/features/walletSlice";
import { useDispatch, useSelector } from "react-redux";
import useGetUserSession from "../useGetUserSession";
import { setDisplayCurrency } from "@/lib/money/displayCurrency";
import { useEffect, useState } from "react";
import type { AppDispatch, RootState } from "@/lib/store";

export interface ReduxAllInfo {
  user: UserData | Record<string, unknown>;
  wallet: WalletData | Record<string, unknown>;
  accounts: AccountData[];
  categories: CategoryData[];
  subCategories: SubCategoryData[];
  transacciones: TransactionData[];
  budgets: BudgetData[];
  tags: unknown;
  loading: boolean;
}

export default function useFetchAndGetAllReduxInfo(): ReduxAllInfo {
  const [loading, setLoading] = useState(false);
  // Redux
  const dispatch = useDispatch<AppDispatch>();
  const ccUser = useSelector((state: RootState) => state.userReducer);
  const ccWallet = useSelector((state: RootState) => state.walletReducer);
  const ccAccounts = useSelector((state: RootState) => state.accountsReducer);
  const ccCategories = useSelector((state: RootState) => state.categoriesReducer);
  const ccSubCategories = useSelector((state: RootState) => state.subCategoryReducer);
  const ccTransacciones = useSelector((state: RootState) => state.transacctionsReducer);
  const ccBudgets = useSelector((state: RootState) => state.budgetReducer);
  const ccTags = useSelector((state: RootState) => state.tagsReducer) as { status?: string; data?: unknown };

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
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email]);

  // The wallet's primary currency is the one every amount is formatted in.
  const primaryCurrency = (ccWallet.data as { primaryCurrency?: string } | undefined)?.primaryCurrency;
  useEffect(() => {
    setDisplayCurrency(primaryCurrency);
  }, [primaryCurrency]);

  useEffect(() => {
    // (There used to be eight `setUser(...)`, `setWallet(...)` ... calls here: slice
    // actions called WITHOUT dispatch, so they did nothing, same as bugs 15/16/27/28/143;
    // dispatching them would have replaced each slice with data of another shape.)
    if (ccTransacciones.status == "succeeded") {
      setLoading(false);
    }
  }, [ccTransacciones]);
  const userCats = (ccCategories?.data?.user || ccCategories?.user || []) as CategoryData[];
  const defCats = (ccCategories?.data?.default || ccCategories?.default || []) as CategoryData[];
  const categoriesList = Array.isArray(userCats) && Array.isArray(defCats) ? userCats.concat(defCats) : (Array.isArray(userCats) ? userCats : (Array.isArray(defCats) ? defCats : []));

  const userSubCats = (ccSubCategories?.data?.subCat || ccSubCategories?.subCat || []) as SubCategoryData[];
  const defSubCats = (ccSubCategories?.data?.default || ccSubCategories?.default || []) as SubCategoryData[];
  const subCategoriesList = Array.isArray(userSubCats) && Array.isArray(defSubCats) ? userSubCats.concat(defSubCats) : (Array.isArray(userSubCats) ? userSubCats : (Array.isArray(defSubCats) ? defSubCats : []));

  return {
    user: ccUser.data,
    wallet: ccWallet.data,
    accounts: ccAccounts.data,
    categories: categoriesList,
    subCategories: subCategoriesList,
    transacciones: ccTransacciones.data,
    budgets: ccBudgets.data,
    tags: ccTags.data,
    loading,
  };
}
