import { describe, it, expect } from "vitest";
import { readableTextColor } from "./readableTextColor";

describe("readableTextColor", () => {
  it("gives dark text on light colours (the old default #DADADA) and light text on dark ones", () => {
    expect(readableTextColor("#DADADA")).toBe("#1e1533");
    expect(readableTextColor("#ffffff")).toBe("#1e1533");
    expect(readableTextColor("#fff")).toBe("#1e1533");
    expect(readableTextColor("#000000")).toBe("#ffffff");
    expect(readableTextColor("#251a45")).toBe("#ffffff");
  });
  it("returns null for a missing or non-hex colour", () => {
    expect(readableTextColor(undefined)).toBeNull();
    expect(readableTextColor("")).toBeNull();
    expect(readableTextColor("purple")).toBeNull();
  });
});
