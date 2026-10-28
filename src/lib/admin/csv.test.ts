import { describe, expect, it } from "vitest";
import { toCsv } from "./csv";

describe("toCsv", () => {
  it("writes a header and CRLF rows", () => {
    expect(toCsv(["day", "count"], [["2026-10-28", 3]])).toBe("day,count\r\n2026-10-28,3\r\n");
  });

  it("quotes cells with commas, quotes or line breaks and doubles the quotes", () => {
    expect(toCsv(["a"], [['say "hi", ok'], ["two\nlines"]])).toBe('a\r\n"say ""hi"", ok"\r\n"two\nlines"\r\n');
  });

  it("writes null and undefined as empty cells", () => {
    expect(toCsv(["a", "b"], [[null, undefined]])).toBe("a,b\r\n,\r\n");
  });
});
