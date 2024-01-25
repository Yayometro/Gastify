import { createSlice } from "@reduxjs/toolkit";

const generalData = [];
export const generalDataSlice = createSlice({
    name: "generalData", //name of the state
    initialState: generalData,
    reducers: { //here are the acctions that willl update this initialState
        setGeneralData: (state, action) => {
            return action.payload //Is the argument returned later when invoke the function
        }
    } 
})

export const {setGeneralData} = generalDataSlice.actions

export default generalDataSlice.reducer //This is the default value accros the app