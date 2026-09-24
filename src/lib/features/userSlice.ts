import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import fetcher from "@/helpers/fetcher";

const toFetch = fetcher();

export interface UserData {
  _id?: string;
  fullName?: string;
  mail?: string;
  password?: string;
  image?: string;
  phone?: number;
  wallet?: string;
  apiTokens?: {
    name: string;
    tokenHash: string;
    createdAt?: Date | string;
    lastUsedAt?: Date | string | null;
  }[];
  createdAt?: Date | string;
  updatedAt?: Date | string;
  [key: string]: unknown;
}

export type UserStatus = "idle" | "loading" | "succeeded" | "failed";

export interface UserState {
  data: UserData | Record<string, unknown>;
  status: UserStatus;
  error: string | null | undefined;
}

const user: UserState = {
  data: {},
  status: "idle", //'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
};

export const fetchUser = createAsyncThunk(
  "user/fetchUser",
  async (mail?: unknown) => {
    // console.log("mail ", mail)
    try {
      const response = await toFetch.post(
        "general-data/user/get-user",
        mail
      );
      // console.log("response", response)
      if (response.ok) {
        return response.data;
      } else {
        console.log("Something went wrong");
      }
    } catch (e) {
      console.log(e);
      throw new Error(e);
    }
  }
);

export const userSlice = createSlice({
  name: "user", //name of the state
  initialState: user,
  reducers: {
    //here are the acctions that willl update this initialState
    setUser: (state, action: PayloadAction<UserState>) => {
      return action.payload; //Is the argument returned later when invoke the function
    },
    updateUser: (state, action: PayloadAction<UserData | Record<string, unknown>>) => {
      if (action.payload) {
        state.data = action.payload;
      }
    },
  },
  extraReducers(builder) {
    builder
      .addCase(fetchUser.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchUser.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.data = action.payload;
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

export const getRedxUser = (state: { user: UserState }) => state.user;
export const getRedxUserEstatus = (state: { user: UserState }) => state.user.status;
export const getRedxUserError = (state: { user: UserState }) => state.user.error;

export const { setUser, updateUser } = userSlice.actions;

export default userSlice.reducer; //This is the default value accros the app
