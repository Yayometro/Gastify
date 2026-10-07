import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import fetcher from "@/helpers/fetcher";

const toFetch = fetcher();

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
  category?: string | unknown;
  subCategory?: string | unknown;
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

export interface TransacctionsState {
  data: TransactionData[];
  status: TransacctionsStatus;
  error: string | null | undefined;
  [key: string]: unknown;
}

const transacctions: TransacctionsState = {
  data: [],
  status: "idle", //'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
};

export const fetchTrans = createAsyncThunk(
  "transacctions/fetchTrans",
  async (mail?: unknown) => {
    // console.log(mail);
    try {
      const response = await toFetch.post(
        "general-data/transactions/get-transactions",
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
        state.status = "succeeded";
        state.data = action.payload;
      })
      .addCase(fetchTrans.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message;
      });
  },
});

export const getRedxTransactions = (state: { transacctionsReducer: TransacctionsState }) => state.transacctionsReducer.data;
export const getRedxTransactionsEstatus = (state: { transacctionsReducer: TransacctionsState }) => state.transacctionsReducer.status;
export const getRedxTransactionsError = (state: { transacctionsReducer: TransacctionsState }) => state.transacctionsReducer.error;

export const {
  setTransacctions,
  addNewTransacction,
  addNewTransacctions,
  removeOneTransacction,
  removeManyTransactions,
  updateTransaction,
  updateManyTransactions,
} = transacctionsSlice.actions;

export default transacctionsSlice.reducer; //This is the default value accros the app
