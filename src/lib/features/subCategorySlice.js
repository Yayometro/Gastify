import { createSlice, nanoid, createAsyncThunk } from "@reduxjs/toolkit";
import fetcher from "@/helpers/fetcher";

const toFetch = fetcher();

const subCategories = {
  data: {
    subCat: [],
    default: [],
  },
  status: "idle", //'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
};

export const fetchSubCat = createAsyncThunk(
  "subCategories/fetchSubCat",
  async (mail) => {
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
    setSubCategories: (state, action) => {
      return action.payload; //Is the argument returned later when invoke the function
    },
    addNewSubCategory: (state, action) => {
      if (action.payload) {
        state.data.subCat.push(action.payload);
      }
    },
    removeSubCategory: (state, action) => {
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
    updateSubCategory: (state, action) => {
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
      .addCase(fetchSubCat.pending, (state, action) => {
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

export const getRedxSubCategories = (state) => state;
export const getRedxSubCategoriesEstatus = (state) => state;
export const getRedxSubCategoriesError = (state) => state;

export const {
  setSubCategories,
  addNewSubCategory,
  updateSubCategory,
  removeSubCategory,
} = subCategoriesSlice.actions;

export default subCategoriesSlice.reducer; //This is the default value accros the app
