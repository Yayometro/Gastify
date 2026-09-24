import { configureStore } from '@reduxjs/toolkit';
import { createWrapper } from 'next-redux-wrapper';
import { setupListeners } from '@reduxjs/toolkit/query/react';

import userReducer from './features/userSlice';
import walletReducer from './features/walletSlice';
import accountsReducer from './features/accountsSlice';
import transacctionsReducer from './features/transacctionsSlice';
import categoriesReducer from './features/categoriesSlice';
import subCategoryReducer from './features/subCategorySlice';
import tagsReducer from './features/tagsSlice';
import generalDataReducer from './features/loadGeneralDataSlice';
import budgetReducer from './features/budgetSlice';

export const store = configureStore({
    reducer: {
        userReducer,
        walletReducer,
        accountsReducer,
        transacctionsReducer,
        categoriesReducer,
        subCategoryReducer,
        tagsReducer,
        budgetReducer,
        generalDataReducer
    },
    // middleware: (getDefaultMiddleware) => 
    //     getDefaultMiddleware().concat(apiSlice.middleware)
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export type AppStore = typeof store;

export const wrapper = createWrapper<AppStore>(() => store);

//Set up listeners for API consults:
setupListeners(store.dispatch);
