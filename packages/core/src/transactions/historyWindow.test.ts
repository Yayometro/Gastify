import { describe, it, expect, vi, beforeEach } from "vitest";

vi.hoisted(() => {
  process.env.NEXT_PUBLIC_API_ROUTE = "http://test.local";
});

import { configureStore } from "@reduxjs/toolkit";
import { getRecentCutoff, isBeforeCutoff, mergeById, movementTime } from "./historyWindow";
import transacctionsReducer, { fetchTrans, fetchTransHistory } from "@/lib/features/transacctionsSlice";

describe("historyWindow", () => {
  it("cuts on the first day of the month, 12 months back", () => {
    const cut = getRecentCutoff(new Date(2026, 9, 13, 15, 30));
    expect([cut.getFullYear(), cut.getMonth(), cut.getDate(), cut.getHours()]).toEqual([2025, 9, 1, 0]);
    expect(getRecentCutoff(new Date(2026, 0, 31)).getMonth()).toBe(0);
    expect(getRecentCutoff(new Date(2026, 0, 31)).getFullYear()).toBe(2025);
  });

  it("uses date, falls back to createdAt, and treats undated movements as history", () => {
    const cut = new Date(2025, 9, 1);
    expect(isBeforeCutoff({ date: "2025-09-30T10:00:00Z" }, cut)).toBe(true);
    expect(isBeforeCutoff({ date: new Date(2025, 9, 1) }, cut)).toBe(false);
    expect(isBeforeCutoff({ date: null, createdAt: "2026-01-01" }, cut)).toBe(false);
    expect(isBeforeCutoff({}, cut)).toBe(true);
    expect(isBeforeCutoff({ date: "not a date" }, cut)).toBe(true);
    expect(movementTime(null)).toBeNull();
  });

  it("merges two lists keeping the first copy of each id", () => {
    expect(mergeById([{ _id: "a", v: 1 }, { _id: "b" }], [{ _id: "a", v: 2 }, { _id: "c" }])).toEqual([
      { _id: "a", v: 1 },
      { _id: "b" },
      { _id: "c" },
    ]);
  });
});

describe("two-phase movements loading", () => {
  const fetchMock = vi.fn();
  const recent = [{ _id: "r1", date: new Date().toISOString() }];
  const older = [{ _id: "o1", date: "2015-01-01T00:00:00Z" }, { _id: "o2" }];
  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockImplementation(async (_url: string, init: { body: string }) => {
      const body = JSON.parse(init.body);
      return { json: async () => ({ ok: true, data: body.since ? recent : older }) };
    });
    vi.stubGlobal("fetch", fetchMock);
  });

  it("recent first, then the history, without duplicates", async () => {
    const store = configureStore({ reducer: { transacctionsReducer } });
    await store.dispatch(fetchTrans("a@b.c"));
    let st = store.getState().transacctionsReducer;
    expect(st.status).toBe("succeeded");
    expect(st.historyStatus).toBe("idle");
    expect(st.data.map((t) => t._id)).toEqual(["r1"]);
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).since).toBe(st.historyCutoff);

    await store.dispatch(fetchTransHistory());
    st = store.getState().transacctionsReducer;
    expect(st.historyStatus).toBe("complete");
    expect(st.data.map((t) => t._id).sort()).toEqual(["o1", "o2", "r1"]);
    expect(JSON.parse(fetchMock.mock.calls[1][1].body).before).toBe(st.historyCutoff);

    // A second history request is skipped once it is complete.
    await store.dispatch(fetchTransHistory());
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("reloading the recent part keeps the history already loaded", async () => {
    const store = configureStore({ reducer: { transacctionsReducer } });
    await store.dispatch(fetchTrans("a@b.c"));
    await store.dispatch(fetchTransHistory());
    await store.dispatch(fetchTrans("a@b.c"));
    expect(store.getState().transacctionsReducer.data.map((t) => t._id).sort()).toEqual(["o1", "o2", "r1"]);
  });

  it("the history is not requested before the recent part sets the cutoff", async () => {
    const store = configureStore({ reducer: { transacctionsReducer } });
    await store.dispatch(fetchTransHistory());
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

import { buildDateWindowFilter } from "./historyWindowQuery";

describe("buildDateWindowFilter (server)", () => {
  const since = "2025-10-01T06:00:00.000Z";
  it("no window -> everything (also for the legacy body, a bare email)", () => {
    expect(buildDateWindowFilter(null)).toEqual({});
    expect(buildDateWindowFilter("a@b.c")).toEqual({});
    expect(buildDateWindowFilter({ since: "nope" })).toEqual({});
  });
  it("since -> date on/after, or no date and createdAt on/after", () => {
    expect(buildDateWindowFilter({ since })).toEqual({
      $or: [{ date: { $gte: new Date(since) } }, { date: { $in: [null] }, createdAt: { $gte: new Date(since) } }],
    });
  });
  it("before -> exactly the complement of since", () => {
    expect(buildDateWindowFilter({ before: since })).toEqual({ $nor: [buildDateWindowFilter({ since })] });
  });
});
