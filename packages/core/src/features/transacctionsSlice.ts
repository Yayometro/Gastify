import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { skipWhileLoading } from "./thunkGuards";
import { debugDelay, perfMark } from "../perf/hooks";
import { getRecentCutoff, isBeforeCutoff, mergeById } from "@gastify/core/transactions/historyWindow";
import { lazyApi } from "../api/client";

const toFetch = lazyApi();

// What the API returns for a transaction's category / subCategory: the populated
// document (get-transactions populates both) or, on a raw document, just the id.
export interface PopulatedCategoryRef {
  _id?: string;
  name?: string;
  color?: string;
  icon?: string;
  [key: string]: unknown;
}

export interface PopulatedSubCategoryRef {
  _id?: string;
  name?: string;
  color?: string;
  icon?: string;
  [key: string]: unknown;
}

export interface TransactionData {
  _id?: string;
  name?: string;
  amount?: number;
  isIncome?: boolean;
  isBill?: boolean;
  isReadable?: boolean;
  isForSaving?: boolean;
  date?: Date | string;
  user?: string | unknown;
  wallet?: string | unknown;
  account?: string | unknown;
  category?: PopulatedCategoryRef | null;
  subCategory?: PopulatedSubCategoryRef | null;
  budget?: string | unknown;
  tags?: (string | unknown)[];
  kind?: "expense" | "income" | "transfer" | "exchange" | "refund" | "fee" | string;
  direction?: "debit" | "credit" | string;
  state?: "pending" | "completed" | "reverted" | "failed" | string;
  money?: {
    account?: unknown;
    merchant?: unknown;
    reporting?: unknown;
    [key: string]: unknown;
  };
  displayMoney?: {
    primary?: {
      amountMinor: number;
      currency: string;
    };
    [key: string]: unknown;
  };
  transferGroupId?: string | null;
  transferDirection?: "out" | "in" | string | null;
  schemaVersion?: number;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  [key: string]: unknown;
}

export type TransacctionsStatus = "idle" | "loading" | "succeeded" | "failed";

export type TransactionsHistoryStatus = "idle" | "loading" | "complete" | "failed";

export interface TransacctionsState {
  data: TransactionData[];
  // "succeeded" as soon as the recent months are in (see historyWindow.ts).
  status: TransacctionsStatus;
  error: string | null | undefined;
  // The rest of the history, loaded in the background after the recent part.
  historyStatus: TransactionsHistoryStatus;
  // ISO instant splitting "recent" from "rest of the history".
  historyCutoff: string | null;
  [key: string]: unknown;
}

const transacctions: TransacctionsState = {
  data: [],
  status: "idle", //'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
  historyStatus: "idle",
  historyCutoff: null,
};

interface TransactionsPage {
  items: TransactionData[];
  cutoff: string;
}

// Recent months only: the dashboard can render with these while the rest of the
// history loads in the background (fetchTransHistory).
export const fetchTrans = createAsyncThunk<TransactionsPage, unknown>(
  "transacctions/fetchTrans",
  async () => {
    const cutoff = getRecentCutoff().toISOString();
    try {
      const response = await toFetch.post("general-data/transactions/get-transactions", { since: cutoff });
      perfMark("data:transactions:received");
      if (!response.ok) throw new Error(response.message || "Could not load the movements");
      return { items: (response.data || []) as TransactionData[], cutoff };
    } catch (e) {
      console.log(e);
      throw new Error(e instanceof Error ? e.message : String(e));
    }
  },
  skipWhileLoading("transacctionsReducer")
);

// Everything before the cutoff of the recent part.
export const fetchTransHistory = createAsyncThunk<TransactionsPage, void, { state: { transacctionsReducer: TransacctionsState } }>(
  "transacctions/fetchTransHistory",
  async (_arg, { getState }) => {
    const cutoff = getState().transacctionsReducer.historyCutoff as string;
    await debugDelay("gfHistoryDelayMs");
    const response = await toFetch.post("general-data/transactions/get-transactions", { before: cutoff });
    perfMark("data:transactions-history:received");
    if (!response.ok) throw new Error(response.message || "Could not load the movement history");
    return { items: (response.data || []) as TransactionData[], cutoff };
  },
  {
    condition: (_arg, { getState }) => {
      const { historyCutoff, historyStatus } = getState().transacctionsReducer;
      return Boolean(historyCutoff) && historyStatus !== "loading" && historyStatus !== "complete";
    },
  }
);

