import { describe, it, expect, vi } from "vitest";

const toast = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
}));
vi.mock("react-toastify", () => ({ toast }));
vi.mock("react-toastify/dist/ReactToastify.css", () => ({}));

import runNotify from "./gastifyNotifier";

describe("runNotify (bug 134)", () => {
  it("every kind of notice starts with the message itself, with no leading space", () => {
    runNotify("ok", "hello");
    runNotify("error", "hello");
    runNotify("info", "hello");
    runNotify("warning", "hello");
    expect(toast.success.mock.calls[0][0]).toBe("hello");
    expect(toast.error.mock.calls[0][0]).toBe("hello");
    expect(toast.info.mock.calls[0][0]).toBe("hello");
    expect(toast.warn.mock.calls[0][0]).toBe("hello");
  });
});
