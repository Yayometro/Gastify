import { createSlice, nanoid, createAsyncThunk } from "@reduxjs/toolkit";
import fetcher from "@/helpers/fetcher";

const toFetch = fetcher();

const budgets = {
  data: [],
  status: "idle", //'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
};
export const fetchBudget = createAsyncThunk(
  "transacctions/fetchBudget",
  async (mail) => {
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
    setBudget: (state, action) => {
      return action.payload; //Is the argument returned later when invoke the function
    },
    removeBudget: (state, action) => {
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
    addNewBudget: (state, action) => {
      console.log(state);
      console.log(action);
      if (action.payload.length > 0) {
        action.payload.forEach((element) => {
          console.log(element);
          state.data.push(element);
        });
      }
    },
    updateBudget: (state, action) => {
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
      .addCase(fetchBudget.pending, (state, action) => {
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
