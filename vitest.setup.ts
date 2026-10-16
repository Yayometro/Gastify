import { vi } from "vitest";

// The data routes call getVerifiedSession() (src/lib/auth/requireVerifiedSession.ts), which wraps
// auth.api.getSession and adds the step-up check. The route tests only care about WHO the session
// is, so by default it passes straight through to whatever each test mocked for auth.api.getSession.
// The helper itself is tested for real in requireVerifiedSession.test.ts through vi.importActual.
vi.mock("@/lib/auth/requireVerifiedSession", async () => {
  const { auth } = await import("@/lib/auth/betterAuth");
  return { getVerifiedSession: (headers: Headers) => auth.api.getSession({ headers }) };
});
