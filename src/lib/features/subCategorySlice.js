import { createSlice } from "@reduxjs/toolkit";

const subCategories = [];
export const subCategoriesSlice = createSlice({
    name: "subCategoriesState", //name of the state
    initialState: subCategories,
    reducers: { //here are the acctions that willl update this initialState
        setSubCategories: (state, action) => {
            return action.payload //Is the argument returned later when invoke the function
        }
    } 
})

export const {setSubCategories} = subCategoriesSlice.actions

export default subCategoriesSlice.reducer //This is the default value accros the app