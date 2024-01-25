import { createSlice } from "@reduxjs/toolkit";

const user = {}
export const userSlice = createSlice({
    name: "user", //name of the state
    initialState: user,
    reducers: { //here are the acctions that willl update this initialState
        setUser: (state, action) => {
            return action.payload //Is the argument returned later when invoke the function
        }
    } 
})

export const {setUser} = userSlice.actions

export default userSlice.reducer //This is the default value accros the app