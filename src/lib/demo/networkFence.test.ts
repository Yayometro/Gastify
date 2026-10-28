import { describe, expect, it } from "vitest";
import { isBlockedDemoRequest } from "./networkFence";

describe("public demo network fence", () => {
  const baseUrl = "http://localhost:3004/demo";

  it.each([
    "/api/session-status",
    "https://gastify.example/api/general-data/transactions/get-all",
    "http://localhost:3000/general-data/fx/quote",
  ])("blocks data/auth API request %s", (request) => {
    expect(isBlockedDemoRequest(request, baseUrl)).toBe(true);
  });

  it.each(["/demo", "/_next/static/chunks/demo.js", "https://fonts.googleapis.com/css2?family=Inter"]) (
    "allows page assets but not backend endpoints: %s",
    (request) => {
      expect(isBlockedDemoRequest(request, baseUrl)).toBe(false);
    },
  );
});
