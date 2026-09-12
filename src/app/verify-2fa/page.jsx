import React from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/betterAuth";
import { STEP_UP_TTL_MS } from "@/lib/auth/stepUpConfig";
import Verify2FAClient from "@/components/Verify2FAClient";

export const dynamic = "force-dynamic";

async function Verify2FAPage() {
  const sesion = await auth.api.getSession({ headers: await headers() });
  if (!sesion) redirect("/login");

  // Already fresh - nothing to verify, don't make them do it again.
  const stepUpAt = sesion.session.stepUpVerifiedAt ? new Date(sesion.session.stepUpVerifiedAt).getTime() : 0;
  if (Date.now() - stepUpAt <= STEP_UP_TTL_MS) redirect("/dashboard");

  return (
    <div className="bg-gf-bg p-4 w-full h-screen flex justify-center items-center bg-origin-border bg-center" style={{ backgroundImage: "url('/infoTwo.jpg')" }}>
      <Verify2FAClient />
    </div>
  );
}

export default Verify2FAPage;
