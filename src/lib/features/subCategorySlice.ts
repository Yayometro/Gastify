import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import fetcher from "@/helpers/fetcher";

const toFetch = fetcher();

export interface SubCategoryData {
  _id?: string;
  name?: string;
  icon?: string;
  color?: string;
  isDefaultSubCatego?: boolean;
  user?: string | unknown;
  wallet?: string | unknown;
  fatherCategory?: string | unknown;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  [key: string]: unknown;
}

export interface SubCategoriesStateData {
  subCat: SubCategoryData[];
  default: SubCategoryData[];
  [key: string]: unknown;
}

export type SubCategoriesStatus = "idle" | "loading" | "succeeded" | "failed";

export interface SubCategoriesState {
  data: SubCategoriesStateData;
  status: SubCategoriesStatus;
  error: string | null | undefined;
  [key: string]: unknown;
}

const subCategories: SubCategoriesState = {
  data: {
    subCat: [],
    default: [],
  },
  status: "idle", //'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
};

export const fetchSubCat = createAsyncThunk(
  "subCategories/fetchSubCat",
  async (mail?: unknown) => {
    // console.log(mail)
    try {
      const response = await toFetch.post(
        "general-data/subcategory/get-sub-categories",
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
export const subCategoriesSlice = createSlice({
  name: "subCategoriesState", //name of the state
  initialState: subCategories,
  reducers: {
    //here are the acctions that willl update this initialState
    setSubCategories: (_state, action: PayloadAction<SubCategoriesState>) => {
      return action.payload; //Is the argument returned later when invoke the function
    },
    addNewSubCategory: (state, action: PayloadAction<SubCategoryData>) => {
      if (action.payload) {
        state.data.subCat.push(action.payload);
      }
    },
    removeSubCategory: (state, action: PayloadAction<string>) => {
      if (state.data.subCat && state.data.subCat.length > 0) {
        //Filter the array directly using "Inmer" to handle the inmutability
        const index = state.data.subCat.findIndex(
          (cat) => cat._id === action.payload
        );
        if (index !== -1) {
          //Using 'splice' to remove the element using index, if using Inmer this is securte to use.
          state.data.subCat.splice(index, 1);
        }
      }
    },
    updateSubCategory: (state, action: PayloadAction<SubCategoryData>) => {
      const index = state.data.subCat.findIndex(
        (cat) => cat._id === action.payload._id
      );
      if (index !== -1) {
        // Actualiza directamente el elemento en el 'draft' proporcionado por Immer
        state.data.subCat[index] = action.payload;
      }
    },
  },
  extraReducers(builder) {
    builder
      .addCase(fetchSubCat.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchSubCat.fulfilled, (state, action) => {
        state.status = "succeeded";
        // console.log(state.data);
        // console.log(action.payload);
        state.data.subCat = action.payload.subCategories;
        state.data.default = action.payload.defSubCategories;
        // console.log(state.data);
      })
      .addCase(fetchSubCat.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message;
      });
  },
});

export const getRedxSubCategories = (state: { subCategoryReducer: SubCategoriesState }) => state.subCategoryReducer;
export const getRedxSubCategoriesEstatus = (state: { subCategoryReducer: SubCategoriesState }) => state.subCategoryReducer.status;
export const getRedxSubCategoriesError = (state: { subCategoryReducer: SubCategoriesState }) => state.subCategoryReducer.error;

export const {
  setSubCategories,
  addNewSubCategory,
  updateSubCategory,
  removeSubCategory,
} = subCategoriesSlice.actions;

export default subCategoriesSlice.reducer; //This is the default value accros the app
