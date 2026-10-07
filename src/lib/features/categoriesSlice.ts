import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import fetcher from "@/helpers/fetcher";

const toFetch = fetcher();

export interface CategoryData {
  _id?: string;
  name?: string;
  icon?: string;
  color?: string;
  isDefaultCatego?: boolean;
  user?: string | unknown;
  wallet?: string | unknown;
  accounts?: (string | unknown)[];
  createdAt?: Date | string;
  updatedAt?: Date | string;
  [key: string]: unknown;
}

export interface CategoriesStateData {
  user: CategoryData[];
  default: CategoryData[];
  [key: string]: unknown;
}

export type CategoriesStatus = "idle" | "loading" | "succeeded" | "failed";

export interface CategoriesState {
  data: CategoriesStateData;
  status: CategoriesStatus;
  error: string | null | undefined;
  [key: string]: unknown;
}

const categories: CategoriesState = {
  data: {
    user: [],
    default: [],
  },
  status: "idle", //'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
};

export const fetchCategories = createAsyncThunk(
  "categoriesState/fetchCategories",
  async (mail?: unknown) => {
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
    setCategories: (_state, action: PayloadAction<CategoriesState>) => {
      return action.payload; //Is the argument returned later when invoke the function
    },
    addNewCategory: (state, action: PayloadAction<CategoryData>) => {
      if (action.payload) {
        state.data.user.push(action.payload);
      }
    },
    removeOneCategory: (state, action: PayloadAction<string>) => {
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
    updateCategory: (state, action: PayloadAction<CategoryData>) => {
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
      .addCase(fetchCategories.pending, (state) => {
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

export const getRedxCategories = (state: { categoriesReducer: CategoriesState }) => state.categoriesReducer;
export const getRedxCategoriesEstatus = (state: { categoriesReducer: CategoriesState }) => state.categoriesReducer.status;
export const getRedxCategoriesError = (state: { categoriesReducer: CategoriesState }) => state.categoriesReducer.error;
// export const changeCategoriesRdxState = (state) =>

export const {
  setCategories,
  removeOneCategory,
  updateCategory,
  addNewCategory,
} = categoriesSlice.actions;

export default categoriesSlice.reducer; //This is the default value accros the app
