import { AllDataContext } from "@/components/Providers/AllDataProvider";
import { useContext } from "react";
import type { AccountData } from "@/lib/features/accountsSlice";
import type { BudgetData } from "@/lib/features/budgetSlice";
import type { CategoryData } from "@/lib/features/categoriesSlice";
import type { SubCategoryData } from "@/lib/features/subCategorySlice";
import type { TransactionData } from "@/lib/features/transacctionsSlice";
import type { UserData } from "@/lib/features/userSlice";
import type { WalletData } from "@/lib/features/walletSlice";

export interface AllDataContextValue {
  user?: UserData | Record<string, unknown> | null;
  wallet?: WalletData | Record<string, unknown> | null;
  accounts?: AccountData[];
  categories?: CategoryData[] | { default?: CategoryData[]; user?: CategoryData[] };
  subCategories?: SubCategoryData[] | { default?: SubCategoryData[]; subCat?: SubCategoryData[] };
  transacciones?: TransactionData[];
  budgets?: BudgetData[];
  tags?: unknown;
  loading?: boolean;
  [key: string]: unknown;
}

export default function useGetDataFromProvider<T = AllDataContextValue>(): T {
  const context = useContext(AllDataContext) as unknown as T;
  if (!context) throw new Error("No context provided in custom hook");
  return context;
}