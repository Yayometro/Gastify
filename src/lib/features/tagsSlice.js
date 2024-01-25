import { createSlice } from "@reduxjs/toolkit";

const tags = [];
export const tagsSlice = createSlice({
    name: "tagsState", //name of the state
    initialState: tags,
    reducers: { //here are the acctions that willl update this initialState
        setTags: (state, action) => {
            return action.payload //Is the argument returned later when invoke the function
        }
    } 
})

export const {setTags} = tagsSlice.actions

export default tagsSlice.reducer //This is the default value accros the app