export const transacctionsSlice = createSlice({
  name: "transacctionsState", //name of the state
  initialState: transacctions,
  reducers: {
    //here are the acctions that willl update this initialState
    setTransacctions: (_state, action: PayloadAction<TransacctionsState>) => {
      return action.payload; //Is the argument returned later when invoke the function
    },
    removeOneTransacction: (state, action: PayloadAction<string>) => {
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

    removeManyTransactions: (state, action: PayloadAction<string[]>) => {
      // console.log(state);
      //Filter using Inmer, asigned directly to state.data
      state.data = state.data.filter(
        (mov) => !action.payload.includes(mov._id as string)
      );
    },
    addNewTransacction: (state, action: PayloadAction<TransactionData>) => {
      // console.log(state);
      // console.log(action);
      if (action.payload) {
        state.data.push(action.payload);
      }
    },
    addNewTransacctions: (state, action: PayloadAction<TransactionData[]>) => {
      if (Array.isArray(action.payload) && action.payload.length > 0) {
        action.payload.forEach((element) => {
          state.data.push(element);
        });
      }
    },
    updateTransaction: (state, action: PayloadAction<TransactionData>) => {
      const index = state.data.findIndex(
        (transaction) => transaction._id === action.payload._id
      );
      if (index !== -1) {
        // Actualiza directamente el elemento en el 'draft' proporcionado por Immer
        state.data[index] = action.payload;
      }
    },
    // After a change to a movement from before the recent cutoff, the older part is requested again
    // (the history loader sees "idle" and fetches it). The recent part stays as it is.
    resetHistory: (state) => {
      if (state.historyCutoff) {
        state.data = state.data.filter((t) => !isBeforeCutoff(t, state.historyCutoff as string));
      }
      state.historyStatus = "idle";
    },
    updateManyTransactions: (state, action: PayloadAction<TransactionData[]>) => {
      action.payload.forEach((updatedTransaction) => {
        const index = state.data.findIndex(
          (tra) => tra._id === updatedTransaction._id
        );
        if (index !== -1) {
          state.data[index] = updatedTransaction;
        }
      });
    },
  },
  extraReducers(builder) {
    builder
      .addCase(fetchTrans.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchTrans.fulfilled, (state, action) => {
        const { items, cutoff } = action.payload;
        state.status = "succeeded";
        state.historyCutoff = cutoff;
        // Replace only the recent part; history already loaded (if any) stays.
        state.data = mergeById(items, state.data.filter((t) => isBeforeCutoff(t, cutoff)));
      })
      .addCase(fetchTrans.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message;
      })
      .addCase(fetchTransHistory.pending, (state) => {
        state.historyStatus = "loading";
      })
      .addCase(fetchTransHistory.fulfilled, (state, action) => {
        const { items, cutoff } = action.payload;
        state.historyStatus = "complete";
        // Replace only the history part; keeps the recent movements (and anything
        // added locally meanwhile) untouched.
        state.data = mergeById(state.data.filter((t) => !isBeforeCutoff(t, cutoff)), items);
      })
      .addCase(fetchTransHistory.rejected, (state, action) => {
        state.historyStatus = "failed";
        state.error = action.error.message;
      });
  },
});

export const getRedxTransactions = (state: { transacctionsReducer: TransacctionsState }) => state.transacctionsReducer.data;
export const getRedxTransactionsEstatus = (state: { transacctionsReducer: TransacctionsState }) => state.transacctionsReducer.status;
export const getRedxTransactionsHistoryStatus = (state: { transacctionsReducer: TransacctionsState }) => state.transacctionsReducer.historyStatus;
export const getRedxTransactionsError = (state: { transacctionsReducer: TransacctionsState }) => state.transacctionsReducer.error;

export const {
  setTransacctions,
  addNewTransacction,
  addNewTransacctions,
  removeOneTransacction,
  removeManyTransactions,
  updateTransaction,
  updateManyTransactions,
  resetHistory,
} = transacctionsSlice.actions;

export default transacctionsSlice.reducer; //This is the default value accros the app
