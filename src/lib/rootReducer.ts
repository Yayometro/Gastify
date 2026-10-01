import { combineReducers, type UnknownAction } from "@reduxjs/toolkit";

import userReducer from "./features/userSlice";
import walletReducer from "./features/walletSlice";
import accountsReducer from "./features/accountsSlice";
import transacctionsReducer from "./features/transacctionsSlice";
import categoriesReducer from "./features/categoriesSlice";
import subCategoryReducer from "./features/subCategorySlice";
import tagsReducer from "./features/tagsSlice";
import generalDataReducer from "./features/loadGeneralDataSlice";
import budgetReducer from "./features/budgetSlice";

export const RESET_STORE = "app/resetStore";

// Dispatched when the signed-in user changes or signs out (see
// SessionStoreReset). The store is a module-level singleton that survives
// client-side navigation, so without this the next account to sign in on the
// same tab saw the previous account's data until a full page reload.
export const resetStore = () => ({ type: RESET_STORE });

const appReducer = combineReducers({
    userReducer,
    walletReducer,
    accountsReducer,
    transacctionsReducer,
    categoriesReducer,
    subCategoryReducer,
    tagsReducer,
    budgetReducer,
    generalDataReducer,
});

export type AppState = ReturnType<typeof appReducer>;

export const rootReducer = (state: AppState | undefined, action: UnknownAction): AppState =>
    appReducer(action.type === RESET_STORE ? undefined : state, action);
