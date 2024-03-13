import { createSlice, nanoid, createAsyncThunk } from "@reduxjs/toolkit";
import fetcher from "@/helpers/fetcher";

const toFetch = fetcher();

const transacctions = {
  data: [],
  status: "idle", //'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
};
export const fetchTrans = createAsyncThunk(
  "transacctions/fetchTrans",
  async (mail) => {
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
    setTransacctions: (state, action) => {
      return action.payload; //Is the argument returned later when invoke the function
    },
    removeOneTransacction: (state, action) => {
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

    removeManyTransactions: (state, action) => {
      console.log(state);
      //Filter using Inmer, asigned directly to state.data
      state.data = state.data.filter(
        (mov) => !action.payload.includes(mov._id)
      );
    },
    addNewTransacctions: (state, action) => {
      console.log(state);
      console.log(action);
      if (action.payload.length > 0) {
        action.payload.forEach((element) => {
          console.log(element);
          state.data.push(element);
        });
      }
    },
    updateTransaction: (state, action) => {
      const index = state.data.findIndex(
        (transaction) => transaction._id === action.payload._id
      );
      if (index !== -1) {
        // Actualiza directamente el elemento en el 'draft' proporcionado por Immer
        state.data[index] = action.payload;
      }
    },
    updateManyTransactions: (state, action) => {
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
      .addCase(fetchTrans.pending, (state, action) => {
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

export const getRedxTransactions = (state) => state.accounts.data;
export const getRedxTransactionsEstatus = (state) => state.accounts.status;
export const getRedxTransactionsError = (state) => state.accounts.error;

export const {
  setTransacctions,
  addNewTransacctions,
  removeOneTransacction,
  removeManyTransactions,
  updateTransaction,
  updateManyTransactions
} = transacctionsSlice.actions;

export default transacctionsSlice.reducer; //This is the default value accros the app
