import { describe, it, expect, vi } from "vitest";
import { configureStore } from "@reduxjs/toolkit";

// The slices call fetcher() when they are imported, which needs this variable.
vi.hoisted(() => {
  process.env.NEXT_PUBLIC_API_ROUTE = "http://localhost:3000";
});

import { rootReducer } from "../rootReducer";
import { getRedxUser, getRedxUserEstatus, getRedxUserError } from "./userSlice";
import { getRedxWallet, getRedxWalletEstatus, getRedxWalletError } from "./walletSlice";
import { getRedxAccounts, getRedxAccountsEstatus, getRedxAccountsError } from "./accountsSlice";
import { getRedxTransactions, getRedxTransactionsEstatus, getRedxTransactionsError } from "./transacctionsSlice";
import { getRedxCategories, getRedxCategoriesEstatus, getRedxCategoriesError } from "./categoriesSlice";
import { getRedxSubCategories, getRedxSubCategoriesEstatus, getRedxSubCategoriesError } from "./subCategorySlice";

// Bug 5: these selectors read keys that do not exist in the real store
// (state.accounts, state.user, state.ca ...), so they would have returned
// undefined or crashed. They are exercised against the real root reducer.
describe("slice selectors read the real store keys", () => {
  const state = configureStore({ reducer: rootReducer }).getState();

  it("user", () => {
    expect(getRedxUser(state)).toBe(state.userReducer);
    expect(getRedxUserEstatus(state)).toBe(state.userReducer.status);
    expect(getRedxUserError(state)).toBe(state.userReducer.error);
  });
  it("wallet", () => {
    expect(getRedxWallet(state)).toBe(state.walletReducer.data);
    expect(getRedxWalletEstatus(state)).toBe(state.walletReducer.status);
    expect(getRedxWalletError(state)).toBe(state.walletReducer.error);
  });
  it("accounts", () => {
    expect(getRedxAccounts(state)).toBe(state.accountsReducer.data);
    expect(getRedxAccountsEstatus(state)).toBe(state.accountsReducer.status);
    expect(getRedxAccountsError(state)).toBe(state.accountsReducer.error);
  });
  it("transactions", () => {
    expect(getRedxTransactions(state)).toBe(state.transacctionsReducer.data);
    expect(getRedxTransactionsEstatus(state)).toBe(state.transacctionsReducer.status);
    expect(getRedxTransactionsError(state)).toBe(state.transacctionsReducer.error);
  });
  it("categories", () => {
    expect(getRedxCategories(state)).toBe(state.categoriesReducer);
    expect(getRedxCategoriesEstatus(state)).toBe(state.categoriesReducer.status);
    expect(getRedxCategoriesError(state)).toBe(state.categoriesReducer.error);
  });
  it("sub-categories", () => {
    expect(getRedxSubCategories(state)).toBe(state.subCategoryReducer);
    expect(getRedxSubCategoriesEstatus(state)).toBe(state.subCategoryReducer.status);
    expect(getRedxSubCategoriesError(state)).toBe(state.subCategoryReducer.error);
  });
});
