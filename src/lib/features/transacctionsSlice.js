import { createSlice } from "@reduxjs/toolkit";

const transacctions = [];
export const transacctionsSlice = createSlice({
    name: "transacctionsState", //name of the state
    initialState: transacctions,
    reducers: { //here are the acctions that willl update this initialState
        setTransacctions: (state, action) => {
            return action.payload //Is the argument returned later when invoke the function
        },
        removeOneTransacction: (state, action) => {
            return state.filter(transacction => transacction._id !== action.payload)
        }
    } 
})

export const {setTransacctions, removeOneTransacction} = transacctionsSlice.actions

export default transacctionsSlice.reducer //This is the default value accros the app