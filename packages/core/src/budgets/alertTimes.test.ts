import { describe, it, expect } from "vitest";
import { alertDate, seeNotices } from "./alertTimes";

const NOW = "2026-10-27T10:30:00.000Z";

describe("seeNotices", () => {
  it("gives no date to the notices that were already there before the record existed", () => {
    expect(seeNotices(null, ["b1:2026-10:1", "b2:2026-10:2"], NOW)).toEqual({ "b1:2026-10:1": null, "b2:2026-10:2": null });
  });

  it("starts an empty record even when there are no notices yet, so the next visit is not treated as the first", () => {
    expect(seeNotices(null, [], NOW)).toEqual({});
  });

  it("dates a notice that appears after the record exists with the moment it was seen", () => {
    const before = seeNotices(null, ["b1:2026-10:1"], NOW);
    const later = seeNotices(before, ["b1:2026-10:1", "b2:2026-10:2"], "2026-10-28T08:00:00.000Z");
    expect(later["b2:2026-10:2"]).toBe("2026-10-28T08:00:00.000Z");
    expect(later["b1:2026-10:1"]).toBeNull();
  });

  it("keeps the date of a notice it has already seen", () => {
    const seen = seeNotices(seeNotices(null, [], NOW), ["b1:2026-10:1"], NOW);
    const again = seeNotices(seen, ["b1:2026-10:1"], "2026-10-29T09:00:00.000Z");
    expect(again["b1:2026-10:1"]).toBe(NOW);
  });

  it("keeps only the newest 200 entries", () => {
    const keys = Array.from({ length: 205 }, (_, i) => `b${i}:2026-10:1`);
    const record = seeNotices(seeNotices(null, [], NOW), keys, NOW);
    expect(Object.keys(record)).toHaveLength(200);
    expect(record["b0:2026-10:1"]).toBeUndefined();
    expect(record["b204:2026-10:1"]).toBe(NOW);
  });
});

describe("alertDate", () => {
  it("returns the date of a notice, or null when unknown", () => {
    const record = { "b1:2026-10:1": NOW, "b2:2026-10:2": null };
    expect(alertDate(record, "b1:2026-10:1")).toBe(NOW);
    expect(alertDate(record, "b2:2026-10:2")).toBeNull();
    expect(alertDate(record, "missing")).toBeNull();
    expect(alertDate(null, "b1:2026-10:1")).toBeNull();
  });
});
