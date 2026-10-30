import { describe, expect, it } from "vitest";
import { currentMxCarExample, MX_CAR_EXAMPLE } from "./illustrativePrices";

describe("short-lived sourced examples", () => {
  it("shows the Mexican car example only while its checked price is fresh", () => {
    expect(currentMxCarExample("2026-10-30", "MXN")).toEqual(MX_CAR_EXAMPLE);
    expect(currentMxCarExample("2026-11-16", "MXN")).toBeNull();
    expect(currentMxCarExample("2026-10-30", "USD")).toBeNull();
  });
});
