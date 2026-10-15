import { describe, it, expect, vi, beforeEach } from "vitest";

vi.hoisted(() => {
  process.env.NEXT_PUBLIC_API_ROUTE = "http://test.local";
});

import { configureStore } from "@reduxjs/toolkit";
import transacctionsReducer, { fetchTrans } from "./transacctionsSlice";
import { skipWhileLoading } from "./thunkGuards";

describe("skipWhileLoading (duplicate initial fetches)", () => {
  const fetchMock = vi.fn();
  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockResolvedValue({ json: async () => ({ ok: true, data: [{ _id: "t1" }] }) });
    vi.stubGlobal("fetch", fetchMock);
  });

  it("several components dispatching at the same time make ONE request", async () => {
    const store = configureStore({ reducer: { transacctionsReducer } });
    const calls = [store.dispatch(fetchTrans("a@b.c")), store.dispatch(fetchTrans("a@b.c")), store.dispatch(fetchTrans("a@b.c"))];
    await Promise.all(calls);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(store.getState().transacctionsReducer.status).toBe("succeeded");
  });

  it("a refresh after the data arrived still goes through", async () => {
    const store = configureStore({ reducer: { transacctionsReducer } });
    await store.dispatch(fetchTrans("a@b.c"));
    await store.dispatch(fetchTrans("a@b.c"));
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("only blocks while the same slice is loading", () => {
    const { condition } = skipWhileLoading("x");
    expect(condition(undefined, { getState: () => ({ x: { status: "loading" } }) })).toBe(false);
    for (const status of ["idle", "succeeded", "failed"]) {
      expect(condition(undefined, { getState: () => ({ x: { status } }) })).toBe(true);
    }
    expect(condition(undefined, { getState: () => ({}) })).toBe(true);
  });
});
