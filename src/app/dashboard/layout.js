import React from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/betterAuth";
import { STEP_UP_TTL_MS } from "@/lib/auth/stepUpConfig";
import Navbar from "@/components/Navbar";
import AllDataProvider from "@/components/Providers/AllDataProvider";
import ToolsFab from "@/components/multiUsedComp/ToolsFab";
import IdleStepUpGuard from "@/components/multiUsedComp/IdleStepUpGuard";

async function DashboardLayout({ children }) {
  const sesion = await auth.api.getSession({ headers: await headers() });
  // Redirect, don't throw: middleware.js only checks that a session COOKIE
  // is present (cheap, spoofable-by-design - see its own comment), not that
  // it's still valid. A cookie that's stale/invalidated by the time this
  // authoritative check runs (mid sign-out, or after some other session
  // state change) used to throw here, which Next.js renders as a hard error
  // page instead of sending the visitor anywhere useful - exactly the kind
  // of stuck state that must instead just land on /login.
  if (!sesion || !sesion.user?.email) redirect("/login");

  // Step-up freshness gate - the authoritative half (see
  // src/lib/auth/stepUpConfig.js and IdleStepUpGuard.jsx for the client-
  // side proactive half). A valid, logged-in session alone isn't enough to
  // reach the Wallet: it also has to have proven a passkey/TOTP/backup-code
  // check within the last STEP_UP_TTL_MS, on every request - not just once
  // at login - so a device left open (or picked up by someone else) can't
  // sit unlocked indefinitely.
  const stepUpAt = sesion.session.stepUpVerifiedAt ? new Date(sesion.session.stepUpVerifiedAt).getTime() : 0;
  if (Date.now() - stepUpAt > STEP_UP_TTL_MS) {
    redirect("/verify-2fa");
  }

  return (
    <AllDataProvider>
    <IdleStepUpGuard />
    <div
      className={`dashboard-layer-container walllet-bg h-full w-full flex flex-col flex-nowrap sm:flex-row m-0 p-0`}
    >
      <Navbar sesion={sesion} />
        {children}
        <ToolsFab mail={sesion.user.email} />
    </div>
    </AllDataProvider>
  );
}

export default DashboardLayout;
