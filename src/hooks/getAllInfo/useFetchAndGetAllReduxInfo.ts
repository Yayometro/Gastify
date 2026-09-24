import { fetchAccounts, setAccounts, type AccountData, type AccountsState } from "@/lib/features/accountsSlice";
import { fetchBudget, setBudget, type BudgetData, type BudgetsState } from "@/lib/features/budgetSlice";
import { fetchCategories, setCategories, type CategoryData, type CategoriesState } from "@/lib/features/categoriesSlice";
import { fetchSubCat, setSubCategories, type SubCategoryData, type SubCategoriesState } from "@/lib/features/subCategorySlice";
import {
  fetchTrans,
  setTransacctions,
  type TransactionData,
  type TransacctionsState,
} from "@/lib/features/transacctionsSlice";
import { fetchUser, setUser, type UserData, type UserState } from "@/lib/features/userSlice";
import { fetchWallet, setWallet, type WalletData, type WalletState } from "@/lib/features/walletSlice";
import { useDispatch, useSelector } from "react-redux";
import useGetUserSession from "../useGetUserSession";
import { setTags } from "@/lib/features/tagsSlice";
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

  useEffect(() => {
    // User
    if (ccUser.status == "succeeded") {
      setUser(ccUser.data as unknown as UserState);
    }
    // Wallet
    if (ccWallet.status == "succeeded") {
      setWallet(ccWallet.data as unknown as WalletState);
    }
    // Account
    if (ccAccounts.status == "succeeded") {
      setAccounts(ccAccounts.data as unknown as AccountsState);
    }
    //Categories
    if (ccCategories.status == "succeeded") {
      setCategories(ccCategories.data as unknown as CategoriesState);
    }
    // //Sub-categories
    if (ccSubCategories.status == "succeeded") {
      setSubCategories(ccSubCategories.data as unknown as SubCategoriesState);
    }
    //Transactions
    if (ccTransacciones.status == "succeeded") {
      setTransacctions(ccTransacciones.data as unknown as TransacctionsState);
      setLoading(false);
    }
    //Budgets
    if (ccBudgets.status == "succeeded") {
      setBudget(ccBudgets.data as unknown as BudgetsState);
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
