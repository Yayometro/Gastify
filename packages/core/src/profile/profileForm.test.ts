import { describe, it, expect } from "vitest";

import { buildProfileBody, initialsOf, phoneDigits, profileToValues, validateProfile } from "./profileForm";

describe("validateProfile", () => {
  it("accepts a name with an optional phone", () => {
    expect(validateProfile({ fullName: "Ada Lovelace", phone: "" })).toEqual({});
    expect(validateProfile({ fullName: "Ada", phone: "+52 (55) 1234-5678" })).toEqual({});
  });
  it("asks for the name and rejects phones of the wrong length", () => {
    expect(validateProfile({ fullName: "  ", phone: "" }).fullName).toBe("profile.error.nameRequired");
    expect(validateProfile({ fullName: "x".repeat(81), phone: "" }).fullName).toBe("profile.error.nameTooLong");
    expect(validateProfile({ fullName: "Ada", phone: "123" }).phone).toBeTruthy();
    expect(validateProfile({ fullName: "Ada", phone: "1".repeat(16) }).phone).toBeTruthy();
  });
});

describe("buildProfileBody", () => {
  it("sends the phone as digits and leaves an empty one out", () => {
    expect(phoneDigits("+52 (55) 1234-5678")).toBe("525512345678");
    expect(buildProfileBody({ fullName: " Ada ", phone: "55 1234 5678" })).toEqual({ fullName: "Ada", phone: "5512345678" });
    expect(buildProfileBody({ fullName: "Ada", phone: "" })).toEqual({ fullName: "Ada" });
  });
});

describe("profileToValues and initialsOf", () => {
  it("reads the saved user and tolerates a missing one", () => {
    expect(profileToValues({ fullName: "Ada", phone: 5512345678 })).toEqual({ fullName: "Ada", phone: "5512345678" });
    expect(profileToValues(null)).toEqual({ fullName: "", phone: "" });
  });
  it("takes the first and last initial", () => {
    expect(initialsOf("ada lovelace byron")).toBe("AB");
    expect(initialsOf("Ada")).toBe("A");
    expect(initialsOf("")).toBe("?");
    expect(initialsOf(undefined)).toBe("?");
  });
});
