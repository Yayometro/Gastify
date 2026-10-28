import type { StepUpReason } from "@gastify/core/auth/sessionStatus";

// Sends the person to the second-factor screen with the reason, so that screen can explain it (see verify-2fa/page.tsx). The API
// client calls this when a data route refuses the session (packages/core/src/api/client.ts). It is a full page load, so whatever
// was open goes with it, which is why the explanation says to send unsaved changes again.
export function goToStepUp(reason: StepUpReason): void {
  if (typeof window === "undefined") return;
  const { pathname } = window.location;
  if (pathname.startsWith("/verify-2fa")) return;
  // Coming back to the same dashboard screen after confirming; anything else lands on the dashboard.
  const next = pathname.startsWith("/dashboard") ? `&next=${encodeURIComponent(pathname)}` : "";
  window.location.assign(`/verify-2fa?reason=${reason}${next}`);
}
