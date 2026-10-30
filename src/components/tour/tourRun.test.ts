import { describe, expect, it } from "vitest";
import { clearRun, readRun, takePendingRun, writeRun, type TourRun } from "./tourRun";

function fakeStore(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
    removeItem: (key: string) => void data.delete(key),
    data,
  };
}

const run: TourRun = { list: ["intro", "dashboard", "movements"], position: 1, pending: true };

describe("tour run", () => {
  it("keeps the walk between pages and clears it", () => {
    const store = fakeStore();
    writeRun(run, store);
    expect(readRun(store)).toEqual(run);
    clearRun(store);
    expect(readRun(store)).toBeNull();
  });

  it("keeps the card to start at, when the walk names one", () => {
    const store = fakeStore();
    writeRun({ ...run, step: "budgets.savings" }, store);
    expect(readRun(store)?.step).toBe("budgets.savings");
    expect(takePendingRun(store)).toEqual({ ...run, step: "budgets.savings", pending: false });
  });

  it("ignores anything that is not a walk this code wrote", () => {
    for (const raw of [
      "not json",
      JSON.stringify({ list: [], position: 0, pending: true }),
      JSON.stringify({ list: ["nope"], position: 0, pending: true }),
      JSON.stringify({ list: ["intro"], position: 3, pending: true }),
      JSON.stringify({ list: ["intro"], position: 0, pending: "yes" }),
      JSON.stringify({ list: ["intro"], position: 0, pending: true, step: 3 }),
      JSON.stringify(null),
    ]) {
      expect(readRun(fakeStore({ "gf-tour-run": raw }))).toBeNull();
    }
  });

  it("hands a pending walk to the first page that asks and to no other", () => {
    const store = fakeStore();
    writeRun(run, store);
    expect(takePendingRun(store)).toEqual({ ...run, pending: false });
    expect(takePendingRun(store)).toBeNull();
    expect(readRun(store)).toEqual({ ...run, pending: false });
  });

  it("does nothing without storage, or when storage throws", () => {
    expect(readRun(null)).toBeNull();
    expect(() => writeRun(run, null)).not.toThrow();
    expect(() => clearRun(null)).not.toThrow();
    const broken = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
      removeItem: () => {
        throw new Error("blocked");
      },
    };
    expect(readRun(broken)).toBeNull();
    expect(() => writeRun(run, broken)).not.toThrow();
    expect(() => clearRun(broken)).not.toThrow();
    expect(takePendingRun(broken)).toBeNull();
  });
});
