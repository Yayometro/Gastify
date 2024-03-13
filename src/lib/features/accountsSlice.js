import { createSlice, nanoid, createAsyncThunk } from "@reduxjs/toolkit";
import fetcher from "@/helpers/fetcher";

const toFetch = fetcher();

const accounts = {
  data: [],
  status: "idle", //'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
};
export const fetchAccounts = createAsyncThunk(
  "accounts/fetchAccounts",
  async (mail) => {
    // console.log(mail);
    try {
      const response = await toFetch.post("general-data/accounts/get-account", mail);
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
    setAccounts: (state, action) => {
      return action.payload; //Is the argument returned later when invoke the function
    },
    addNewAccount: (state, action) => {
      if (action.payload) {
        state.data.push(action.payload);
      }
    },
    removeAccount: (state, action) => {
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
    updateAccount: (state, action) => {
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
      .addCase(fetchAccounts.pending, (state, action) => {
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
    }
});

export const getRedxAccounts = (state) => state.accounts.data;
export const getRedxAccountsEstatus = (state) => state.accounts.status;
export const getRedxAccountsError = (state) => state.accounts.error;


export const { 
  setAccount,
  addNewAccount,
  removeAccount,
  updateAccount
} = accountsSlice.actions;

export default accountsSlice.reducer; //This is the default value accros the app
