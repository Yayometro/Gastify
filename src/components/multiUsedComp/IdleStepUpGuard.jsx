"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { STEP_UP_TTL_MS } from "@/lib/auth/stepUpConfig";

const ACTIVITY_EVENTS = ["mousemove", "keydown", "touchstart", "click", "scroll"];

// Proactive half of the step-up freshness gate (see dashboard/layout.js for
// the authoritative server-side half). Without this, a dashboard page left
// open with no navigation would stay visibly unlocked past the freshness
// window - nothing would trigger a fresh server check until the next
// request. Redirects immediately on idle, rather than showing a blur/
// overlay on top of the still-mounted page - a blurred overlay is cosmetic
// only, the real transaction/balance data would still sit in the DOM and
// JS memory underneath it. Renders nothing; this is pure behavior.
function IdleStepUpGuard() {
  const router = useRouter();
  const timeoutRef = useRef(null);

  useEffect(() => {
    const resetTimer = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        router.push("/verify-2fa");
      }, STEP_UP_TTL_MS);
    };

    resetTimer();
    ACTIVITY_EVENTS.forEach((eventName) => window.addEventListener(eventName, resetTimer, { passive: true }));

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      ACTIVITY_EVENTS.forEach((eventName) => window.removeEventListener(eventName, resetTimer));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

export default IdleStepUpGuard;
