import { describe, it, expect } from "vitest";
import { getPeriodLabel } from "./timeFunctions";

describe("getPeriodLabel", () => {
  const options = [
    { value: `${new Date(2026, 0, 1)}*${new Date(2026, 11, 31)}`, name: "All 2026" },
    { value: `${new Date(2025, 0, 1)}*${new Date(2025, 11, 31)}`, name: "All 2025" },
  ];

  it("returns the matching preset's name when the range resolves to a known preset", () => {
    const label = getPeriodLabel(options, [new Date(2026, 0, 1), new Date(2026, 11, 31)]);
    expect(label).toBe("All 2026");
  });

  it("falls back to the raw date range when nothing matches (a manual custom range)", () => {
    const label = getPeriodLabel(options, [new Date(2026, 2, 5), new Date(2026, 4, 20)]);
    expect(label).toBe("2026-03-05 to 2026-05-20");
  });

  it("returns 'No time selected' when either end of the range is missing", () => {
    expect(getPeriodLabel(options, [null, new Date(2026, 0, 1)])).toBe("No time selected");
    expect(getPeriodLabel(options, [])).toBe("No time selected");
  });
});
