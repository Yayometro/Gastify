import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/app/api/dbConnection", () => ({ default: vi.fn() }));
vi.mock("@/lib/auth/betterAuth", () => ({ auth: { api: { getSession: vi.fn() } } }));
vi.mock("@/model/User", () => ({ default: { findOne: vi.fn() } }));
vi.mock("@/model/Tag", () => ({ default: { findOne: vi.fn() } }));

import { POST } from "./route";
import { auth } from "@/lib/auth/betterAuth";
import User from "@/model/User";
import Tag from "@/model/Tag";

const getSession = (auth.api as unknown as { getSession: ReturnType<typeof vi.fn> }).getSession;
const userFindOne = (User as unknown as { findOne: ReturnType<typeof vi.fn> }).findOne;
const tagFindOne = (Tag as unknown as { findOne: ReturnType<typeof vi.fn> }).findOne;
const req = (body: unknown) => ({ headers: new Headers(), json: async () => body }) as unknown as Request;

const makeTag = () => ({
  name: "Food",
  color: "#ff0000",
  save: vi.fn(async function (this: unknown) {
    return this;
  }),
});

let logSpy: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  vi.clearAllMocks();
  logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  getSession.mockResolvedValue({ user: { email: "me@example.com" } });
  userFindOne.mockReturnValue({ lean: async () => ({ _id: "u1", wallet: "w1" }) });
});
afterEach(() => logSpy.mockRestore());

describe("POST tags/update", () => {
  it("can clear the colour with an empty value (bug 123)", async () => {
    const tag = makeTag();
    tagFindOne.mockResolvedValue(tag);
    await POST(req({ id: "t1", color: "" }));
    expect(tag.color).toBe("");
    expect(tag.name).toBe("Food");
  });

  it("keeps the colour when none is sent", async () => {
    const tag = makeTag();
    tagFindOne.mockResolvedValue(tag);
    await POST(req({ id: "t1", name: "Meals" }));
    expect(tag.color).toBe("#ff0000");
    expect(tag.name).toBe("Meals");
  });

  it("a tag never loses its name: an empty name leaves it as it was", async () => {
    const tag = makeTag();
    tagFindOne.mockResolvedValue(tag);
    await POST(req({ id: "t1", name: "" }));
    expect(tag.name).toBe("Food");
  });
});
