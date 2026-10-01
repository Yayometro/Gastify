import { describe, it, expect } from "vitest";
import { toPublicUser } from "./publicUser";

const fullUser = {
  _id: "u1",
  fullName: "Test User",
  mail: "test@example.com",
  password: "$2a$10$legacyhash",
  phone: 5551234567,
  wallet: "w1",
  apiTokens: [
    {
      name: "Claude",
      tokenHash: "abc123",
      createdAt: new Date(0),
      lastUsedAt: null,
    },
  ],
};

describe("toPublicUser", () => {
  it("drops password and apiTokens from a plain (lean) object", () => {
    const result = toPublicUser(fullUser) as Record<string, unknown>;
    expect(result).not.toHaveProperty("password");
    expect(result).not.toHaveProperty("apiTokens");
  });

  it("keeps every other field untouched", () => {
    const result = toPublicUser(fullUser);
    expect(result).toEqual({
      _id: "u1",
      fullName: "Test User",
      mail: "test@example.com",
      phone: 5551234567,
      wallet: "w1",
    });
  });

  it("does not mutate the object it receives", () => {
    const input = { ...fullUser };
    toPublicUser(input);
    expect(input.password).toBe("$2a$10$legacyhash");
    expect(input.apiTokens).toHaveLength(1);
  });

  it("converts a Mongoose-like document with toObject() before stripping", () => {
    const doc = { toObject: () => ({ ...fullUser }) };
    const result = toPublicUser(doc) as Record<string, unknown>;
    expect(result.mail).toBe("test@example.com");
    expect(result).not.toHaveProperty("password");
    expect(result).not.toHaveProperty("apiTokens");
    expect(result).not.toHaveProperty("toObject");
  });

  it("works when the sensitive fields are already absent", () => {
    const result = toPublicUser({ mail: "a@b.c" });
    expect(result).toEqual({ mail: "a@b.c" });
  });
});
