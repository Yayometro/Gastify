import { describe, it, expect } from "vitest";
import { isHistoryReadyFor } from "./historyReady";

const cutoff = new Date(2025, 9, 1).toISOString();

describe("isHistoryReadyFor", () => {
  it("a period inside the recent part is always ready", () => {
    expect(isHistoryReadyFor({ historyStatus: "loading", historyCutoff: cutoff }, new Date(2025, 9, 1))).toBe(true);
    expect(isHistoryReadyFor({ historyStatus: "idle", historyCutoff: cutoff }, new Date(2026, 5, 1))).toBe(true);
  });
  it("a period that starts before the cutoff waits until the history is complete", () => {
    expect(isHistoryReadyFor({ historyStatus: "idle", historyCutoff: cutoff }, new Date(2025, 7, 1))).toBe(false);
    expect(isHistoryReadyFor({ historyStatus: "loading", historyCutoff: cutoff }, new Date(2025, 7, 1))).toBe(false);
    expect(isHistoryReadyFor({ historyStatus: "complete", historyCutoff: cutoff }, new Date(2025, 7, 1))).toBe(true);
  });
  it("all the starts must be covered", () => {
    expect(isHistoryReadyFor({ historyStatus: "loading", historyCutoff: cutoff }, new Date(2026, 0, 1), new Date(2024, 0, 1))).toBe(false);
    expect(isHistoryReadyFor({ historyStatus: "loading", historyCutoff: cutoff }, new Date(2026, 0, 1), undefined)).toBe(true);
  });
  it("never blocks when nothing more is coming or nothing is known", () => {
    expect(isHistoryReadyFor({ historyStatus: "failed", historyCutoff: cutoff }, new Date(2020, 0, 1))).toBe(true);
    expect(isHistoryReadyFor({ historyStatus: "idle", historyCutoff: null }, new Date(2020, 0, 1))).toBe(true);
    expect(isHistoryReadyFor({ historyStatus: "loading", historyCutoff: "garbage" }, new Date(2020, 0, 1))).toBe(true);
    expect(isHistoryReadyFor({ historyStatus: "loading", historyCutoff: cutoff }, "not a date", null, "")).toBe(true);
  });
});
