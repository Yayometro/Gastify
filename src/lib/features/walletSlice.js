import { createSlice } from "@reduxjs/toolkit";

const wallet = {};
export const walletSlice = createSlice({
    name: "walletState", //name of the state
    initialState: wallet,
    reducers: { //here are the acctions that willl update this initialState
        setWallet: (state, action) => {
            return action.payload //Is the argument returned later when invoke the function
        }
    } 
})

export const {setWallet} = walletSlice.actions

export default walletSlice.reducer //This is the default value accros the app