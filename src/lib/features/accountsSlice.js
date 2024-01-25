import { createSlice } from "@reduxjs/toolkit";

const accounts = [];
export const accountsSlice = createSlice({
    name: "accountsState", //name of the state
    initialState: accounts,
    reducers: { //here are the acctions that willl update this initialState
        setAccounts: (state, action) => {
            return action.payload //Is the argument returned later when invoke the function
        }
    } 
})

export const {setAccounts} = accountsSlice.actions

export default accountsSlice.reducer //This is the default value accros the app