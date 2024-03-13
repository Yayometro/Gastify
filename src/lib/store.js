
import { configureStore } from '@reduxjs/toolkit'
import { createWrapper } from 'next-redux-wrapper';
import { setupListeners } from '@reduxjs/toolkit/query/react';
import { apiSlice } from './services/apiSlice';

import userReducer from './features/userSlice' //This is the general object with functions 
import walletReducer from './features/walletSlice'
import accountsReducer from './features/accountsSlice'
import transacctionsReducer from './features/transacctionsSlice'
import categoriesReducer from './features/categoriesSlice'
import subCategoryReducer from './features/subCategorySlice'
import tagsReducer from './features/tagsSlice'
import generalDataReducer from './features/loadGeneralDataSlice';
import budgetReducer from './features/budgetSlice';

export const store = configureStore({ //We set our general store using configureStore
    reducer: {
        userReducer, //This is one of the functions to be setted in the app
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
})

export const wrapper = createWrapper(store);

//Set up listeners for API consults:
setupListeners(store.dispatch)

