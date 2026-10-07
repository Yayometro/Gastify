import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import fetcher from "@/helpers/fetcher";

const toFetch = fetcher();

export interface WalletBudget {
  totalBudget?: number;
  totalSavings?: number;
  isSurpassed?: boolean;
  isSaved?: boolean;
}

export interface WalletData {
  _id?: string;
  name?: string;
  cash?: number;
  user?: string | unknown;
  budget?: WalletBudget;
  primaryCurrency?: string;
  currencyUpdatedAt?: Date | string | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  [key: string]: unknown;
}

export type WalletStatus = "idle" | "loading" | "succeeded" | "failed";

export interface WalletState {
  data: WalletData | Record<string, unknown>;
  status: WalletStatus;
  error: string | null | undefined;
}

const wallet: WalletState = {
  data: {},
  status: "idle", //'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
};

export const fetchWallet = createAsyncThunk(
  "wallet/fetchWallet",
  async (mail?: unknown) => {
    // console.log(mail)
    try {
      const response = await toFetch.post(
        "general-data/wallet/get-wallet",
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

export const walletSlice = createSlice({
  name: "walletState", //name of the state
  initialState: wallet,
  reducers: {
    //here are the acctions that willl update this initialState
    setWallet: (_state, action: PayloadAction<WalletState>) => {
      return action.payload; //Is the argument returned later when invoke the function
    },
    updateWallet: (state, action: PayloadAction<WalletData | Record<string, unknown>>) => {
      state.data = action.payload;
    },
  },
  extraReducers(builder) {
    builder
      .addCase(fetchWallet.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchWallet.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.data = action.payload;
      })
      .addCase(fetchWallet.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message;
      });
  },
});

export const getRedxWallet = (state: { walletReducer: WalletState }) => state.walletReducer.data;
export const getRedxWalletEstatus = (state: { walletReducer: WalletState }) => state.walletReducer.status;
export const getRedxWalletError = (state: { walletReducer: WalletState }) => state.walletReducer.error;

export const { setWallet, updateWallet } = walletSlice.actions;

export default walletSlice.reducer; //This is the default value accros the app