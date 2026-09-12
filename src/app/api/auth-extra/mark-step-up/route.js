import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/betterAuth";
import { markStepUpVerified } from "@/lib/auth/markStepUpVerified";

// Called by the client right after ANY successful step-up proof - a
// passkey ceremony (whether used as the primary login method or on
// /verify-2fa), a TOTP code, or a backup code, from either the inline
// password-login challenge or the /verify-2fa page. Requires an already-
// valid Better Auth session (this never creates or modifies a sign-in
// itself, only records freshness on the session that already exists).
export async function POST(request) {
  const sesion = await auth.api.getSession({ headers: request.headers });
  if (!sesion) {
    return NextResponse.json({ ok: false, message: "No session" }, { status: 401 });
  }
  await markStepUpVerified(sesion.session.token);
  return NextResponse.json({ ok: true });
}
