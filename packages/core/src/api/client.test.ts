import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { configureApi, createApiClient, getApiBaseUrl, lazyApi } from "./client";

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  fetchMock.mockResolvedValue({ json: async () => ({ ok: true }) });
  vi.stubGlobal("fetch", fetchMock);
  configureApi({ baseUrl: "", getHeaders: undefined, credentials: undefined, onStepUpRequired: undefined });
});
afterEach(() => vi.unstubAllGlobals());

describe("api client", () => {
  it("web default: same-origin /api/ path, JSON content type, no credentials override", async () => {
    await createApiClient().post("general-data/x", { a: 1 });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/general-data/x");
    expect(init.method).toBe("POST");
    expect(init.headers).toEqual({ "Content-Type": "application/json" });
    expect(init.body).toBe(JSON.stringify({ a: 1 }));
    expect("credentials" in init).toBe(false);
  });

  it("mobile: absolute base URL, extra headers (the session cookie) and credentials omit", async () => {
    configureApi({
      baseUrl: "https://api.example.com",
      getHeaders: async () => ({ Cookie: "better-auth.session_token=abc" }),
      credentials: "omit",
    });
    await createApiClient().get("general-data/y");
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.example.com/api/general-data/y");
    expect(init.headers).toEqual({ "Content-Type": "application/json", Cookie: "better-auth.session_token=abc" });
    expect(init.credentials).toBe("omit");
    expect(getApiBaseUrl()).toBe("https://api.example.com");
  });

  it("lazyApi reads the configuration at call time, not when it is created", async () => {
    const api = lazyApi();
    configureApi({ baseUrl: "https://later.example.com" });
    await api.get("z");
    expect(fetchMock.mock.calls[0][0]).toBe("https://later.example.com/api/z");
  });

  it("rethrows a failed request as an Error", async () => {
    fetchMock.mockRejectedValue(new Error("network down"));
    await expect(createApiClient().get("z")).rejects.toThrow(/network down/);
  });

  it("reports the reason once when a data route refuses the session for the second factor", async () => {
    const onStepUpRequired = vi.fn();
    configureApi({ onStepUpRequired });
    fetchMock.mockReset();
    fetchMock
      .mockResolvedValueOnce({ ok: false, json: async () => ({ ok: false, message: "No hay sesión activa" }) })
      .mockResolvedValueOnce({ json: async () => ({ ok: true, signedIn: true, stepUp: "max-age" }) });
    await createApiClient().get("wallet");
    await vi.waitFor(() => expect(onStepUpRequired).toHaveBeenCalledWith("max-age"));
    expect(fetchMock.mock.calls[1][0]).toBe("/api/session-status");
  });

  it("stays quiet when the session is still fresh: the caller shows its own error", async () => {
    const onStepUpRequired = vi.fn();
    configureApi({ onStepUpRequired });
    vi.spyOn(Date, "now").mockReturnValue(Date.now() + 60_000);
    fetchMock.mockReset();
    fetchMock
      .mockResolvedValueOnce({ ok: false, json: async () => ({ ok: false, message: "boom" }) })
      .mockResolvedValueOnce({ json: async () => ({ ok: true, signedIn: true, stepUp: "fresh" }) });
    const answer = await createApiClient().get("wallet");
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(answer).toEqual({ ok: false, message: "boom" });
    expect(onStepUpRequired).not.toHaveBeenCalled();
    vi.restoreAllMocks();
  });
});
