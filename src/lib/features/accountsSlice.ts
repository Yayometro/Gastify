import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import fetcher from "@/helpers/fetcher";

const toFetch = fetcher();

export interface AccountData {
  _id?: string;
  name?: string;
  amount?: number;
  accountType?: "debit" | "credit" | "cash" | "savings" | string;
  user?: string | unknown;
  wallet?: string | unknown;
  currency?: string;
  balanceMinor?: number | null;
  institution?: string | null;
  balanceUpdatedAt?: Date | string | null;
  schemaVersion?: number;
  order?: number;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  [key: string]: unknown;
}

export type AccountsStatus = "idle" | "loading" | "succeeded" | "failed";

export interface AccountsState {
  data: AccountData[];
  status: AccountsStatus;
  error: string | null | undefined;
}

const accounts: AccountsState = {
  data: [],
  status: "idle", //'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
};

export const fetchAccounts = createAsyncThunk(
  "accounts/fetchAccounts",
  async (mail?: unknown) => {
    // console.log(mail);
    try {
      const response = await toFetch.post(
        "general-data/accounts/get-account",
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

export const accountsSlice = createSlice({
  name: "accountsState", //name of the state
  initialState: accounts,
  reducers: {
    //here are the acctions that willl update this initialState
    setAccounts: (_state, action: PayloadAction<AccountsState>) => {
      return action.payload; //Is the argument returned later when invoke the function
    },
    addNewAccount: (state, action: PayloadAction<AccountData>) => {
      if (action.payload) {
        state.data.push(action.payload);
      }
    },
    removeAccount: (state, action: PayloadAction<string>) => {
      console.log("first");
      if (state.data && state.data.length > 0) {
        console.log("first");
        //Filter the array directly using "Inmer" to handle the inmutability
        const index = state.data.findIndex(
          (acc) => acc._id === action.payload
        );
        if (index !== -1) {
          //Using 'splice' to remove the element using index, if using Inmer this is securte to use.
          state.data.splice(index, 1);
        }
      }
    },
    updateAccount: (state, action: PayloadAction<AccountData>) => {
      const index = state.data.findIndex(
        (acc) => acc._id === action.payload._id
      );
      if (index !== -1) {
        // Actualiza directamente el elemento en el 'draft' proporcionado por Immer
        state.data[index] = action.payload;
      }
    },
  },
  extraReducers(builder) {
    builder
      .addCase(fetchAccounts.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchAccounts.fulfilled, (state, action) => {
        state.status = "succeeded";
        // console.log(state.data);
        // console.log(action.payload);
        state.data = action.payload;
        // console.log(state.data);
      })
      .addCase(fetchAccounts.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message;
      });
  },
});

export const getRedxAccounts = (state: { accountsReducer: AccountsState }) => state.accountsReducer.data;
export const getRedxAccountsEstatus = (state: { accountsReducer: AccountsState }) => state.accountsReducer.status;
export const getRedxAccountsError = (state: { accountsReducer: AccountsState }) => state.accountsReducer.error;

export const { 
  setAccounts,
  addNewAccount,
  removeAccount,
  updateAccount
} = accountsSlice.actions;

export default accountsSlice.reducer; //This is the default value accros the app
