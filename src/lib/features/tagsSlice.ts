import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface TagItem {
  _id?: string;
  name?: string;
  color?: string;
  wallet?: string;
  user?: string;
  [key: string]: unknown;
}

export type TagsState = TagItem[];

const tags: TagsState = [];
export const tagsSlice = createSlice({
    name: "tagsState", //name of the state
    initialState: tags,
    reducers: { //here are the acctions that willl update this initialState
        setTags: (_state, action: PayloadAction<TagsState | unknown>) => {
            return action.payload as TagsState; //Is the argument returned later when invoke the function
        }
    } 
});

export const {setTags} = tagsSlice.actions;

export default tagsSlice.reducer; //This is the default value accros the app