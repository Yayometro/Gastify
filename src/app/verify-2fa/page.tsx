import React from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/betterAuth";
import { FACTOR_CHANGE_STEP_UP_TTL_MS, STEP_UP_TTL_MS } from "@/lib/auth/stepUpConfig";
import { safeNextPath } from "@/lib/auth/factorChangePolicy";
import Verify2FAClient from "@/components/Verify2FAClient";

export const dynamic = "force-dynamic";

export interface Verify2FAPageProps {
  searchParams?: Promise<{ reauth?: string; next?: string }> | { reauth?: string; next?: string };
}

async function Verify2FAPage({ searchParams }: Verify2FAPageProps = {}): Promise<React.JSX.Element> {
  const sesion = await auth.api.getSession({ headers: await headers() });
  if (!sesion) redirect("/login");

  const params = (await searchParams) || {};
  // ?reauth=1 comes from a factor change (profile) that needs a FRESHER proof
  // than the dashboard does, so the stamp is judged against the shorter window
  // here; otherwise a stamp between 5 and 15 minutes old would bounce this page
  // straight back to the dashboard and the user could never refresh it.
  const reauth = params.reauth === "1";
  const nextPath = safeNextPath(params.next);

  // Already fresh - nothing to verify, don't make them do it again.
  const stepUpAt = sesion.session.stepUpVerifiedAt ? new Date(sesion.session.stepUpVerifiedAt).getTime() : 0;
  const freshWindow = reauth ? FACTOR_CHANGE_STEP_UP_TTL_MS : STEP_UP_TTL_MS;
  if (Date.now() - stepUpAt <= freshWindow) redirect(reauth && nextPath ? nextPath : "/dashboard");

  return (
    <div className="bg-gf-bg p-4 w-full h-screen flex justify-center items-center bg-origin-border bg-center" style={{ backgroundImage: "url('/infoTwo.jpg')" }}>
      <Verify2FAClient nextPath={nextPath} reauth={reauth} />
    </div>
  );
}

export default Verify2FAPage;
