import { configureStore } from '@reduxjs/toolkit';
import { createWrapper } from 'next-redux-wrapper';
import { setupListeners } from '@reduxjs/toolkit/query/react';

import { rootReducer } from './rootReducer';

export const store = configureStore({
    reducer: rootReducer,
    // middleware: (getDefaultMiddleware) => 
    //     getDefaultMiddleware().concat(apiSlice.middleware)
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export type AppStore = typeof store;

export const wrapper = createWrapper<AppStore>(() => store);

//Set up listeners for API consults:
setupListeners(store.dispatch);
