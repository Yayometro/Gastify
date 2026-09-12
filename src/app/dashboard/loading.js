"use client";

import { useEffect } from "react";

// Next.js route-segment loading UI: without a file like this, `router.push`
// keeps showing the PREVIOUS page - here, Verify2FAClient's "¡Listo!
// Llevándote a tu Wallet…" transition - until this whole segment (this
// layout's own session/step-up check, the dashboard page, everything) has
// fully resolved server-side, which is where the reported few-second stall
// on that transition screen came from. Next.js wraps this segment in a
// Suspense boundary automatically when this file exists, so navigation
// swaps to this instead the instant it starts, and the real dashboard
// streams in behind it - the goal explicitly asked for: get the user
// looking at their Wallet as fast as possible, loaded or not, rather than
// making them wait on a separate screen first.
function DashboardLoading() {
  useEffect(() => {
    import("ldrs").then(({ quantum }) => quantum.register());
  }, []);

  return (
    <div className="walllet-bg h-screen w-full flex items-center justify-center">
      <l-quantum size="120" speed="3.1" color="purple"></l-quantum>
    </div>
  );
}

export default DashboardLoading;
