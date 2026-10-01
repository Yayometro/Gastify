import { describe, it, expect, vi } from "vitest";
import { configureStore } from "@reduxjs/toolkit";

// The slices call fetcher() at import time, which needs this variable.
vi.hoisted(() => {
    process.env.NEXT_PUBLIC_API_ROUTE = "http://localhost:3000";
});

import { rootReducer, resetStore } from "./rootReducer";
import { updateUser } from "./features/userSlice";

describe("rootReducer resetStore", () => {
    it("puts every slice back to its initial state", () => {
        const store = configureStore({ reducer: rootReducer });
        const initial = store.getState();
        store.dispatch(updateUser({ fullName: "Previous Account", mail: "previous@example.com" } as never));
        expect(store.getState()).not.toEqual(initial);
        store.dispatch(resetStore());
        expect(store.getState()).toEqual(initial);
    });
});
