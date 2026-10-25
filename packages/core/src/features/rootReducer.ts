import { combineReducers, type UnknownAction } from "@reduxjs/toolkit";

import userReducer from "./userSlice";
import walletReducer from "./walletSlice";
import accountsReducer from "./accountsSlice";
import transacctionsReducer from "./transacctionsSlice";
import categoriesReducer from "./categoriesSlice";
import subCategoryReducer from "./subCategorySlice";
import tagsReducer from "./tagsSlice";
import generalDataReducer from "./loadGeneralDataSlice";
import budgetReducer from "./budgetSlice";

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
