import { describe, expect, it } from "vitest";
import User from "./User";

// Mongoose's strict mode drops every field the schema does not declare when an update writes it, so a field the profile saves
// (the language, the country) has to be in the schema or it is silently never stored.
describe("User model", () => {
  it("declares the language and the country the profile saves", () => {
    expect(User.schema.path("language")).toBeDefined();
    expect(User.schema.path("country")).toBeDefined();
  });

  it("declares the tutorial's record, without a default so that older accounts stay without one", () => {
    expect(User.schema.path("onboarding")).toBeDefined();
    const doc = new User({ mail: "old@example.com" });
    expect(doc.onboarding).toBeUndefined();
    const fresh = new User({ mail: "new@example.com", onboarding: { sessions: 0, lastSessionId: null, tutorial: "pending", progress: null } });
    expect(fresh.onboarding?.tutorial).toBe("pending");
    expect(fresh.onboarding?.sessions).toBe(0);
  });

  it("keeps them out of the data a route answers with the password and the tokens", async () => {
    const { toPublicUser } = await import("@/lib/auth/publicUser");
    const copy = toPublicUser({ mail: "me@example.com", language: "es", country: "MX", password: "x", apiTokens: [] });
    expect(copy).toEqual({ mail: "me@example.com", language: "es", country: "MX" });
  });
});
