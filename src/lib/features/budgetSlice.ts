import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import fetcher from "@/helpers/fetcher";

const toFetch = fetcher();

export interface BudgetCategoryItem {
  category?: string | unknown;
  subCategory?: string | unknown;
  [key: string]: unknown;
}

export interface BudgetHistoryItem {
  goalAmount?: number;
  savingAmount?: number;
  goalMoney?: unknown;
  savingMoney?: unknown;
  effectiveFrom?: Date | string;
  effectiveTo?: Date | string;
  [key: string]: unknown;
}

export interface BudgetData {
  _id?: string;
  name?: string;
  isSaving?: boolean;
  savingAmount?: number;
  user?: string | unknown;
  wallet?: string | unknown;
  goalAmount?: number;
  isSurpassed?: boolean;
  category?: string | unknown;
  subCategory?: string | unknown;
  categories?: BudgetCategoryItem[];
  period?: "monthly" | "quarterly" | "biannual" | "yearly" | string;
  budgetType?: "spending" | "saving" | "project" | string;
  icon?: string;
  eventStartDate?: Date | string;
  eventEndDate?: Date | string;
  linkedTags?: (string | unknown)[];
  linkedAccounts?: (string | unknown)[];
  archived?: boolean;
  history?: BudgetHistoryItem[];
  goalMoney?: unknown;
  savingMoney?: unknown;
  currency?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  [key: string]: unknown;
}

export type BudgetsStatus = "idle" | "loading" | "succeeded" | "failed";

export interface BudgetsState {
  data: BudgetData[];
  status: BudgetsStatus;
  error: string | null | undefined;
  [key: string]: unknown;
}

const budgets: BudgetsState = {
  data: [],
  status: "idle", //'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
};
export const fetchBudget = createAsyncThunk(
  "transacctions/fetchBudget",
  async (mail?: unknown) => {
    // console.log(mail);
    try {
      const response = await toFetch.post(
        "general-data/budget/get",
        mail
      );
      // console.log(response)
      if (response.ok) {
        return response.data;
      } else {
        console.log("Something went wrong");
      }
    } catch (e) {
      console.log(e);
      throw new Error(e);
    }
  }
);

export const budgetsSlice = createSlice({
  name: "budgetsState", //name of the state
  initialState: budgets,
  reducers: {
    //here are the acctions that willl update this initialState
    setBudget: (_state, action: PayloadAction<BudgetsState>) => {
      return action.payload; //Is the argument returned later when invoke the function
    },
    removeBudget: (state, action: PayloadAction<string>) => {
      if (state.data && state.data.length > 0) {
        //Filter the array directly using "Inmer" to handle the inmutability
        const index = state.data.findIndex(
          (transacction) => transacction._id === action.payload
        );
        if (index !== -1) {
          //Using 'splice' to remove the element using index, if using Inmer this is securte to use.
          state.data.splice(index, 1);
        }
      }
    },
    addNewBudget: (state, action: PayloadAction<BudgetData | BudgetData[]>) => {
      if (Array.isArray(action.payload)) {
        action.payload.forEach((element) => {
          state.data.push(element);
        });
      } else if (action.payload) {
        state.data.push(action.payload);
      }
    },
    updateBudget: (state, action: PayloadAction<BudgetData>) => {
      const index = state.data.findIndex(
        (transaction) => transaction._id === action.payload._id
      );
      if (index !== -1) {
        // Actualiza directamente el elemento en el 'draft' proporcionado por Immer
        state.data[index] = action.payload;
      }
    },
  },
  extraReducers(builder) {
    builder
      .addCase(fetchBudget.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchBudget.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.data = action.payload;
      })
      .addCase(fetchBudget.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message;
      });
  },
});

// export const getRedxTransactions = (state) => state.accounts.data;
// export const getRedxTransactionsEstatus = (state) => state.accounts.status;
// export const getRedxTransactionsError = (state) => state.accounts.error;

export const {
  setBudget,
  addNewBudget,
  removeBudget,
  updateBudget,
} = budgetsSlice.actions;

export default budgetsSlice.reducer; //This is the default value accros the app
