import { describe, expect, it } from "vitest";
import { isAdminEmail, parseAdminEmails } from "./adminAccess";

describe("parseAdminEmails", () => {
  it("splits on commas, trims and lower-cases", () => {
    expect(parseAdminEmails(" Luis@Example.com , other@example.com ")).toEqual(["luis@example.com", "other@example.com"]);
  });

  it("drops blanks and treats missing as empty", () => {
    expect(parseAdminEmails("a@x.com,, ,")).toEqual(["a@x.com"]);
    expect(parseAdminEmails(undefined)).toEqual([]);
    expect(parseAdminEmails("")).toEqual([]);
  });
});

describe("isAdminEmail", () => {
  it("accepts a listed email whatever its case or spaces", () => {
    expect(isAdminEmail(" LUIS@example.com ", "luis@example.com")).toBe(true);
  });

  it("rejects an email that is not listed", () => {
    expect(isAdminEmail("other@example.com", "luis@example.com")).toBe(false);
  });

  it("rejects everyone when the list is empty or missing", () => {
    expect(isAdminEmail("luis@example.com", "")).toBe(false);
    expect(isAdminEmail("luis@example.com", undefined)).toBe(false);
  });

  it("rejects a missing email", () => {
    expect(isAdminEmail(null, "luis@example.com")).toBe(false);
    expect(isAdminEmail(undefined, "luis@example.com")).toBe(false);
  });

  it("does not match by substring", () => {
    expect(isAdminEmail("luis@example.com.evil.io", "luis@example.com")).toBe(false);
    expect(isAdminEmail("xluis@example.com", "luis@example.com")).toBe(false);
  });
});
