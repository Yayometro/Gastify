import { createSlice, nanoid, createAsyncThunk } from "@reduxjs/toolkit";
import fetcher from "@/helpers/fetcher";

const toFetch = fetcher();

const user = {
  data: {},
  status: "idle", //'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
};

export const fetchUser = createAsyncThunk("user/fetchUser", async (mail) => {
    // console.log(mail)
  try {
    const response = await toFetch.post(
      "general-data/user/get-user",
      mail
    );
    // console.log(response)
    if (response.ok) {
      return response.data;
    } else {
      console.log("Something went wrong");
    }
  } catch (e) {
    console.log(e)
    throw new Error(e);
  }
});

export const userSlice = createSlice({
  name: "user", //name of the state
  initialState: user,
  reducers: {
    //here are the acctions that willl update this initialState
    setUser: (state, action) => {
      return action.payload; //Is the argument returned later when invoke the function
    },
    updateUser: (state, action) => {
      if(action.payload){
        state.data = action.payload
      }
    },
  },
  extraReducers(builder) {
    builder
      .addCase(fetchUser.pending, (state, action) => {
        state.status = "loading";
      })
      .addCase(fetchUser.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.data = action.payload
        // console.log(state.data);
        // console.log(action.payload);
        // console.log(state.data);
      })
      .addCase(fetchUser.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message;
      });
  },
});

export const getRedxUser = (state) => state.user;
export const getRedxUserEstatus = (state) => state.user.status;
export const getRedxUserError = (state) => state.user.error;

export const { setUser, updateUser } = userSlice.actions;

export default userSlice.reducer; //This is the default value accros the app
