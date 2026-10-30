import { beforeEach, describe, expect, it, vi } from "vitest";

// Each model is replaced by a small class that keeps what it is given and "saves" it; only User's update is observed.
const hoisted = vi.hoisted(() => {
  class FakeDoc {
    _id: string;
    constructor(data: Record<string, unknown>) {
      Object.assign(this, data);
      this._id = `id-${Math.random().toString(36).slice(2)}`;
    }
    async save() {
      return this;
    }
  }
  return { FakeDoc, findByIdAndUpdate: vi.fn() };
});

vi.mock("@/model/User", () => ({ default: { findByIdAndUpdate: hoisted.findByIdAndUpdate } }));
vi.mock("@/model/Wallet", () => ({ default: class extends hoisted.FakeDoc { budget: Record<string, unknown> = {}; } }));
vi.mock("@/model/Account", () => ({ default: hoisted.FakeDoc }));
vi.mock("@/model/Transaction", () => ({ default: class extends hoisted.FakeDoc { tags: unknown[] = []; } }));
vi.mock("@/model/Category", () => ({ default: class extends hoisted.FakeDoc { accounts: unknown[] = []; } }));
vi.mock("@/model/SubCategory", () => ({ default: hoisted.FakeDoc }));
vi.mock("@/model/Tag", () => ({ default: hoisted.FakeDoc }));
vi.mock("@/model/Budget", () => ({ default: hoisted.FakeDoc }));

import { provisionNewUserData } from "./provisionNewUserData";

beforeEach(() => hoisted.findByIdAndUpdate.mockReset());

describe("provisionNewUserData", () => {
  it("links the wallet and starts the tutorial's record for the new account", async () => {
    const { wallet } = await provisionNewUserData({ id: "user-1", fullName: "Ana" });

    expect(hoisted.findByIdAndUpdate).toHaveBeenCalledTimes(1);
    const [id, update] = hoisted.findByIdAndUpdate.mock.calls[0];
    expect(id).toBe("user-1");
    expect(update.wallet).toBe(wallet._id);
    expect(update.onboarding).toEqual({ sessions: 0, lastSessionId: null, tutorial: "pending", progress: null });
  });
});
