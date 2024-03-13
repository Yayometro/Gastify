import { createSlice, nanoid, createAsyncThunk } from "@reduxjs/toolkit";
import fetcher from "@/helpers/fetcher";
import { getServerSession } from "next-auth";

const toFetch = fetcher();

const categories = {
  data: {
    user: [],
    default: [],
  },
  status: "idle", //'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
};

export const fetchCategories = createAsyncThunk(
  "categoriesState/fetchCategories",
  async (mail) => {
    try {
      const response = await toFetch.post(
        "general-data/categories/get-categories",
        mail
      );
      if (response.ok) {
        return response.data;
      } else {
        console.log("Something went wrong");
      }
    } catch (e) {
      throw new Error(e);
    }
  }
);

export const categoriesSlice = createSlice({
  name: "categoriesState", //name of the state
  initialState: categories,
  reducers: {
    //here are the acctions that willl update this initialState
    setCategories: (state, action) => {
      return action.payload; //Is the argument returned later when invoke the function
    },
    addNewCategory: (state, action) => {
      if (action.payload) {
        state.data.user.push(action.payload);
      }
    },
    removeOneCategory: (state, action) => {
      console.log("first");
      if (state.data.user && state.data.user.length > 0) {
        console.log("first");
        //Filter the array directly using "Inmer" to handle the inmutability
        const index = state.data.user.findIndex(
          (cat) => cat._id === action.payload
        );
        if (index !== -1) {
          //Using 'splice' to remove the element using index, if using Inmer this is securte to use.
          state.data.user.splice(index, 1);
        }
      }
    },
    updateCategory: (state, action) => {
      const index = state.data.user.findIndex(
        (cat) => cat._id === action.payload._id
      );
      if (index !== -1) {
        // Actualiza directamente el elemento en el 'draft' proporcionado por Immer
        state.data.user[index] = action.payload;
      }
    },
  },
  extraReducers(builder) {
    builder
      .addCase(fetchCategories.pending, (state, action) => {
        state.status = "loading";
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.status = "succeeded";
        // console.log(state.data);
        // console.log(action.payload);
        state.data.user = action.payload.categories;
        state.data.default = action.payload.defCat;
        // console.log(state.data);
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message;
      });
  },
});

export const getRedxCategories = (state) => state.categories;
export const getRedxCategoriesEstatus = (state) => state.ca;
export const getRedxCategoriesError = (state) => state.categories.error;
// export const changeCategoriesRdxState = (state) =>

export const {
  setCategories,
  removeOneCategory,
  updateCategory,
  addNewCategory,
} = categoriesSlice.actions;

export default categoriesSlice.reducer; //This is the default value accros the app
