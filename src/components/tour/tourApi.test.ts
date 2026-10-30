import { beforeEach, describe, expect, it, vi } from "vitest";

// A plain function behind the mock (not vi.fn): vitest tracks what a mocked function returns, and a promise that rejects on
// purpose would then be reported as an unhandled rejection even though the code under test handles it.
const server = vi.hoisted(() => ({
  calls: [] as unknown[][],
  answer: (async () => ({})) as (...args: unknown[]) => Promise<unknown>,
}));
vi.mock("@/helpers/fetcher", () => ({
  default: () => ({
    post: (...args: unknown[]) => {
      server.calls.push(args);
      return server.answer(...args);
    },
  }),
}));

import { callOnboarding } from "./tourApi";

beforeEach(() => {
  server.calls.length = 0;
});

describe("callOnboarding", () => {
  it("posts the action to the onboarding route and returns the reply", async () => {
    server.answer = async () => ({ ok: true, onboarding: null, action: "announce" });
    const reply = await callOnboarding({ action: "visit" });
    expect(server.calls).toEqual([["general-data/user/onboarding", { action: "visit" }]]);
    expect(reply?.action).toBe("announce");
  });

  it("gives null when the server refuses or the call fails, never an error", async () => {
    server.answer = async () => ({ ok: false, message: "no session", onboarding: null });
    expect(await callOnboarding({ action: "state" })).toBeNull();
    server.answer = () => Promise.reject(new Error("offline"));
    expect(await callOnboarding({ action: "progress", tour: "budgets", step: "budgets.period" })).toBeNull();
  });
});
