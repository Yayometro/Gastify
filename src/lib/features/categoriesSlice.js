import { createSlice } from "@reduxjs/toolkit";

const categories = [];
export const categoriesSlice = createSlice({
    name: "categoriesState", //name of the state
    initialState: categories,
    reducers: { //here are the acctions that willl update this initialState
        setCategories: (state, action) => {
            return action.payload //Is the argument returned later when invoke the function
        }
    } 
})

export const {setCategories} = categoriesSlice.actions

export default categoriesSlice.reducer //This is the default value accros the app