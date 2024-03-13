import { createSlice, nanoid, createAsyncThunk } from "@reduxjs/toolkit";
import fetcher from "@/helpers/fetcher";

const toFetch = fetcher();

const wallet = {
    data: {},
    status: "idle", //'idle' | 'loading' | 'succeeded' | 'failed'
    error: null,
  };

  export const fetchWallet = createAsyncThunk("wallet/fetchWallet", async (mail) => {
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
    console.log(e)
    throw new Error(e);
  }
});
export const walletSlice = createSlice({
    name: "walletState", //name of the state
    initialState: wallet,
    reducers: { //here are the acctions that willl update this initialState
        setWallet: (state, action) => {
            return action.payload //Is the argument returned later when invoke the function
        }
    },
    extraReducers(builder) {
        builder
          .addCase(fetchWallet.pending, (state, action) => {
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
})

export const getRedxWallet = (state) => state.accounts.data;
export const getRedxWalletEstatus = (state) => state.accounts.status;
export const getRedxWalletError = (state) => state.accounts.error;

export const {setWallet} = walletSlice.actions

export default walletSlice.reducer //This is the default value accros the app