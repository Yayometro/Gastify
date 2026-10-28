import { describe, expect, it } from "vitest";
import { accountFilter, confirmationCode, confirmationMatches, deletionBlock, PERSON_COLLECTIONS, PROTECTED_EMAILS, totalDocuments } from "./accountDeletion";

const USER = "659ddbcda72c4de71b9361b5";
const SELF = "111111111111111111111111";

describe("deletionBlock", () => {
  it("lets an ordinary account be deleted", () => {
    expect(deletionBlock({ userId: USER, email: "pepe@pepe", selfId: SELF, adminEmails: ["gsfrido10@gmail.com"] })).toBeNull();
  });

  it("refuses the admin's own account", () => {
    expect(deletionBlock({ userId: SELF, email: "gsfrido10@gmail.com", selfId: SELF, adminEmails: [] })).toBe("self");
  });

  it("refuses any account on the admin list, whatever its case", () => {
    expect(deletionBlock({ userId: USER, email: "GSFRIDO10@gmail.com", selfId: SELF, adminEmails: ["gsfrido10@gmail.com"] })).toBe("admin");
  });

  it("refuses the QA base account", () => {
    expect(PROTECTED_EMAILS).toContain("qa.movil.d6be4e@example.com");
    expect(deletionBlock({ userId: USER, email: "qa.movil.d6be4e@example.com", selfId: SELF, adminEmails: [] })).toBe("protected");
  });

  it("allows a missing email (the account is not on any list)", () => {
    expect(deletionBlock({ userId: USER, email: null, selfId: SELF, adminEmails: ["gsfrido10@gmail.com"] })).toBeNull();
  });
});

describe("confirmation", () => {
  it("asks for the last six characters of the identifier", () => {
    expect(confirmationCode(USER)).toBe("9361b5");
  });

  it("accepts that code in any case and with spaces, and nothing else", () => {
    expect(confirmationMatches(USER, " 9361B5 ")).toBe(true);
    expect(confirmationMatches(USER, "9361b4")).toBe(false);
    expect(confirmationMatches(USER, "")).toBe(false);
  });
});

describe("accountFilter", () => {
  it("matches the id as an ObjectId and as a string, for the person's collections", () => {
    const filter = accountFilter("user", USER) as { user: { $in: unknown[] } };
    expect(filter.user.$in).toHaveLength(2);
    expect(filter.user.$in[1]).toBe(USER);
  });

  it("uses _id for the user document itself", () => {
    const filter = accountFilter("_id", USER) as { _id: { $in: unknown[] } };
    expect(filter._id.$in).toHaveLength(1);
  });
});

describe("PERSON_COLLECTIONS", () => {
  it("lists each collection once, and the user document last", () => {
    const names = PERSON_COLLECTIONS.map((entry) => entry.name);
    expect(new Set(names).size).toBe(names.length);
    expect(names[names.length - 1]).toBe("users");
  });
});

describe("totalDocuments", () => {
  it("adds the counts", () => {
    expect(totalDocuments([
      { name: "a", label: "A", documents: 2 },
      { name: "b", label: "B", documents: 3 },
    ])).toBe(5);
  });
});
