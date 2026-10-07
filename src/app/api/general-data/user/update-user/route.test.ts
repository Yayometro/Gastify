import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("../../../dbConnection", () => ({ default: vi.fn() }));
vi.mock("@/lib/auth/betterAuth", () => ({
  auth: { api: { getSession: vi.fn(), setPassword: vi.fn() } },
}));
vi.mock("@/model/User", () => ({ default: { findOne: vi.fn(), findOneAndUpdate: vi.fn() } }));

import { POST } from "./route";
import { auth } from "@/lib/auth/betterAuth";
import User from "@/model/User";

const api = auth.api as unknown as { getSession: ReturnType<typeof vi.fn>; setPassword: ReturnType<typeof vi.fn> };
const userModel = User as unknown as {
  findOne: ReturnType<typeof vi.fn>;
  findOneAndUpdate: ReturnType<typeof vi.fn>;
};

const PHONE = "5512345678";
const req = (body: unknown) => ({ headers: new Headers(), json: async () => body }) as unknown as Request;

let logSpy: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  vi.clearAllMocks();
  logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  api.getSession.mockResolvedValue({ user: { email: "me@example.com" } });
  userModel.findOne.mockReturnValue({ lean: async () => ({ mail: "me@example.com", fullName: "Me", phone: 1 }) });
  userModel.findOneAndUpdate.mockResolvedValue({
    mail: "me@example.com",
    fullName: "Me",
    phone: Number(PHONE),
    toObject() {
      return { mail: this.mail, fullName: this.fullName, phone: this.phone };
    },
  });
});
afterEach(() => logSpy.mockRestore());

describe("POST /api/general-data/user/update-user", () => {
  it("never writes the phone number to the server logs (S4)", async () => {
    await POST(req({ phone: PHONE }));
    const logged = JSON.stringify(logSpy.mock.calls);
    expect(logged).not.toContain(PHONE);
  });

  it("still saves the phone as a number", async () => {
    await POST(req({ phone: PHONE }));
    expect(userModel.findOneAndUpdate).toHaveBeenCalledWith(
      { mail: "me@example.com" },
      { $set: expect.objectContaining({ phone: Number(PHONE) }) },
      { new: true }
    );
  });
});

describe("phone sent as a number (bug 2)", () => {
  it("is saved too, not only a string", async () => {
    await POST(req({ phone: 5512345678 }));
    expect(userModel.findOneAndUpdate).toHaveBeenCalledWith(
      { mail: "me@example.com" },
      { $set: expect.objectContaining({ phone: 5512345678 }) },
      { new: true }
    );
  });
});
