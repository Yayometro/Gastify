import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type GeneralDataState = unknown[];

const generalData: GeneralDataState = [];
export const generalDataSlice = createSlice({
    name: "generalData", //name of the state
    initialState: generalData,
    reducers: { //here are the acctions that willl update this initialState
        setGeneralData: (_state, action: PayloadAction<GeneralDataState>) => {
            return action.payload; //Is the argument returned later when invoke the function
        }
    } 
});

export const {setGeneralData} = generalDataSlice.actions;

export default generalDataSlice.reducer; //This is the default value accros the app