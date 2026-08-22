import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/app/api/dbConnection", () => ({ default: vi.fn() }));

const { fakeSession } = vi.hoisted(() => {
  const fakeSession = {
    withTransaction: vi.fn(async (fn) => fn()),
    endSession: vi.fn(async () => {}),
  };
  return { fakeSession };
});
vi.mock("@/model/Transaction", () => ({
  default: { find: vi.fn(), deleteMany: vi.fn() },
}));
vi.mock("mongoose", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    default: { ...actual.default, startSession: vi.fn(async () => fakeSession) },
  };
});

import Transaction from "@/model/Transaction";
import { POST } from "./route";

function mockRequest(body) {
  return { json: vi.fn().mockResolvedValue(body) };
}

beforeEach(() => {
  vi.clearAllMocks();
  fakeSession.withTransaction.mockImplementation(async (fn) => fn());
});

describe("transfer/remove", () => {
  it("removes both legs together inside one transaction", async () => {
    Transaction.find.mockReturnValue({
      lean: vi.fn().mockResolvedValue([{ _id: "leg1" }, { _id: "leg2" }]),
    });
    Transaction.deleteMany.mockResolvedValue({ deletedCount: 2 });

    const res = await POST(mockRequest({ transferGroupId: "grp1" }));
    const body = await res.json();

    expect(body.ok).toBe(true);
    expect(body.data.deletedIds).toEqual(["leg1", "leg2"]);
    expect(Transaction.deleteMany).toHaveBeenCalledWith({ transferGroupId: "grp1" }, { session: fakeSession });
    expect(fakeSession.withTransaction).toHaveBeenCalledTimes(1);
  });

  it("rejects when no legs are found for the given transferGroupId", async () => {
    Transaction.find.mockReturnValue({ lean: vi.fn().mockResolvedValue([]) });

    const res = await POST(mockRequest({ transferGroupId: "missing" }));
    const body = await res.json();

    expect(body.ok).toBe(false);
    expect(Transaction.deleteMany).not.toHaveBeenCalled();
  });
});
