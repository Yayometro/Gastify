import { describe, it, expect, vi, afterEach } from "vitest";
import fetcher from "./fetcher";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("fetcher (bug 133)", () => {
  it("does not throw without NEXT_PUBLIC_API_ROUTE and falls back to a relative /api/ path", () => {
    vi.stubEnv("NEXT_PUBLIC_API_ROUTE", "");
    delete (process.env as Record<string, string | undefined>).NEXT_PUBLIC_API_ROUTE;
    expect(() => fetcher()).not.toThrow();
    expect(fetcher().getFullPath("x/y")).toBe("/api/x/y");
  });
  it("uses the configured base when it exists", () => {
    vi.stubEnv("NEXT_PUBLIC_API_ROUTE", "http://localhost:3000");
    expect(fetcher().getFullPath("x")).toBe("http://localhost:3000/api/x");
  });
  it("post does not log the error it rethrows", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_ROUTE", "http://localhost:3000");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    await expect(fetcher().post("x", {})).rejects.toThrow();
    expect(log).not.toHaveBeenCalled();
    log.mockRestore();
  });
});
